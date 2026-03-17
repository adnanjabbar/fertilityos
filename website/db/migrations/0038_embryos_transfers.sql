-- Phase 1B: Extend embryos (disposition, source, link to fertilization) and add embryo_transfers.

-- Embryos: add optional fertilization_event_id, day_created, source, disposition, grade_detail
ALTER TABLE "embryos"
  ADD COLUMN IF NOT EXISTS "fertilization_event_id" uuid REFERENCES "fertilization_events"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "day_created" integer,
  ADD COLUMN IF NOT EXISTS "source" varchar(32) DEFAULT 'fresh',
  ADD COLUMN IF NOT EXISTS "disposition" varchar(32) DEFAULT 'culture',
  ADD COLUMN IF NOT EXISTS "grade_detail" varchar(64);

CREATE INDEX IF NOT EXISTS "embryos_fertilization_event_idx" ON "embryos" ("fertilization_event_id");

-- Embryo transfers (per cycle)
CREATE TABLE IF NOT EXISTS "embryo_transfers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "cycle_id" uuid NOT NULL REFERENCES "ivf_cycles"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "transfer_date" timestamp with time zone NOT NULL,
  "transfer_type" varchar(32) NOT NULL DEFAULT 'fresh',
  "number_embryos_transferred" integer,
  "number_implanted" integer,
  "performed_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "embryo_transfers_tenant_idx" ON "embryo_transfers" ("tenant_id");
CREATE INDEX IF NOT EXISTS "embryo_transfers_cycle_idx" ON "embryo_transfers" ("cycle_id");

-- Link specific embryos to a transfer
CREATE TABLE IF NOT EXISTS "embryo_transfer_embryos" (
  "transfer_id" uuid NOT NULL REFERENCES "embryo_transfers"("id") ON DELETE CASCADE,
  "embryo_id" uuid NOT NULL REFERENCES "embryos"("id") ON DELETE CASCADE,
  PRIMARY KEY ("transfer_id", "embryo_id")
);

CREATE INDEX IF NOT EXISTS "embryo_transfer_embryos_embryo_idx" ON "embryo_transfer_embryos" ("embryo_id");
