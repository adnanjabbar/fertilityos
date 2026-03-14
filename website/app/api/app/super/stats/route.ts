import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  tenants,
  users,
  invitations,
  patients,
  appointments,
  ivfCycles,
  invoices,
} from "@/db/schema";
import { eq, sql, desc, isNull, ne } from "drizzle-orm";

/**
 * GET /api/app/super/stats
 * Platform-wide aggregates for Super Admin dashboard. Only role super_admin.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "super_admin") {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  try {
    const systemTenantSlug = "system";

    const [tenantsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tenants)
      .where(ne(tenants.slug, systemTenantSlug));

    const [usersCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .innerJoin(tenants, eq(users.tenantId, tenants.id))
      .where(ne(tenants.slug, systemTenantSlug));

    const [pendingInvitesCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invitations)
      .where(isNull(invitations.acceptedAt));

    const usersByRole = await db
      .select({
        roleSlug: users.roleSlug,
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(users)
      .innerJoin(tenants, eq(users.tenantId, tenants.id))
      .where(ne(tenants.slug, systemTenantSlug))
      .groupBy(users.roleSlug);

    const recentTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        country: tenants.country,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .where(ne(tenants.slug, systemTenantSlug))
      .orderBy(desc(tenants.createdAt))
      .limit(20);

    const tenantUserCounts = await db
      .select({
        tenantId: users.tenantId,
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(users)
      .innerJoin(tenants, eq(users.tenantId, tenants.id))
      .where(ne(tenants.slug, systemTenantSlug))
      .groupBy(users.tenantId);

    const pendingInvitations = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        roleSlug: invitations.roleSlug,
        expiresAt: invitations.expiresAt,
        tenantName: tenants.name,
      })
      .from(invitations)
      .innerJoin(tenants, eq(invitations.tenantId, tenants.id))
      .where(isNull(invitations.acceptedAt))
      .orderBy(desc(invitations.createdAt))
      .limit(50);

    const [patientsCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(patients)
      .innerJoin(tenants, eq(patients.tenantId, tenants.id))
      .where(ne(tenants.slug, systemTenantSlug));
    const patientsCount = patientsCountRow?.count ?? 0;

    const [appointmentsCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .innerJoin(tenants, eq(appointments.tenantId, tenants.id))
      .where(ne(tenants.slug, systemTenantSlug));
    const appointmentsCount = appointmentsCountRow?.count ?? 0;

    const [ivfCyclesCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ivfCycles)
      .innerJoin(tenants, eq(ivfCycles.tenantId, tenants.id))
      .where(ne(tenants.slug, systemTenantSlug));
    const ivfCyclesCount = ivfCyclesCountRow?.count ?? 0;

    const [invoicesCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .innerJoin(tenants, eq(invoices.tenantId, tenants.id))
      .where(ne(tenants.slug, systemTenantSlug));
    const invoicesCount = invoicesCountRow?.count ?? 0;

    return NextResponse.json({
      overview: {
        clinicsOnboarded: tenantsCount?.count ?? 0,
        totalUsers: usersCount?.count ?? 0,
        pendingInvitations: pendingInvitesCount?.count ?? 0,
        patientsServed: patientsCount,
        appointmentsCount,
        ivfCyclesSupported: ivfCyclesCount,
      },
      usersByRole: usersByRole.map((r) => ({ role: r.roleSlug, count: r.count })),
      recentTenants,
      tenantUserCounts: tenantUserCounts.map((t) => ({
        tenantId: t.tenantId,
        userCount: t.count,
      })),
      pendingInvitations,
      modules: {
        patientManagement: "active",
        scheduling: "active",
        emr: "active",
        ivfLab: "active",
        billing: "active",
      },
      invoicesCount,
    });
  } catch (e) {
    console.error("super/stats error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load stats" },
      { status: 500 }
    );
  }
}
