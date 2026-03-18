import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import { headers } from "next/headers";
import { db } from "./db";
import { users, tenants, patients, patientPortalTokens, userSessions } from "./db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logAudit } from "./lib/audit";
import { rateLimitAuth } from "./lib/rate-limit";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    roleSlug: string;
    tenantName?: string;
    patientId?: string;
  }

  interface Session {
    user: User;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    tenantId: string;
    roleSlug: string;
    tenantName?: string;
    patientId?: string;
    sessionId?: string;
  }
}

const OAUTH_PROVIDERS = ["google", "azure-ad"] as const;

async function upsertUserSessionFromToken(token: import("@auth/core/jwt").JWT) {
  if (!token.id || !token.tenantId || !token.sessionId) return;

  const hdrs = headers();
  const userAgent = hdrs.get("user-agent") ?? undefined;
  const forwardedFor = hdrs.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || undefined;

  const now = new Date();

  const [existing] = await db
    .select({
      id: userSessions.id,
      revokedAt: userSessions.revokedAt,
    })
    .from(userSessions)
    .where(eq(userSessions.sessionId, token.sessionId))
    .limit(1);

  if (existing) {
    await db
      .update(userSessions)
      .set({
        lastUsedAt: now,
        ...(userAgent ? { userAgent } : {}),
        ...(ipAddress ? { ipAddress } : {}),
      })
      .where(eq(userSessions.id, existing.id));

    if (existing.revokedAt) {
      token.id = "";
      token.tenantId = "";
      token.roleSlug = "";
    }
    return;
  }

  await db.insert(userSessions).values({
    userId: token.id,
    tenantId: token.tenantId,
    sessionId: token.sessionId,
    userAgent,
    ipAddress,
    createdAt: now,
    lastUsedAt: now,
  });
}

