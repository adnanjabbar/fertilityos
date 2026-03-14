-- Phase 3.3: Clinical notes (SOAP) per patient.
CREATE TABLE IF NOT EXISTS "clinical_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "note_type" varchar(32) NOT NULL DEFAULT 'soap',
  "subjective" text,
  "objective" text,
  "assessment" text,
  "plan" text,
  "diagnosis_code" varchar(64),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "clinical_notes_tenant_patient_idx" ON "clinical_notes" ("tenant_id", "patient_id");
