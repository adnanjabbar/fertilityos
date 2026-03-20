/**
 * Shared SQL helpers for Super Admin platform KPIs (Phase 1 data foundation).
 */

import { db } from "@/db";
import {
  tenants,
  users,
  invoices,
  tenantSubscriptions,
  patients,
  appointments,
  ivfCycles,
} from "@/db/schema";
import { eq, ne, and, inArray, sql, or, ilike, desc } from "drizzle-orm";

function sanitizeIlikePattern(raw: string): string {
  return `%${raw.replace(/[%_\\]/g, "")}%`;
}

export const SYSTEM_TENANT_SLUG = "system";

export function nonSystemTenantCondition() {
  return ne(tenants.slug, SYSTEM_TENANT_SLUG);
}

/** Distinct countries among clinic tenants (excludes system). */
export async function getCountriesServedCount(): Promise<number> {
  const [row] = await db
    .select({
      count: sql<number>`count(distinct ${tenants.country})::int`,
    })
    .from(tenants)
    .where(nonSystemTenantCondition());
  return row?.count ?? 0;
}

/** Clinics per country for maps / breakdowns. */
export async function getClinicsByCountry(): Promise<
  { country: string; clinicCount: number }[]
> {
  const rows = await db
    .select({
      country: tenants.country,
      clinicCount: sql<number>`count(*)::int`.as("clinic_count"),
    })
    .from(tenants)
    .where(nonSystemTenantCondition())
    .groupBy(tenants.country)
    .orderBy(tenants.country);
  return rows.map((r) => ({
    country: r.country,
    clinicCount: r.clinicCount,
  }));
}

/** Staff users with role admin (clinic admins), excluding system tenant. */
export async function getAdminUsersCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .where(and(nonSystemTenantCondition(), eq(users.roleSlug, "admin")));
  return row?.count ?? 0;
}

/** Subscription rows grouped by status (only clinic tenants). */
export async function getSubscriptionsByStatus(): Promise<
  Record<string, number>
> {
  const rows = await db
    .select({
      status: tenantSubscriptions.status,
      count: sql<number>`count(*)::int`.as("cnt"),
    })
    .from(tenantSubscriptions)
    .innerJoin(tenants, eq(tenantSubscriptions.tenantId, tenants.id))
    .where(nonSystemTenantCondition())
    .groupBy(tenantSubscriptions.status);
  const out: Record<string, number> = {};
  for (const r of rows) {
    out[r.status] = r.count;
  }
  return out;
}

export type InvoiceCurrencyRollup = {
  currency: string;
  paidTotal: string;
  outstandingTotal: string;
  paidCount: number;
  outstandingCount: number;
};

/**
 * Invoice amounts rolled up per currency (clinic tenants only).
 * Paid = status paid. Outstanding = sent, overdue, or draft.
 */
export async function getInvoiceTotalsByCurrency(): Promise<
  InvoiceCurrencyRollup[]
