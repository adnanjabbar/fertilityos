-- MVP Polish: Per-tenant module toggles. JSON array of module slugs, e.g. ["patientManagement","scheduling"].
-- NULL or empty = all modules enabled.
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "enabled_modules" text;
