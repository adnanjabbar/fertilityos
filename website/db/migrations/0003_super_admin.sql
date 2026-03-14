-- Super Admin: add role and system tenant for platform-wide dashboard access.

ALTER TYPE "role_slug" ADD VALUE IF NOT EXISTS 'super_admin';

INSERT INTO "roles" ("slug", "name", "description") VALUES
  ('super_admin', 'Super Administrator', 'Platform-wide access: all tenants, analytics, and system overview')
ON CONFLICT ("slug") DO NOTHING;

-- System tenant for super admin users (slug 'system' reserved).
INSERT INTO "tenants" ("name", "slug", "country") VALUES
  ('FertilityOS', 'system', 'US')
ON CONFLICT ("slug") DO NOTHING;
