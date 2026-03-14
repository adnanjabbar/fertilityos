-- Phase 3.5: Invoices and invoice line items.
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "invoice_number" varchar(64) NOT NULL,
  "status" varchar(32) NOT NULL DEFAULT 'draft',
  "due_date" timestamp with time zone,
  "paid_at" timestamp with time zone,
  "total_amount" varchar(32) NOT NULL DEFAULT '0',
  "currency" varchar(3) NOT NULL DEFAULT 'USD',
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_tenant_number_idx" ON "invoices" ("tenant_id", "invoice_number");

CREATE TABLE IF NOT EXISTS "invoice_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "invoice_id" uuid NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "description" text NOT NULL,
  "quantity" varchar(32) NOT NULL DEFAULT '1',
  "unit_price" varchar(32) NOT NULL DEFAULT '0',
  "amount" varchar(32) NOT NULL DEFAULT '0',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
