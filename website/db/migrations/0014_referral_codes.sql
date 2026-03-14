-- Referral program: codes and signup tracking
CREATE TABLE IF NOT EXISTS "referral_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "code" varchar(64) NOT NULL,
  "created_by_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "note" text,
  "used_count" varchar(32) NOT NULL DEFAULT '0',
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "referral_codes_tenant_code_idx" ON "referral_codes" ("tenant_id", "code");

CREATE TABLE IF NOT EXISTS "referral_signups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "referral_code_id" uuid NOT NULL REFERENCES "referral_codes"("id") ON DELETE CASCADE,
  "email" varchar(255) NOT NULL,
  "signed_up_at" timestamptz DEFAULT now() NOT NULL
);
