import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants, platformAdminAuditLog, users } from "@/db/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";

type RouteContext = { params: Promise<{ tenantId: string }> };

/**
 * GET /api/app/super/tenants/[tenantId]/audit-log?page=1&limit=30
 * Immutable platform admin change history for this clinic (GDPR/HIPAA accountability).
 */
export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.roleSlug !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tenantId } = await context.params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "30", 10) || 30));
  const offset = (page - 1) * limit;

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(and(eq(tenants.id, tenantId), ne(tenants.slug, "system")))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(platformAdminAuditLog)
    .where(eq(platformAdminAuditLog.tenantId, tenantId));

  const rows = await db
    .select({
      id: platformAdminAuditLog.id,
      eventType: platformAdminAuditLog.eventType,
      previousState: platformAdminAuditLog.previousState,
      newState: platformAdminAuditLog.newState,
      complianceTags: platformAdminAuditLog.complianceTags,
      notes: platformAdminAuditLog.notes,
      ipAddress: platformAdminAuditLog.ipAddress,
      createdAt: platformAdminAuditLog.createdAt,
      actorEmail: users.email,
      actorName: users.fullName,
    })
    .from(platformAdminAuditLog)
    .leftJoin(users, eq(platformAdminAuditLog.actorUserId, users.id))
    .where(eq(platformAdminAuditLog.tenantId, tenantId))
    .orderBy(desc(platformAdminAuditLog.createdAt))
    .limit(limit)
    .offset(offset);

  const total = countRow?.count ?? 0;

  return NextResponse.json({
    entries: rows.map((r) => ({
      id: r.id,
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
