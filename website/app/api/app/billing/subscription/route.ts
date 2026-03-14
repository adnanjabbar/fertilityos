import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenantSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/app/billing/subscription
 * Returns current tenant's subscription status (for billing page).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sub] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, session.user.tenantId))
    .limit(1);

  if (!sub) {
    return NextResponse.json({
      status: "incomplete",
      hasCustomer: false,
      currentPeriodEnd: null,
    });
  }

  return NextResponse.json({
    status: sub.status,
    hasCustomer: !!sub.stripeCustomerId,
    stripeCustomerId: sub.stripeCustomerId ?? null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
  });
}
