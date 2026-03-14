-- Phase 3.4: IVF cycles and embryos.
CREATE TABLE IF NOT EXISTS "ivf_cycles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "cycle_number" varchar(32) NOT NULL,
  "cycle_type" varchar(32) NOT NULL DEFAULT 'fresh',
  "status" varchar(32) NOT NULL DEFAULT 'planned',
  "start_date" timestamp with time zone,
  "end_date" timestamp with time zone,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ivf_cycles_tenant_patient_idx" ON "ivf_cycles" ("tenant_id", "patient_id");

CREATE TABLE IF NOT EXISTS "embryos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "cycle_id" uuid NOT NULL REFERENCES "ivf_cycles"("id") ON DELETE CASCADE,
  "day" varchar(16),
  "grade" varchar(64),
  "status" varchar(32) NOT NULL DEFAULT 'fresh',
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "embryos_tenant_cycle_idx" ON "embryos" ("tenant_id", "cycle_id");
