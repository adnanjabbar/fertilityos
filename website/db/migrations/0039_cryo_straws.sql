-- Phase 1C: Cryopreservation straws (one straw = one embryo frozen; thaw recorded on same row).

CREATE TABLE IF NOT EXISTS "cryo_straws" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "embryo_id" uuid NOT NULL REFERENCES "embryos"("id") ON DELETE CASCADE,
  "cycle_id" uuid NOT NULL REFERENCES "ivf_cycles"("id") ON DELETE CASCADE,
  "straw_label" varchar(128),
  "storage_location" varchar(255),
  "frozen_at" timestamp with time zone NOT NULL,
  "thawed_at" timestamp with time zone,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cryo_straws_tenant_idx" ON "cryo_straws" ("tenant_id");
CREATE INDEX IF NOT EXISTS "cryo_straws_cycle_idx" ON "cryo_straws" ("cycle_id");
CREATE INDEX IF NOT EXISTS "cryo_straws_embryo_idx" ON "cryo_straws" ("embryo_id");
