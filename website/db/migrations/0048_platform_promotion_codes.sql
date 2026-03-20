-- Platform marketing codes for Stripe Checkout (super admin–managed)
CREATE TABLE IF NOT EXISTS "platform_promotion_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(64) NOT NULL,
  "stripe_coupon_id" varchar(255) NOT NULL,
  "stripe_promotion_code_id" varchar(255) NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "percent_off" integer,
  "amount_off_cents" integer,
  "currency" varchar(3),
  "duration" varchar(32) NOT NULL,
  "duration_in_months" integer,
  "max_redemptions" integer,
  "expires_at" timestamp with time zone,
  "internal_note" text,
  "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "platform_promotion_codes_code_unique" UNIQUE ("code"),
  CONSTRAINT "platform_promotion_codes_stripe_promotion_code_id_unique" UNIQUE ("stripe_promotion_code_id")
);

CREATE INDEX IF NOT EXISTS "platform_promotion_codes_active_idx" ON "platform_promotion_codes" ("active");
CREATE INDEX IF NOT EXISTS "platform_promotion_codes_created_idx" ON "platform_promotion_codes" ("created_at");
