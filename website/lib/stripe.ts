/**
 * Stripe helpers for tenant subscription. Requires STRIPE_SECRET_KEY.
 */

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_")) return null;
  if (!_stripe) _stripe = new Stripe(key);
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY?.startsWith("sk_");
}

export async function createStripeCustomer(params: {
  email: string;
  name: string;
  metadata?: { tenantId: string };
}): Promise<Stripe.Customer | null> {
  const stripe = getStripe();
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
  const stripe = getStripe();
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
}): Promise<Stripe.Checkout.Session | null> {
  const stripe = getStripe();
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
  });
  return session;
}
