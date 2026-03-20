# Stripe subscription setup

FertilityOS uses Stripe for tenant subscriptions. Admins can subscribe and manage their plan from **App → Billing**.

## Environment variables (or Super Admin)

You can configure Stripe in **two ways** (database wins when a value is saved there):

1. **Hosting environment variables** (recommended for production secrets).
2. **Super Admin → Payment gateways** (`/app/super/payment-settings`) — stores keys in `platform_settings` (same merge rules as locales).

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes (unless set in Super Admin) | Secret key (`sk_live_...` or `sk_test_...`). |
| `STRIPE_WEBHOOK_SECRET` | Yes (unless set in Super Admin) | Signing secret (`whsec_...`) from Developers → Webhooks. |
| `STRIPE_PRICE_ID` | Yes (unless set in Super Admin) | Recurring **Price** id (`price_...`). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Publishable key (`pk_...`) for future client-side Stripe.js; safe to expose. |

**Provider switch:** In Payment gateways, choose **Stripe** or **None**. **None** disables Checkout site-wide even if `STRIPE_SECRET_KEY` exists in the environment (useful for sandboxes without billing).

**Other gateways:** Paddle (and others) are listed as “coming later” in the same screen; only Stripe is implemented today.

## Stripe Dashboard setup

1. **Product & Price**
   - Create a Product (e.g. "FertilityOS Starter").
   - Add a recurring Price (monthly or yearly). Copy the **Price ID** (`price_...`) into `STRIPE_PRICE_ID`.

2. **Webhook**
   - Developers → Webhooks (or **Event destinations**) → Add endpoint.
   - URL must be **`https://your-app.com/api/webhooks/stripe`** — this repo does not implement `/api/payment/webhook`.
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

## Marketing promotion codes (super admin)

Super admins can create **Stripe Coupons + Promotion Codes** from **App → Super → Checkout promo codes** (`/app/super/promotion-codes`). Codes are stored in `platform_promotion_codes` (migration `0047_platform_promotion_codes.sql`).

- Clinics enter the code on **App → Billing** before clicking **Subscribe**; the server applies `discounts: [{ promotion_code: promo_... }]` on the Checkout Session.
- **Deactivate** in the super admin UI turns off the code in Stripe and in the app (new checkouts rejected).
- Use **test mode** keys to verify percent vs fixed-amount discounts alongside the 14-day trial.
