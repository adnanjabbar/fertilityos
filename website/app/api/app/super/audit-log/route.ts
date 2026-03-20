import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { platformAdminAuditLog, tenants, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

/**
 * GET /api/app/super/audit-log?page=1&limit=50&tenantId=optional
 * Platform-wide compliance log of super-admin configuration changes.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.roleSlug !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
  const offset = (page - 1) * limit;
  const filterTenantId = searchParams.get("tenantId")?.trim() || null;

  const selectFields = {
    id: platformAdminAuditLog.id,
    tenantId: platformAdminAuditLog.tenantId,
    tenantName: tenants.name,
    tenantSlug: tenants.slug,
    eventType: platformAdminAuditLog.eventType,
    previousState: platformAdminAuditLog.previousState,
    newState: platformAdminAuditLog.newState,
    complianceTags: platformAdminAuditLog.complianceTags,
    notes: platformAdminAuditLog.notes,
    ipAddress: platformAdminAuditLog.ipAddress,
    createdAt: platformAdminAuditLog.createdAt,
    actorEmail: users.email,
    actorName: users.fullName,
  };

  const base = db
    .select(selectFields)
    .from(platformAdminAuditLog)
    .innerJoin(tenants, eq(platformAdminAuditLog.tenantId, tenants.id))
    .leftJoin(users, eq(platformAdminAuditLog.actorUserId, users.id));

  const [countRow] = filterTenantId
    ? await db
        .select({ count: sql<number>`count(*)::int` })
        .from(platformAdminAuditLog)
        .where(eq(platformAdminAuditLog.tenantId, filterTenantId))
    : await db.select({ count: sql<number>`count(*)::int` }).from(platformAdminAuditLog);

  const rows = filterTenantId
    ? await base
        .where(eq(platformAdminAuditLog.tenantId, filterTenantId))
        .orderBy(desc(platformAdminAuditLog.createdAt))
        .limit(limit)
        .offset(offset)
    : await base
        .orderBy(desc(platformAdminAuditLog.createdAt))
        .limit(limit)
        .offset(offset);

  const total = countRow?.count ?? 0;

  return NextResponse.json({
    entries: rows.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      tenantName: r.tenantName,
      tenantSlug: r.tenantSlug,
      eventType: r.eventType,
      previousState: r.previousState,
      newState: r.newState,
      complianceTags: r.complianceTags,
      notes: r.notes,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt.toISOString(),
      actorEmail: r.actorEmail,
      actorName: r.actorName,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  });
}
