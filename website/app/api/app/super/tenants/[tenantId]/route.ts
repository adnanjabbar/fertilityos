import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTenantDeepDive } from "@/lib/super-admin-queries";
import { db } from "@/db";
import { tenants, tenantSubscriptions } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { logTenantPermanentDeletion } from "@/lib/platform-admin-audit";
import { getStripe } from "@/lib/stripe";
import { rateLimitSuperApi } from "@/lib/rate-limit";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ tenantId: string }> };

/**
 * GET /api/app/super/tenants/:tenantId
 * Clinic deep-dive: counts, subscription, invoice rollups, IVF by status (no patient PII).
 */
export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "super_admin") {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  const { tenantId } = await context.params;
  if (!tenantId || !UUID_RE.test(tenantId)) {
    return NextResponse.json({ error: "Invalid tenant id" }, { status: 400 });
  }

  try {
    const data = await getTenantDeepDive(tenantId);
    if (!data) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const subscriptionOut = data.subscription
      ? {
          ...data.subscription,
          currentPeriodEnd: data.subscription.currentPeriodEnd
            ? data.subscription.currentPeriodEnd.toISOString()
            : null,
          updatedAt: data.subscription.updatedAt.toISOString(),
        }
      : {
          billingPlan: "free",
          status: "incomplete",
          stripeSubscriptionId: null as string | null,
          stripeCustomerId: null as string | null,
          currentPeriodEnd: null as string | null,
          stripePriceId: null as string | null,
          updatedAt: new Date().toISOString(),
        };

    return NextResponse.json({
      ...data,
      tenant: {
        ...data.tenant,
        createdAt: data.tenant.createdAt.toISOString(),
      },
      subscription: subscriptionOut,
    });
  } catch (e) {
    console.error("super/tenants/[tenantId] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load tenant" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/app/super/tenants/:tenantId
 * Permanently remove a clinic and all dependent rows (DB CASCADE).
 * Body: { "confirmName": "Exact clinic name" } (case-insensitive trim match).
 */
export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "super_admin") {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  if (!rateLimitSuperApi(session.user.id, "delete-tenant", 15).allowed) {
    return NextResponse.json(
      { error: "Too many delete attempts. Wait before trying again." },
      { status: 429 }
    );
  }

  const { tenantId } = await context.params;
  if (!tenantId || !UUID_RE.test(tenantId)) {
    return NextResponse.json({ error: "Invalid tenant id" }, { status: 400 });
  }

  let body: { confirmName?: string };
  try {
    body = (await request.json()) as { confirmName?: string };
  } catch {
    return NextResponse.json({ error: "JSON body required" }, { status: 400 });
  }
  const confirmName = typeof body.confirmName === "string" ? body.confirmName.trim() : "";
  if (!confirmName) {
    return NextResponse.json(
      { error: "confirmName is required (type the clinic’s full name to confirm)." },
      { status: 400 }
    );
  }

  const [tenant] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
    })
    .from(tenants)
    .where(and(eq(tenants.id, tenantId), ne(tenants.slug, "system")))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Clinic not found or cannot be deleted." }, { status: 404 });
  }

  if (tenant.name.trim().toLowerCase() !== confirmName.toLowerCase()) {
    return NextResponse.json(
      {
        error:
          "Clinic name does not match. Copy the exact name from the list (check spelling and spacing).",
      },
      { status: 400 }
    );
  }

  const [systemTenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, "system"))
    .limit(1);

  if (!systemTenant) {
    return NextResponse.json({ error: "System tenant missing; cannot audit deletion." }, { status: 500 });
  }

  await logTenantPermanentDeletion({
    systemTenantId: systemTenant.id,
    actorUserId: session.user.id,
    deleted: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    request,
    notes: "Super admin deleted clinic from All clinics",
  });

  const stripe = await getStripe();
  const [subRow] = await db
    .select({
      stripeSubscriptionId: tenantSubscriptions.stripeSubscriptionId,
    })
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  if (stripe && subRow?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(subRow.stripeSubscriptionId);
    } catch (e) {
      console.error("[super DELETE tenant] Stripe cancel failed:", e);
    }
  }

  await db.delete(tenants).where(eq(tenants.id, tenantId));

  return NextResponse.json({ ok: true, deletedTenantId: tenantId });
}
