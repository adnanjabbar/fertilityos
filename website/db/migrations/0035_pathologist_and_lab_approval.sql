-- Pathologist role and lab order approval workflow
-- Status flow: ordered -> sample_collected -> in_processing -> completed -> awaiting_final_approval -> published

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'role_slug' AND e.enumlabel = 'pathologist'
  ) THEN
    ALTER TYPE "role_slug" ADD VALUE 'pathologist';
  END IF;
END $$;

INSERT INTO "roles" ("slug", "name", "description") VALUES
  ('pathologist', 'Pathologist', 'Approve lab reports, review and sign off test results')
ON CONFLICT ("slug") DO NOTHING;

-- Lab order approval (pathologist or admin)
ALTER TABLE "lab_orders" ADD COLUMN IF NOT EXISTS "approved_by" uuid REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "lab_orders" ADD COLUMN IF NOT EXISTS "approved_at" timestamptz;
CREATE INDEX IF NOT EXISTS "lab_orders_approved_by_idx" ON "lab_orders" ("approved_by");
