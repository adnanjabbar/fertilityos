import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenantSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createBillingPortalSession, isStripeConfigured } from "@/lib/stripe";

/**
 * POST /api/app/billing/portal
 * Create Stripe Customer Portal session; return URL to redirect the user.
 * Requires tenant to already have stripeCustomerId (has subscribed before).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured. Contact support." },
      { status: 503 }
    );
  }

  const [sub] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, session.user.tenantId))
    .limit(1);

  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Subscribe first." },
      { status: 400 }
    );
  }

  const url = request.headers.get("origin") ?? request.url.replace(/\/api.*$/, "");
  const returnUrl = `${url}/app/billing`;

  const portalSession = await createBillingPortalSession({
    customerId: sub.stripeCustomerId,
    returnUrl,
  });

  if (!portalSession?.url) {
    return NextResponse.json(
      { error: "Could not create billing portal session." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: portalSession.url });
}
