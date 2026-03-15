-- Phase 7.5: Letterhead, prescription printing, QR code & patient 2FA

-- Tenant branding (letterhead, template, margins, footer)
CREATE TABLE IF NOT EXISTS "tenant_branding" (
  "tenant_id" uuid PRIMARY KEY REFERENCES "tenants"("id") ON DELETE CASCADE,
  "letterhead_image_url" text,
  "use_letterhead_template" boolean NOT NULL DEFAULT true,
  "template_slug" varchar(64),
  "margin_top_mm" integer NOT NULL DEFAULT 20,
  "margin_bottom_mm" integer NOT NULL DEFAULT 20,
  "margin_left_mm" integer NOT NULL DEFAULT 20,
  "margin_right_mm" integer NOT NULL DEFAULT 20,
  "footer_address" text,
  "footer_phone" varchar(64),
  "footer_email" varchar(255),
  "footer_website" varchar(512),
  "footer_text" text,
  "logo_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Prescription number (unique per tenant)
ALTER TABLE "prescriptions"
  ADD COLUMN IF NOT EXISTS "prescription_number" varchar(64);

CREATE UNIQUE INDEX IF NOT EXISTS "prescriptions_tenant_number_idx"
  ON "prescriptions" ("tenant_id", "prescription_number")
  WHERE "prescription_number" IS NOT NULL;

-- Backfill prescription_number for existing rows (per-tenant sequence 1, 2, 3...)
UPDATE prescriptions p
SET prescription_number = sub.rn::text
FROM (
  SELECT id, row_number() OVER (PARTITION BY tenant_id ORDER BY created_at) AS rn
  FROM prescriptions
  WHERE prescription_number IS NULL OR prescription_number = ''
) sub
WHERE p.id = sub.id;

-- Patient national ID fields (for 2FA)
ALTER TABLE "patients"
  ADD COLUMN IF NOT EXISTS "national_id_type" varchar(32),
  ADD COLUMN IF NOT EXISTS "national_id_value" varchar(255);

CREATE INDEX IF NOT EXISTS "patients_national_id_idx"
  ON "patients" ("tenant_id", "national_id_type", "national_id_value")
  WHERE "national_id_type" IS NOT NULL AND "national_id_value" IS NOT NULL;

-- OTP codes for portal 2FA (national ID + phone flow)
CREATE TABLE IF NOT EXISTS "patient_otp_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "phone" varchar(64) NOT NULL,
  "code" varchar(8) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "patient_otp_codes_patient_expires_idx"
  ON "patient_otp_codes" ("patient_id", "expires_at");
