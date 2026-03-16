-- Phase 1–5: OTP verification, phone/email verified flags, SSO prep.

-- Generic OTP codes (admin signup, staff invite, patient verify when using generic flow).
-- For portal patient OTP we keep using patient_otp_codes.
CREATE TABLE IF NOT EXISTS "otp_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "context" varchar(32) NOT NULL,
  "phone" varchar(64) NOT NULL,
  "code" varchar(8) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "otp_codes_phone_context_expires_idx"
  ON "otp_codes" ("phone", "context", "expires_at");

-- Email verification codes (pre-signup, e.g. clinic register).
CREATE TABLE IF NOT EXISTS "email_verification_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "code" varchar(8) NOT NULL,
  "context" varchar(32) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "email_verification_codes_email_context_expires_idx"
  ON "email_verification_codes" ("email", "context", "expires_at");

-- Users: phone and phone verified (staff/admin).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" varchar(64);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified_at" timestamp with time zone;
-- Allow null password for OAuth-only users.
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- Patients: phone verified timestamp.
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "phone_verified_at" timestamp with time zone;

-- Account linking for SSO (which provider the user signed up with / can use).
CREATE TABLE IF NOT EXISTS "user_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" varchar(32) NOT NULL,
  "provider_account_id" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_accounts_provider_account_idx"
  ON "user_accounts" ("provider", "provider_account_id");
CREATE INDEX IF NOT EXISTS "user_accounts_user_id_idx" ON "user_accounts" ("user_id");
