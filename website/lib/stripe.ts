/**
 * Stripe helpers for tenant subscription.
 * Keys: Super Admin (platform_settings) overrides STRIPE_* env vars.
 */

import Stripe from "stripe";
import { resolvePaymentGatewayConfig } from "@/lib/payment-gateway-config";

export type StripeCouponDuration = "once" | "repeating" | "forever";

let _stripeCache: { secretKey: string; client: Stripe } | null = null;

export async function getStripe(): Promise<Stripe | null> {
  const cfg = await resolvePaymentGatewayConfig();
  if (cfg.provider !== "stripe") return null;
  const key = cfg.stripe.secretKey;
  if (!key?.startsWith("sk_")) return null;
  if (!_stripeCache || _stripeCache.secretKey !== key) {
    _stripeCache = { secretKey: key, client: new Stripe(key) };
  }
  return _stripeCache.client;
}

/** Checkout: needs secret + recurring price id. */
export async function isStripeCheckoutReady(): Promise<boolean> {
  const cfg = await resolvePaymentGatewayConfig();
  return (
    cfg.provider === "stripe" &&
    !!cfg.stripe.secretKey?.startsWith("sk_") &&
    !!cfg.stripe.priceId?.startsWith("price_")
  );
}

/** Portal, coupons, subscription cancel — secret only. */
export async function isStripeSecretConfigured(): Promise<boolean> {
  const cfg = await resolvePaymentGatewayConfig();
  return cfg.provider === "stripe" && !!cfg.stripe.secretKey?.startsWith("sk_");
}

export async function getStripePriceId(): Promise<string | null> {
  const cfg = await resolvePaymentGatewayConfig();
  return cfg.stripe.priceId;
}

export async function createStripeCustomer(params: {
  email: string;
  name: string;
  metadata?: { tenantId: string };
}): Promise<Stripe.Customer | null> {
  const stripe = await getStripe();
  if (!stripe) return null;
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata ?? {},
  });
  return customer;
}

export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session | null> {
  const stripe = await getStripe();
  if (!stripe) return null;
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
  return session;
}

export async function createCheckoutSession(params: {
  customerId?: string;
  customerEmail?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: { tenantId: string };
  /** Optional 14-day free trial before first charge. */
  trialPeriodDays?: number;
  /** Stripe Promotion Code id (promo_xxx), not the customer-facing string. */
  stripePromotionCodeId?: string;
}): Promise<Stripe.Checkout.Session | null> {
  const stripe = await getStripe();
  if (!stripe) return null;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: params.customerId ?? undefined,
    customer_email: params.customerEmail ?? undefined,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata ?? {},
    subscription_data: {
      metadata: params.metadata,
      ...(params.trialPeriodDays != null ? { trial_period_days: params.trialPeriodDays } : {}),
    },
    ...(params.stripePromotionCodeId
      ? { discounts: [{ promotion_code: params.stripePromotionCodeId }] }
      : {}),
  });
  return session;
}

/**
 * Create a Stripe Coupon + customer-facing Promotion Code (super admin marketing).
 */
export async function createStripeCouponAndPromotionCode(params: {
  code: string;
  percentOff?: number;
  amountOffCents?: number;
  currency?: string;
  duration: StripeCouponDuration;
  durationInMonths?: number;
  maxRedemptions?: number;
  expiresAt: Date | null;
}): Promise<{ couponId: string; promotionCodeId: string } | null> {
  const stripe = await getStripe();
  if (!stripe) return null;

  const couponParams: Stripe.CouponCreateParams = {
    duration: params.duration,
  };
  if (params.duration === "repeating") {
    couponParams.duration_in_months = params.durationInMonths ?? 3;
  }
  if (params.percentOff != null) {
    couponParams.percent_off = params.percentOff;
  } else if (params.amountOffCents != null) {
    couponParams.amount_off = params.amountOffCents;
    couponParams.currency = (params.currency ?? "usd").toLowerCase();
  } else {
    return null;
  }

  const coupon = await stripe.coupons.create(couponParams);

  const promoParams: Stripe.PromotionCodeCreateParams = {
    coupon: coupon.id,
    code: params.code,
  };
  if (params.maxRedemptions != null && params.maxRedemptions > 0) {
    promoParams.max_redemptions = params.maxRedemptions;
  }
  if (params.expiresAt) {
    promoParams.expires_at = Math.floor(params.expiresAt.getTime() / 1000);
  }

  const promotionCode = await stripe.promotionCodes.create(promoParams);
  return { couponId: coupon.id, promotionCodeId: promotionCode.id };
}

export async function deactivateStripePromotionCode(
  stripePromotionCodeId: string
): Promise<boolean> {
  const stripe = await getStripe();
  if (!stripe) return false;
  await stripe.promotionCodes.update(stripePromotionCodeId, { active: false });
  return true;
}
