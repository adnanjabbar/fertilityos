import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { users, tenants } from "./db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    roleSlug: string;
    tenantName?: string;
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
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        const [row] = await db
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
          .limit(1);

        if (!row || !row.passwordHash) return null;
        const ok = await bcrypt.compare(password, row.passwordHash);
        if (!ok) return null;

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
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? "";
        token.name = user.name ?? "";
        token.tenantId = user.tenantId;
        token.roleSlug = user.roleSlug;
        token.tenantName = (user as { tenantName?: string }).tenantName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.email = token.email ?? "";
        session.user.name = token.name ?? "";
        session.user.tenantId = token.tenantId ?? "";
        session.user.roleSlug = token.roleSlug ?? "staff";
        session.user.tenantName = token.tenantName ?? undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
});
