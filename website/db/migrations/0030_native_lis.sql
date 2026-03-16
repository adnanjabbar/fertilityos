-- Native LIS (Lab Information Management System) module
-- Specimens, test catalog, panels, order line items, result entry (no external FHIR/HL7 required)

CREATE TABLE IF NOT EXISTS "lab_specimens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "specimen_type" varchar(64) NOT NULL,
  "collected_at" timestamptz,
  "received_at" timestamptz,
  "status" varchar(32) NOT NULL DEFAULT 'pending',
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "lab_specimens_tenant_idx" ON "lab_specimens" ("tenant_id");
CREATE INDEX IF NOT EXISTS "lab_specimens_patient_idx" ON "lab_specimens" ("patient_id");

CREATE TABLE IF NOT EXISTS "lab_tests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "code" varchar(64) NOT NULL,
  "name" varchar(255) NOT NULL,
  "unit" varchar(32),
  "reference_range_low" varchar(64),
  "reference_range_high" varchar(64),
  "reference_range_text" text,
  "is_panel" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "lab_tests_tenant_code_idx" ON "lab_tests" ("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "lab_tests_tenant_idx" ON "lab_tests" ("tenant_id");

CREATE TABLE IF NOT EXISTS "lab_panels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "panel_test_id" uuid NOT NULL REFERENCES "lab_tests"("id") ON DELETE CASCADE,
  "member_test_id" uuid NOT NULL REFERENCES "lab_tests"("id") ON DELETE CASCADE,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "lab_panels_tenant_idx" ON "lab_panels" ("tenant_id");
CREATE INDEX IF NOT EXISTS "lab_panels_panel_idx" ON "lab_panels" ("panel_test_id");

-- Optional: link lab_orders.specimen_id to lab_specimens (column already exists in 0028)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lab_orders_specimen_id_fkey' AND table_name = 'lab_orders'
  ) THEN
    ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_specimen_id_fkey"
      FOREIGN KEY ("specimen_id") REFERENCES "lab_specimens"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "lab_order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "order_id" uuid NOT NULL REFERENCES "lab_orders"("id") ON DELETE CASCADE,
  "test_id" uuid NOT NULL REFERENCES "lab_tests"("id") ON DELETE RESTRICT,
  "specimen_id" uuid REFERENCES "lab_specimens"("id") ON DELETE SET NULL,
  "status" varchar(32) NOT NULL DEFAULT 'pending',
  "result_value" varchar(255),
  "result_unit" varchar(32),
  "reference_range" varchar(128),
  "result_at" timestamptz,
  "performed_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "lab_order_items_tenant_idx" ON "lab_order_items" ("tenant_id");
CREATE INDEX IF NOT EXISTS "lab_order_items_order_idx" ON "lab_order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "lab_order_items_test_idx" ON "lab_order_items" ("test_id");
