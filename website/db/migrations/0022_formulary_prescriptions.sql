-- Phase 7.2: Formulary (medications) and prescriptions

-- Enums for medication form and prescription status
DO $$ BEGIN
  CREATE TYPE medication_form AS ENUM (
    'tablet', 'capsule', 'injection', 'suppository', 'pessary',
    'syrup', 'cream', 'gel', 'drops', 'inhaler', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE prescription_status AS ENUM (
    'prescribed', 'dispensed', 'completed', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Formulary: clinic medications
CREATE TABLE IF NOT EXISTS "medications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "brand_name" varchar(255) NOT NULL,
  "generic_name" varchar(255) NOT NULL,
  "dosage" varchar(128) NOT NULL,
  "form" medication_form NOT NULL,
  "frequency_options" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "instructions_checkboxes" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "instructions_extended" text,
  "pharmaceutical_company" varchar(255),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "medications_tenant_idx" ON "medications" ("tenant_id");

-- Medication groups (e.g. IVF Protocol)
CREATE TABLE IF NOT EXISTS "medication_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "medication_groups_tenant_idx" ON "medication_groups" ("tenant_id");

-- Group items: medications in a protocol
CREATE TABLE IF NOT EXISTS "medication_group_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "medication_group_id" uuid NOT NULL REFERENCES "medication_groups"("id") ON DELETE CASCADE,
  "medication_id" uuid NOT NULL REFERENCES "medications"("id") ON DELETE CASCADE,
  "quantity_per_cycle" varchar(64),
  "default_duration_days" integer,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Prescriptions (per patient)
CREATE TABLE IF NOT EXISTS "prescriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "prescribed_by_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" prescription_status NOT NULL DEFAULT 'prescribed',
  "start_date" timestamp with time zone,
  "end_date" timestamp with time zone,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "prescriptions_tenant_idx" ON "prescriptions" ("tenant_id");
CREATE INDEX IF NOT EXISTS "prescriptions_patient_idx" ON "prescriptions" ("patient_id");

-- Prescription lines: each line is either one medication OR one medication group (protocol)
CREATE TABLE IF NOT EXISTS "prescription_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "prescription_id" uuid NOT NULL REFERENCES "prescriptions"("id") ON DELETE CASCADE,
  "medication_id" uuid REFERENCES "medications"("id") ON DELETE CASCADE,
  "medication_group_id" uuid REFERENCES "medication_groups"("id") ON DELETE CASCADE,
  "quantity" varchar(64) NOT NULL DEFAULT '1',
  "duration_days" integer,
  "frequency" varchar(128),
  "instructions_override" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
