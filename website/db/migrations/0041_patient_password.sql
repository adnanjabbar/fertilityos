-- Phase 10.1: Patient portal password (optional password_hash on patients; tokens for set/reset).

ALTER TABLE "patients"
  ADD COLUMN IF NOT EXISTS "password_hash" text;

-- Tokens for "set password" (invite) and "forgot password" (reset). One table, type discriminator.
CREATE TABLE IF NOT EXISTS "patient_password_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "token" varchar(64) NOT NULL,
  "type" varchar(16) NOT NULL DEFAULT 'set',
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "patient_password_tokens_token_idx" ON "patient_password_tokens" ("token");
CREATE INDEX IF NOT EXISTS "patient_password_tokens_patient_idx" ON "patient_password_tokens" ("patient_id");
CREATE INDEX IF NOT EXISTS "patient_password_tokens_expires_idx" ON "patient_password_tokens" ("expires_at");
