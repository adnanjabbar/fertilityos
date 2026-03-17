-- Phase 9.3: White-label branding (primary color, show "Powered by" in app).

ALTER TABLE "tenant_branding"
  ADD COLUMN IF NOT EXISTS "primary_color" varchar(32),
  ADD COLUMN IF NOT EXISTS "show_powered_by" boolean DEFAULT true;
