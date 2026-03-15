-- Tenant-owned credentials for SMS (Twilio) and Video (Daily.co). No platform keys required.
CREATE TABLE IF NOT EXISTS "tenant_integrations" (
  "tenant_id" uuid PRIMARY KEY REFERENCES "tenants"("id") ON DELETE CASCADE,
  "twilio_account_sid" text,
  "twilio_auth_token" text,
  "twilio_phone_number" varchar(32),
  "daily_api_key" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Trial/waitlist signups: store email + phone to prevent repeat trial abuse.
CREATE TABLE IF NOT EXISTS "trial_signups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(255) NOT NULL,
  "phone" varchar(64),
  "clinic_name" varchar(255),
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "trial_signups_email_idx" ON "trial_signups" ("email");
