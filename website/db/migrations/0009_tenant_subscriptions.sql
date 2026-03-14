-- MVP Polish: Stripe subscription per tenant.
CREATE TABLE IF NOT EXISTS "tenant_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE UNIQUE,
  "stripe_customer_id" varchar(255),
  "stripe_subscription_id" varchar(255),
  "status" varchar(32) NOT NULL DEFAULT 'incomplete',
  "current_period_end" timestamp with time zone,
  "stripe_price_id" varchar(255),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_subscriptions_tenant_idx" ON "tenant_subscriptions" ("tenant_id");
