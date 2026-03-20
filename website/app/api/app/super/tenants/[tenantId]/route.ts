import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTenantDeepDive } from "@/lib/super-admin-queries";

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