> {
  const paidStatuses = ["paid"] as const;
  const outstandingStatuses = ["sent", "overdue", "draft"] as const;

  const paidRows = await db
    .select({
      currency: invoices.currency,
      total: sql<string>`coalesce(sum(cast(${invoices.totalAmount} as numeric)), 0)::text`,
      cnt: sql<number>`count(*)::int`,
    })
    .from(invoices)
    .innerJoin(tenants, eq(invoices.tenantId, tenants.id))
    .where(
      and(nonSystemTenantCondition(), inArray(invoices.status, [...paidStatuses]))
    )
    .groupBy(invoices.currency);

  const outRows = await db
    .select({
      currency: invoices.currency,
      total: sql<string>`coalesce(sum(cast(${invoices.totalAmount} as numeric)), 0)::text`,
      cnt: sql<number>`count(*)::int`,
    })
    .from(invoices)
    .innerJoin(tenants, eq(invoices.tenantId, tenants.id))
    .where(
      and(
        nonSystemTenantCondition(),
        inArray(invoices.status, [...outstandingStatuses])
      )
    )
    .groupBy(invoices.currency);

  const byCurrency = new Map<string, InvoiceCurrencyRollup>();

  for (const r of paidRows) {
    const c = r.currency || "USD";
    byCurrency.set(c, {
      currency: c,
      paidTotal: r.total,
      outstandingTotal: "0",
      paidCount: r.cnt,
      outstandingCount: 0,
    });
  }
  for (const r of outRows) {
    const c = r.currency || "USD";
    const existing = byCurrency.get(c) ?? {
      currency: c,
      paidTotal: "0",
      outstandingTotal: "0",
      paidCount: 0,
      outstandingCount: 0,
    };
    existing.outstandingTotal = r.total;
    existing.outstandingCount = r.cnt;
    byCurrency.set(c, existing);
  }

  return Array.from(byCurrency.values()).sort((a, b) =>
    a.currency.localeCompare(b.currency)
  );
}

export type TenantListRow = {
  id: string;
  name: string;
  slug: string;
  country: string;
  city: string | null;
  state: string | null;
  createdAt: Date;
  subscriptionStatus: string | null;
  billingPlan: string | null;
};

/** Paginated clinic tenants for super admin tables. */
export async function listClinicTenants(params: {
  page: number;
  limit: number;
  q?: string;
}): Promise<{ rows: TenantListRow[]; total: number }> {
  const { page, limit, q } = params;
  const offset = (page - 1) * limit;
  const search = q?.trim();
  const pattern = search ? sanitizeIlikePattern(search) : null;

  const whereClause = pattern
    ? and(
        nonSystemTenantCondition(),
        or(ilike(tenants.name, pattern), ilike(tenants.slug, pattern))
      )
    : nonSystemTenantCondition();

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tenants)
    .where(whereClause);

  const rows = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      country: tenants.country,
      city: tenants.city,
      state: tenants.state,
      createdAt: tenants.createdAt,
      subscriptionStatus: tenantSubscriptions.status,
      billingPlan: tenantSubscriptions.billingPlan,
    })
    .from(tenants)
    .leftJoin(
      tenantSubscriptions,
      eq(tenantSubscriptions.tenantId, tenants.id)
    )
    .where(whereClause)
    .orderBy(desc(tenants.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      country: r.country,
      city: r.city,
      state: r.state,
      createdAt: r.createdAt,
      subscriptionStatus: r.subscriptionStatus,
      billingPlan: r.billingPlan,
    })),
    total: countRow?.count ?? 0,
  };
}

export type TenantDeepDive = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    country: string;
    city: string | null;
    state: string | null;
    defaultCurrency: string;
    enabledModules: string | null;
    createdAt: Date;
  };
  subscription: {
    status: string;
    billingPlan: string;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    currentPeriodEnd: Date | null;
    stripePriceId: string | null;
    updatedAt: Date;
  } | null;
  counts: {
    users: number;
    patients: number;
    appointments: number;
    ivfCycles: number;
    invoices: number;
  };
  usersByRole: { role: string; count: number }[];
  ivfCyclesByStatus: { status: string; count: number }[];
  invoiceRollups: InvoiceCurrencyRollup[];
};

