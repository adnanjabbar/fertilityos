-- Phase 3.2: Appointments table (per-tenant, linked to patients and optional provider).
CREATE TABLE IF NOT EXISTS "appointments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "provider_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "title" varchar(255),
  "start_at" timestamp with time zone NOT NULL,
  "end_at" timestamp with time zone NOT NULL,
  "type" varchar(64) NOT NULL DEFAULT 'consultation',
  "status" varchar(32) NOT NULL DEFAULT 'scheduled',
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "appointments_tenant_start_idx" ON "appointments" ("tenant_id", "start_at");
