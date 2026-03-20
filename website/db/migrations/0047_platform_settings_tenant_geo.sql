-- Platform-wide settings (e.g. which UI locales are live). Super admin can override env defaults.
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key varchar(64) NOT NULL UNIQUE,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings (setting_key);

-- Optional clinic coordinates from registration (GPS pin). Stored as text for broad driver compatibility.
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS latitude varchar(32);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS longitude varchar(32);
