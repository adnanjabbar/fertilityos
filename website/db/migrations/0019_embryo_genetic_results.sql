-- Phase 7.1: PGT/PGS genetic results per embryo.
CREATE TYPE "embryo_genetic_result_test_type" AS ENUM (
  'PGT-A',
  'PGT-M',
  'PGT-SR',
  'PGT-HLA',
  'other'
);

CREATE TYPE "embryo_genetic_result_result" AS ENUM (
  'euploid',
  'aneuploid',
  'mosaic',
  'inconclusive'
);

CREATE TABLE IF NOT EXISTS "embryo_genetic_results" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "embryo_id" uuid NOT NULL REFERENCES "embryos"("id") ON DELETE CASCADE,
  "test_type" "embryo_genetic_result_test_type" NOT NULL,
  "result" "embryo_genetic_result_result" NOT NULL,
  "result_date" timestamp with time zone NOT NULL,
  "lab_reference" varchar(255),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "embryo_genetic_results_embryo_idx" ON "embryo_genetic_results" ("embryo_id");
CREATE INDEX IF NOT EXISTS "embryo_genetic_results_tenant_idx" ON "embryo_genetic_results" ("tenant_id");