/** Full clinic snapshot for super admin drill-down (no patient PII). */
export async function getTenantDeepDive(
  tenantId: string
): Promise<TenantDeepDive | null> {
  const [tenant] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      country: tenants.country,
      city: tenants.city,
      state: tenants.state,
      defaultCurrency: tenants.defaultCurrency,
      enabledModules: tenants.enabledModules,
      createdAt: tenants.createdAt,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant || tenant.slug === SYSTEM_TENANT_SLUG) return null;

  const [sub] = await db
    .select({
      status: tenantSubscriptions.status,
      billingPlan: tenantSubscriptions.billingPlan,
      stripeSubscriptionId: tenantSubscriptions.stripeSubscriptionId,
      stripeCustomerId: tenantSubscriptions.stripeCustomerId,
      currentPeriodEnd: tenantSubscriptions.currentPeriodEnd,
      stripePriceId: tenantSubscriptions.stripePriceId,
      updatedAt: tenantSubscriptions.updatedAt,
    })
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  const usersByRole = await db
    .select({
      roleSlug: users.roleSlug,
      count: sql<number>`count(*)::int`.as("cnt"),
    })
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .groupBy(users.roleSlug);

  const [userCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.tenantId, tenantId));

  const [patientCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(patients)
    .where(eq(patients.tenantId, tenantId));

  const [apptCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointments)
    .where(eq(appointments.tenantId, tenantId));

  const [ivfCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ivfCycles)
    .where(eq(ivfCycles.tenantId, tenantId));

  const ivfByStatus = await db
    .select({
      status: ivfCycles.status,
      count: sql<number>`count(*)::int`.as("cnt"),
    })
    .from(ivfCycles)
    .where(eq(ivfCycles.tenantId, tenantId))
    .groupBy(ivfCycles.status);

  const [invCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoices)
    .where(eq(invoices.tenantId, tenantId));

  const paidRows = await db
    .select({
      currency: invoices.currency,
      total: sql<string>`coalesce(sum(cast(${invoices.totalAmount} as numeric)), 0)::text`,
      cnt: sql<number>`count(*)::int`,
    })
    .from(invoices)
    .where(
      and(eq(invoices.tenantId, tenantId), eq(invoices.status, "paid"))
    )
    .groupBy(invoices.currency);

  const outRows = await db
    .select({
      currency: invoices.currency,
      total: sql<string>`coalesce(sum(cast(${invoices.totalAmount} as numeric)), 0)::text`,
      cnt: sql<number>`count(*)::int`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.tenantId, tenantId),
        inArray(invoices.status, ["sent", "overdue", "draft"])
      )
    )
    .groupBy(invoices.currency);

  const byCurrency = new Map<string, InvoiceCurrencyRollup>();
  for (const r of paidRows) {
    const c = r.currency || "USD";
    byCurrency.set(c, {
      currency: c,
      paidTotal: r.total,
      outstandingTotal: "0",
      paidCount: r.cnt,
      outstandingCount: 0,
    });
  }
  for (const r of outRows) {
    const c = r.currency || "USD";
    const existing = byCurrency.get(c) ?? {
      currency: c,
      paidTotal: "0",
      outstandingTotal: "0",
      paidCount: 0,
      outstandingCount: 0,
    };
    existing.outstandingTotal = r.total;
    existing.outstandingCount = r.cnt;
    byCurrency.set(c, existing);
  }
  const invoiceRollups = Array.from(byCurrency.values()).sort((a, b) =>
    a.currency.localeCompare(b.currency)
  );

  return {
    tenant,
    subscription: sub
      ? {
          status: sub.status,
          billingPlan: sub.billingPlan ?? "free",
          stripeSubscriptionId: sub.stripeSubscriptionId,
          stripeCustomerId: sub.stripeCustomerId,
          currentPeriodEnd: sub.currentPeriodEnd,
          stripePriceId: sub.stripePriceId,
          updatedAt: sub.updatedAt,
        }
      : null,
    counts: {
      users: userCountRow?.count ?? 0,
      patients: patientCountRow?.count ?? 0,
      appointments: apptCountRow?.count ?? 0,
      ivfCycles: ivfCountRow?.count ?? 0,
      invoices: invCountRow?.count ?? 0,
    },
    usersByRole: usersByRole.map((r) => ({
      role: r.roleSlug,
      count: r.count,
    })),
    ivfCyclesByStatus: ivfByStatus.map((r) => ({
      status: r.status,
      count: r.count,
    })),
    invoiceRollups,
  };
}
