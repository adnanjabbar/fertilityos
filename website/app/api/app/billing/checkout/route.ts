import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenantSubscriptions, platformPromotionCodes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  createStripeCustomer,
  createCheckoutSession,
  isStripeCheckoutReady,
  getStripePriceId,
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

  if (!(await isStripeCheckoutReady())) {
    return NextResponse.json(
      { error: "Billing is not configured. Contact support." },
      { status: 503 }
    );
  }

  const priceId = await getStripePriceId();
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          "No subscription price configured. Set STRIPE_PRICE_ID (env) or add it under Super Admin → Payment gateways.",
      },
      { status: 503 }
    );
  }

  const baseUrl = request.headers.get("origin") ?? request.url.replace(/\/api.*$/, "");
  const successUrl = `${baseUrl}/app/billing?success=true`;
  const cancelUrl = `${baseUrl}/app/billing?canceled=true`;

  const body = await request.json().catch(() => ({}));
  const rawPromo = typeof body.promotionCode === "string" ? body.promotionCode.trim() : "";
  let stripePromotionCodeId: string | undefined;
  if (rawPromo) {
    const normalized = rawPromo.toUpperCase().replace(/\s+/g, "");
    const [promoRow] = await db
      .select({
        stripePromotionCodeId: platformPromotionCodes.stripePromotionCodeId,
        expiresAt: platformPromotionCodes.expiresAt,
      })
      .from(platformPromotionCodes)
      .where(
        and(eq(platformPromotionCodes.code, normalized), eq(platformPromotionCodes.active, true))
      )
      .limit(1);
    if (!promoRow) {
      return NextResponse.json(
        { error: "Invalid or inactive promotion code." },
        { status: 400 }
      );
    }
    if (promoRow.expiresAt && promoRow.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "This promotion code has expired." }, { status: 400 });
    }
    stripePromotionCodeId = promoRow.stripePromotionCodeId;
  }

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
    stripePromotionCodeId,
  });

  if (!checkoutSession?.url) {
    return NextResponse.json(
      { error: "Could not create checkout session." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: checkoutSession.url });
}
