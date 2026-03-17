-- Phase 10.2: GDPR-style data export/delete requests (patient_data_requests).

CREATE TABLE IF NOT EXISTS "patient_data_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "type" varchar(16) NOT NULL,
  "status" varchar(32) NOT NULL DEFAULT 'pending',
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  "completed_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "patient_data_requests_tenant_idx" ON "patient_data_requests" ("tenant_id");
CREATE INDEX IF NOT EXISTS "patient_data_requests_patient_idx" ON "patient_data_requests" ("patient_id");
CREATE INDEX IF NOT EXISTS "patient_data_requests_status_idx" ON "patient_data_requests" ("status");