// Production (e.g. DigitalOcean): set AUTH_TRUST_HOST=true and AUTH_URL in env to avoid 503 UntrustedHost.
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    ...(process.env.AUTH_MICROSOFT_ID && process.env.AUTH_MICROSOFT_SECRET
      ? [
          AzureAD({
            clientId: process.env.AUTH_MICROSOFT_ID,
            clientSecret: process.env.AUTH_MICROSOFT_SECRET,
            tenantId: process.env.AUTH_MICROSOFT_TENANT_ID ?? "common",
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        let email = String(credentials.email).trim().toLowerCase();
        if (email === "demo" || email === "demo@example" || email === "demo@example.com") {
          email = "thefertilityos@gmail.com";
        }
        const password = String(credentials.password);

        const hdrs = await headers();
        const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
        const { allowed } = rateLimitAuth(`${ip}:${email}`);
        if (!allowed) {
          throw new Error("Too many sign-in attempts. Try again in 15 minutes.");
        }

        const conditions = [eq(users.email, email)];
        const tenantSlug = hdrs.get("x-tenant-slug");
        const isDemoEmail = email === "thefertilityos@gmail.com";
        if (!isDemoEmail && tenantSlug) {
          const [tenant] = await db
            .select({ id: tenants.id })
            .from(tenants)
            .where(eq(tenants.slug, tenantSlug))
            .limit(1);
          if (tenant) conditions.push(eq(users.tenantId, tenant.id));
        } else if (isDemoEmail) {
          // Prefer demo-clinic tenant so correct clinic loads; fall back to any tenant
          const [demoTenant] = await db
            .select({ id: tenants.id })
            .from(tenants)
            .where(eq(tenants.slug, "demo-clinic"))
            .limit(1);
          if (demoTenant) conditions.push(eq(users.tenantId, demoTenant.id));
        }

        let row = await db
          .select({
            id: users.id,
            email: users.email,
            fullName: users.fullName,
            passwordHash: users.passwordHash,
            tenantId: users.tenantId,
            roleSlug: users.roleSlug,
            tenantName: tenants.name,
          })
          .from(users)
          .innerJoin(tenants, eq(users.tenantId, tenants.id))
          .where(and(...conditions))
          .limit(1)
          .then((rows) => rows[0]);

        // Demo user: if not found in demo-clinic, try any tenant (handles seed in different tenant)
        if (isDemoEmail && !row) {
          row = await db
            .select({
              id: users.id,
              email: users.email,
              fullName: users.fullName,
              passwordHash: users.passwordHash,
              tenantId: users.tenantId,
              roleSlug: users.roleSlug,
              tenantName: tenants.name,
            })
            .from(users)
            .innerJoin(tenants, eq(users.tenantId, tenants.id))
            .where(eq(users.email, email))
            .limit(1)
            .then((rows) => rows[0]);
        }

        if (!row || !row.passwordHash) return null;
        const ok = await bcrypt.compare(password, row.passwordHash);
        if (!ok) {
          void logAudit({
            tenantId: row.tenantId,
            userId: row.id,
            action: "auth.sign_in_failed",
            entityType: "user",
            entityId: row.id,
            details: { email: row.email },
          }).catch(() => {});
          return null;
        }

        return {
          id: row.id,
          email: row.email,
          name: row.fullName,
          tenantId: row.tenantId,
          roleSlug: row.roleSlug,
          tenantName: row.tenantName ?? undefined,
        };
      },
    }),
    Credentials({
      id: "portal-token",
      name: "Portal magic link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.token ? String(credentials.token).trim() : null;
        if (!token) return null;

        const [row] = await db
          .select({
            tokenId: patientPortalTokens.id,
            patientId: patients.id,
            email: patients.email,
            firstName: patients.firstName,
            lastName: patients.lastName,
            tenantId: patients.tenantId,
          })
          .from(patientPortalTokens)
          .innerJoin(patients, eq(patientPortalTokens.patientId, patients.id))
          .where(
            and(
              eq(patientPortalTokens.token, token),
              gt(patientPortalTokens.expiresAt, new Date()),
              isNull(patientPortalTokens.usedAt)
            )
          )
          .limit(1);

        if (!row || !row.patientId) return null;

        await db
          .update(patientPortalTokens)
          .set({ usedAt: new Date() })
          .where(eq(patientPortalTokens.id, row.tokenId));

        const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || "Patient";
        return {
          id: row.patientId,
          email: row.email ?? "",
          name,
          tenantId: row.tenantId,
          roleSlug: "patient",
          patientId: row.patientId,
        };
      },
    }),
    Credentials({
      id: "portal-password",
      name: "Portal email + password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        const hdrs = await headers();
        const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
        const { allowed } = rateLimitAuth(`${ip}:${email}`);
        if (!allowed) {
          throw new Error("Too many sign-in attempts. Try again in 15 minutes.");
        }

        const [row] = await db
          .select({
            id: patients.id,
            email: patients.email,
            firstName: patients.firstName,
            lastName: patients.lastName,
            tenantId: patients.tenantId,
            passwordHash: patients.passwordHash,
          })
          .from(patients)
          .where(eq(patients.email, email))
          .limit(1);

        if (!row || !row.passwordHash) return null;
        const ok = await bcrypt.compare(password, row.passwordHash);
        if (!ok) return null;

        const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || "Patient";
        return {
          id: row.id,
          email: row.email ?? "",
          name,
          tenantId: row.tenantId,
          roleSlug: "patient",
          patientId: row.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (!token.sessionId) {
        token.sessionId = crypto.randomUUID();
      }
      // OAuth sign-in: resolve or create user in DB and set token from our user shape (dynamic import to avoid Node crypto in Edge)
      if (account && OAUTH_PROVIDERS.includes(account.provider as (typeof OAUTH_PROVIDERS)[number])) {
        const oauthEmail = (user?.email ?? token.email ?? "") as string;
        const oauthName = (user?.name ?? token.name ?? oauthEmail) as string;
        const { getOrCreateOAuthUser } = await import("./lib/auth-oauth");
        const resolved = await getOrCreateOAuthUser(
          account.provider,
          account.providerAccountId,
          oauthEmail,
          oauthName
        );
        if (resolved) {
          token.id = resolved.id;
          token.email = resolved.email;
          token.name = resolved.name;
          token.tenantId = resolved.tenantId;
          token.roleSlug = resolved.roleSlug;
          token.tenantName = resolved.tenantName;
          token.patientId = undefined;
          void logAudit({
            tenantId: resolved.tenantId,
            userId: resolved.id,
            action: "auth.sign_in",
            entityType: "user",
            entityId: resolved.id,
            details: { email: resolved.email, roleSlug: resolved.roleSlug, provider: account.provider },
          }).catch(() => {});
        }
        await upsertUserSessionFromToken(token as any);
        return token;
      }
      // Credentials / portal-token sign-in
      if (user) {
        token.id = user.id;
        token.email = user.email ?? "";
        token.name = user.name ?? "";
        token.tenantId = user.tenantId;
        token.roleSlug = user.roleSlug;
        token.tenantName = (user as { tenantName?: string }).tenantName;
        token.patientId = (user as { patientId?: string }).patientId;
        void logAudit({
          tenantId: user.tenantId,
          userId: user.id,
          action: "auth.sign_in",
          entityType: "user",
          entityId: user.id,
          details: { email: user.email, roleSlug: user.roleSlug },
        }).catch(() => {});
      }
      await upsertUserSessionFromToken(token as any);
      return token;
    },
    async session({ session, token }) {
      if (!token.id) {
        return null as any;
      }
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.email = token.email ?? "";
        session.user.name = token.name ?? "";
        session.user.tenantId = token.tenantId ?? "";
        session.user.roleSlug = token.roleSlug ?? "staff";
        session.user.tenantName = token.tenantName ?? undefined;
        session.user.patientId = token.patientId ?? undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
});
