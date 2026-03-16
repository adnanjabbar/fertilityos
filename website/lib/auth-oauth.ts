// Edge-safe IDs (no node:crypto — auth can be loaded in middleware)
function randomUUIDLike(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

import { db } from "../db";
import { users, tenants, userAccounts } from "../db/schema";
import { eq, and } from "drizzle-orm";

export type OAuthResolvedUser = {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  roleSlug: string;
  tenantName: string;
};

export async function getOrCreateOAuthUser(
  provider: string,
  providerAccountId: string,
  email: string,
  fullName: string
): Promise<OAuthResolvedUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  // 1) Find by provider + providerAccountId in user_accounts
  const [linked] = await db
    .select({
      userId: userAccounts.userId,
      userEmail: users.email,
      userFullName: users.fullName,
      userTenantId: users.tenantId,
      userRoleSlug: users.roleSlug,
      tenantName: tenants.name,
    })
    .from(userAccounts)
    .innerJoin(users, eq(userAccounts.userId, users.id))
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .where(
      and(
        eq(userAccounts.provider, provider),
        eq(userAccounts.providerAccountId, providerAccountId)
      )
    )
    .limit(1);

  if (linked) {
    return {
      id: linked.userId,
      email: linked.userEmail,
      name: linked.userFullName,
      tenantId: linked.userTenantId,
      roleSlug: linked.userRoleSlug,
      tenantName: linked.tenantName,
    };
  }

  // 2) Find by email in users (any tenant); if found, link account and return
  const existingUsers = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      tenantId: users.tenantId,
      roleSlug: users.roleSlug,
      tenantName: tenants.name,
    })
    .from(users)
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUsers.length > 0) {
    const u = existingUsers[0];
    await db
      .insert(userAccounts)
      .values({
        userId: u.id,
        provider,
        providerAccountId,
      })
      .onConflictDoNothing({
        target: [userAccounts.provider, userAccounts.providerAccountId],
      });
    return {
      id: u.id,
      email: u.email,
      name: u.fullName,
      tenantId: u.tenantId,
      roleSlug: u.roleSlug,
      tenantName: u.tenantName,
    };
  }

  // 3) New user: create placeholder tenant + user + user_accounts
  const tenantId = randomUUIDLike();
  const slug = `oauth-user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  await db.insert(tenants).values({
    id: tenantId,
    name: "OAuth User",
    slug,
    country: "US",
  });

  const [inserted] = await db
    .insert(users)
    .values({
      tenantId,
      email: normalizedEmail,
      fullName: fullName || normalizedEmail,
      roleSlug: "staff",
      passwordHash: null,
    })
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      tenantId: users.tenantId,
      roleSlug: users.roleSlug,
    });

  if (!inserted) return null;

  await db.insert(userAccounts).values({
    userId: inserted.id,
    provider,
    providerAccountId,
  });

  return {
    id: inserted.id,
    email: inserted.email,
    name: inserted.fullName,
    tenantId: inserted.tenantId,
    roleSlug: inserted.roleSlug,
    tenantName: "OAuth User",
  };
}
