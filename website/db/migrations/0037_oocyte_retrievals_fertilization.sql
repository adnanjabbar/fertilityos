-- IVF Phase 1A: Oocyte retrieval (OPU) and fertilization events

CREATE TABLE IF NOT EXISTS "oocyte_retrievals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "cycle_id" uuid NOT NULL REFERENCES "ivf_cycles"("id") ON DELETE CASCADE,
  "retrieval_date" timestamptz,
  "performed_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "oocytes_total" integer,
  "oocytes_mature" integer,
  "oocytes_immature" integer,
  "oocytes_mii" integer,
  "oocytes_gv" integer,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "oocyte_retrievals_tenant_idx" ON "oocyte_retrievals" ("tenant_id");
CREATE INDEX IF NOT EXISTS "oocyte_retrievals_cycle_idx" ON "oocyte_retrievals" ("cycle_id");

CREATE TABLE IF NOT EXISTS "fertilization_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "cycle_id" uuid NOT NULL REFERENCES "ivf_cycles"("id") ON DELETE CASCADE,
  "opu_id" uuid REFERENCES "oocyte_retrievals"("id") ON DELETE SET NULL,
  "fertilization_type" varchar(32) NOT NULL DEFAULT 'icsi',
  "oocytes_inseminated" integer,
  "oocytes_fertilized" integer,
  "zygotes_normal" integer,
  "zygotes_abnormal" integer,
  "performed_at" timestamptz,
  "performed_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "fertilization_events_tenant_idx" ON "fertilization_events" ("tenant_id");
CREATE INDEX IF NOT EXISTS "fertilization_events_cycle_idx" ON "fertilization_events" ("cycle_id");
