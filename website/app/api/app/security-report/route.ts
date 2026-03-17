import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { and, count, eq, gte } from "drizzle-orm";

function daysAgo(days: number): Date {
  const now = new Date();
  const d = new Date(now.getTime());
  d.setDate(d.getDate() - days);
  return d;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const tenantId = session.user.tenantId;
  const since7d = daysAgo(7);
  const since30d = daysAgo(30);

  const [failedLogins7d] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenantId),
        eq(auditLogs.action, "auth.sign_in_failed"),
        gte(auditLogs.createdAt, since7d),
      ),
    );

  const [failedLogins30d] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenantId),
        eq(auditLogs.action, "auth.sign_in_failed"),
        gte(auditLogs.createdAt, since30d),
      ),
    );

  const [successfulLogins7d] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenantId),
        eq(auditLogs.action, "auth.sign_in"),
        gte(auditLogs.createdAt, since7d),
      ),
    );

  const [successfulLogins30d] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenantId),
        eq(auditLogs.action, "auth.sign_in"),
        gte(auditLogs.createdAt, since30d),
      ),
    );

  const [otpSend7d] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenantId),
        eq(auditLogs.action, "auth.phone_verification_sent"),
        gte(auditLogs.createdAt, since7d),
      ),
    );

  const [otpSend30d] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenantId),
        eq(auditLogs.action, "auth.phone_verification_sent"),
        gte(auditLogs.createdAt, since30d),
      ),
    );

  const [otpFail7d] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenantId),
        eq(auditLogs.action, "auth.phone_verification_failed"),
        gte(auditLogs.createdAt, since7d),
      ),
    );

  const [otpFail30d] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenantId),
        eq(auditLogs.action, "auth.phone_verification_failed"),
        gte(auditLogs.createdAt, since30d),
      ),
    );

  const [lockouts7d] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenantId),
        eq(auditLogs.action, "auth.lockout"),
        gte(auditLogs.createdAt, since7d),
      ),
    );

  const [lockouts30d] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tenantId, tenantId),
        eq(auditLogs.action, "auth.lockout"),
        gte(auditLogs.createdAt, since30d),
      ),
    );

  return NextResponse.json({
    failedLogins7d: failedLogins7d?.count ?? 0,
    failedLogins30d: failedLogins30d?.count ?? 0,
    successfulLogins7d: successfulLogins7d?.count ?? 0,
    successfulLogins30d: successfulLogins30d?.count ?? 0,
    otpSend7d: otpSend7d?.count ?? 0,
    otpSend30d: otpSend30d?.count ?? 0,
    otpFail7d: otpFail7d?.count ?? 0,
    otpFail30d: otpFail30d?.count ?? 0,
    lockouts7d: lockouts7d?.count ?? 0,
    lockouts30d: lockouts30d?.count ?? 0,
  });
}

