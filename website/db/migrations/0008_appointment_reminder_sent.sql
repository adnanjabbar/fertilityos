-- MVP Polish: Track when appointment reminder email was sent.
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "reminder_sent_at" timestamp with time zone;
