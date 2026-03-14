# Stripe subscription setup

FertilityOS uses Stripe for tenant subscriptions. Admins can subscribe and manage their plan from **App → Billing**.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes (for billing) | Stripe secret key (`sk_live_...` or `sk_test_...`). |
| `STRIPE_WEBHOOK_SECRET` | Yes (for webhooks) | Webhook signing secret (`whsec_...`) from Stripe Dashboard → Developers → Webhooks. |
| `STRIPE_PRICE_ID` | Yes (for checkout) | Price ID for the default subscription (e.g. `price_...`). Create a Product and recurring Price in Stripe. |

## Stripe Dashboard setup

1. **Product & Price**
   - Create a Product (e.g. "FertilityOS Starter").
   - Add a recurring Price (monthly or yearly). Copy the **Price ID** (`price_...`) into `STRIPE_PRICE_ID`.

2. **Webhook**
   - Developers → Webhooks → Add endpoint.
   - URL: `https://your-app.com/api/webhooks/stripe`
   - Events to send: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
   - Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET`.

3. **Checkout**
   - Checkout uses the default Stripe Checkout (hosted). After payment, Stripe redirects to `/app/billing?success=true`.
   - Webhook `checkout.session.completed` links the new subscription to the tenant using `metadata.tenantId` (we set this when creating the session).

## Database

- Table `tenant_subscriptions`: one row per tenant; stores `stripe_customer_id`, `stripe_subscription_id`, `status`, `current_period_end`.
- Migration: `0009_tenant_subscriptions.sql`. Run with full `run-migrations.js` or a one-off for 0009.

## Flow

1. Admin opens **Billing** → clicks **Subscribe** → we create or reuse Stripe Customer, create Checkout session, redirect to Stripe.
2. User pays on Stripe → redirect to `/app/billing?success=true`.
3. Stripe sends `checkout.session.completed` → we update `tenant_subscriptions` with subscription id and status.
4. Later: **Manage subscription** opens Stripe Customer Portal (update payment method, cancel, etc.). Webhooks `customer.subscription.updated` / `customer.subscription.deleted` keep status in sync.
