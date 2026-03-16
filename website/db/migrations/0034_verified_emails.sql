-- Track verified emails for registration (consumed when used).
CREATE TABLE IF NOT EXISTS "verified_emails" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "context" varchar(32) NOT NULL,
  "verified_at" timestamp with time zone DEFAULT now() NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "verified_emails_email_context_idx"
  ON "verified_emails" ("email", "context");
