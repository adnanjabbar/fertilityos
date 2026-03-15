-- Phase 7.4: SMS appointment reminders — reminder channel per tenant, SMS sent timestamp per appointment
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_channel') THEN
    CREATE TYPE reminder_channel AS ENUM ('email', 'sms', 'both');
  END IF;
END
$$;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS reminder_channel reminder_channel NOT NULL DEFAULT 'email';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sms_sent_at timestamp with time zone;
