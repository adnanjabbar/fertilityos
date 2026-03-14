-- Patient portal: magic-link tokens
CREATE TABLE IF NOT EXISTS "patient_portal_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "email" varchar(255) NOT NULL,
  "token" varchar(64) NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

-- Telemedicine: room id on appointment
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "video_room_id" varchar(255);
