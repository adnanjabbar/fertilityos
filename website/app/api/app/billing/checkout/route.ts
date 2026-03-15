import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenantSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createStripeCustomer,
  createCheckoutSession,
  isStripeConfigured,
} from "@/lib/stripe";

/**
 * POST /api/app/billing/checkout
 * Create or get Stripe Customer, then create Checkout session for subscription.
 * Returns { url } to redirect user to Stripe Checkout.
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

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId?.startsWith("price_")) {
    return NextResponse.json(
      { error: "No subscription price configured. Set STRIPE_PRICE_ID." },
      { status: 503 }
    );
  }

  const baseUrl = request.headers.get("origin") ?? request.url.replace(/\/api.*$/, "");
  const successUrl = `${baseUrl}/app/billing?success=true`;
  const cancelUrl = `${baseUrl}/app/billing?canceled=true`;

  let [sub] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, session.user.tenantId))
    .limit(1);

  let customerId: string | undefined;

  if (sub?.stripeCustomerId) {
    customerId = sub.stripeCustomerId;
  } else {
    const customer = await createStripeCustomer({
      email: session.user.email ?? "",
      name: session.user.tenantName ?? session.user.name ?? "Clinic",
      metadata: { tenantId: session.user.tenantId },
    });
    if (!customer) {
      return NextResponse.json(
        { error: "Could not create billing account." },
        { status: 500 }
      );
    }
    customerId = customer.id;

    if (!sub) {
      await db.insert(tenantSubscriptions).values({
        tenantId: session.user.tenantId,
        stripeCustomerId: customerId,
        status: "incomplete",
      });
    } else {
      await db
        .update(tenantSubscriptions)
        .set({
          stripeCustomerId: customerId,
          updatedAt: new Date(),
        })
        .where(eq(tenantSubscriptions.tenantId, session.user.tenantId));
    }
  }

  const checkoutSession = await createCheckoutSession({
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    metadata: { tenantId: session.user.tenantId },
    trialPeriodDays: 14,
  });

  if (!checkoutSession?.url) {
    return NextResponse.json(
      { error: "Could not create checkout session." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: checkoutSession.url });
}
