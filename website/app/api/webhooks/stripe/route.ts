import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { resolvePaymentGatewayConfig } from "@/lib/payment-gateway-config";
import { db } from "@/db";
import { tenantSubscriptions, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logStripeSubscriptionSync } from "@/lib/platform-admin-audit";

export async function POST(request: Request) {
  const cfg = await resolvePaymentGatewayConfig();
  const stripe = await getStripe();
  const webhookSecret = cfg.stripe.webhookSecret;

  if (!stripe || !webhookSecret) {
    console.error("[stripe webhook] Missing Stripe secret key or webhook signing secret (env or Super Admin)");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe webhook]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const [systemRow] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, "system"))
    .limit(1);
  const systemTenantId = systemRow?.id ?? null;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;
        const subscriptionId = session.subscription as string | null;
        if (!tenantId) break;

        const [existing] = await db
          .select()
          .from(tenantSubscriptions)
          .where(eq(tenantSubscriptions.tenantId, tenantId))
          .limit(1);

        if (subscriptionId && existing) {
          const prev = {
            status: existing.status,
            stripeSubscriptionId: existing.stripeSubscriptionId,
            stripePriceId: existing.stripePriceId,
          };
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as { status: string; current_period_end?: number; items: { data: Array<{ price?: { id?: string } }> } };
          const periodEnd = sub.current_period_end != null ? new Date(sub.current_period_end * 1000) : null;
          await db
            .update(tenantSubscriptions)
            .set({
              stripeSubscriptionId: subscriptionId,
              status: sub.status,
              currentPeriodEnd: periodEnd,
              stripePriceId: (sub.items.data[0]?.price as { id?: string } | undefined)?.id ?? null,
              updatedAt: new Date(),
            })
            .where(eq(tenantSubscriptions.tenantId, tenantId));
          if (systemTenantId) {
            void logStripeSubscriptionSync({
              systemTenantId,
              affectedTenantId: tenantId,
              eventType: event.type,
              stripeEventId: event.id,
              previousState: prev,
              newState: {
                status: sub.status,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: (sub.items.data[0]?.price as { id?: string } | undefined)?.id ?? null,
              },
            }).catch(() => {});
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription & { current_period_end?: number; status: string; items: { data: Array<{ price?: { id?: string } }> } };
        const customerId = subscription.customer as string;

        const [existing] = await db
          .select()
          .from(tenantSubscriptions)
          .where(eq(tenantSubscriptions.stripeCustomerId, customerId))
          .limit(1);

        if (existing) {
          const status =
            event.type === "customer.subscription.deleted"
              ? "canceled"
              : subscription.status;

          const prev = {
            status: existing.status,
            stripeSubscriptionId: existing.stripeSubscriptionId,
            currentPeriodEnd: existing.currentPeriodEnd?.toISOString() ?? null,
            stripePriceId: existing.stripePriceId,
          };

          await db
            .update(tenantSubscriptions)
            .set({
              stripeSubscriptionId: subscription.id,
              status,
              currentPeriodEnd:
                subscription.current_period_end != null
                  ? new Date((subscription.current_period_end as number) * 1000)
                  : null,
              stripePriceId: subscription.items.data[0]?.price?.id ?? null,
              updatedAt: new Date(),
            })
            .where(eq(tenantSubscriptions.tenantId, existing.tenantId));

          if (systemTenantId) {
            void logStripeSubscriptionSync({
              systemTenantId,
              affectedTenantId: existing.tenantId,
              eventType: event.type,
              stripeEventId: event.id,
              previousState: prev,
              newState: {
                status,
                stripeSubscriptionId: subscription.id,
                currentPeriodEnd:
                  subscription.current_period_end != null
                    ? new Date((subscription.current_period_end as number) * 1000).toISOString()
                    : null,
                stripePriceId: subscription.items.data[0]?.price?.id ?? null,
              },
            }).catch(() => {});
          }
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (e) {
    console.error("[stripe webhook] Handler error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
