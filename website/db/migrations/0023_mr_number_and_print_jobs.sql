-- Phase 7.6: MR number (patient) and print_jobs audit

-- Add mr_number to patients (unique per tenant)
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "mr_number" varchar(64);

-- Unique index: one mr_number per tenant (NULLs allowed for pre-backfill)
CREATE UNIQUE INDEX IF NOT EXISTS "patients_tenant_mr_number_idx"
  ON "patients" ("tenant_id", "mr_number")
  WHERE "mr_number" IS NOT NULL;

-- Backfill mr_number for existing patients: tenant prefix + current year + sequence
DO $$
DECLARE
  r RECORD;
  t RECORD;
  yr text;
  prefix text;
  new_mr text;
BEGIN
  yr := TO_CHAR(NOW(), 'YY');
  FOR t IN SELECT id, slug FROM tenants
  LOOP
    prefix := UPPER(REGEXP_REPLACE(COALESCE(NULLIF(TRIM(t.slug), ''), 'MR'), '[^A-Z0-9]', '', 'g'));
    IF LENGTH(prefix) = 0 THEN prefix := 'MR'; END IF;
    IF LENGTH(prefix) > 8 THEN prefix := LEFT(prefix, 8); END IF;

    FOR r IN
      SELECT p.id,
             ROW_NUMBER() OVER (ORDER BY p.created_at, p.id) AS rn
      FROM patients p
      WHERE p.tenant_id = t.id AND (p.mr_number IS NULL OR p.mr_number = '')
    LOOP
      new_mr := prefix || '-' || yr || '-' || LPAD(r.rn::text, 4, '0');
      UPDATE patients SET mr_number = new_mr WHERE id = r.id;
    END LOOP;
  END LOOP;
END $$;

-- Print jobs table (audit)
CREATE TABLE IF NOT EXISTS "print_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "type" varchar(64) NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "printed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "printed_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "print_jobs_tenant_printed_idx" ON "print_jobs" ("tenant_id", "printed_at");
