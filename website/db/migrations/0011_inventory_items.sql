-- Phase 4.4: Inventory (consumables) per tenant.
CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "quantity" varchar(32) NOT NULL DEFAULT '0',
  "unit" varchar(32) NOT NULL DEFAULT 'units',
  "reorder_level" varchar(32) NOT NULL DEFAULT '0',
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "inventory_items_tenant_idx" ON "inventory_items" ("tenant_id");
