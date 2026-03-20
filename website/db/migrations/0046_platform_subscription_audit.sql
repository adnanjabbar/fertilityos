-- Super-admin billing plan + immutable platform compliance audit trail (GDPR / HIPAA accountability; HL7 governance tagging).

ALTER TABLE "tenant_subscriptions"
  ADD COLUMN IF NOT EXISTS "billing_plan" varchar(32) NOT NULL DEFAULT 'free';

-- Normalize invalid values on first deploy
UPDATE "tenant_subscriptions" SET "billing_plan" = 'free' WHERE "billing_plan" IS NULL OR "billing_plan" = '';

ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT IF EXISTS "tenant_subscriptions_billing_plan_check";
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_billing_plan_check"
  CHECK ("billing_plan" IN ('free', 'basic', 'pro', 'enterprise'));

CREATE TABLE IF NOT EXISTS "platform_admin_audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "actor_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "event_type" varchar(64) NOT NULL,
  "previous_state" jsonb,
  "new_state" jsonb,
  "compliance_tags" varchar(256) NOT NULL DEFAULT 'GDPR,HIPAA,HL7',
  "ip_address" varchar(45),
  "user_agent" text,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "platform_admin_audit_log_tenant_idx" ON "platform_admin_audit_log" ("tenant_id");
CREATE INDEX IF NOT EXISTS "platform_admin_audit_log_created_idx" ON "platform_admin_audit_log" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "platform_admin_audit_log_actor_idx" ON "platform_admin_audit_log" ("actor_user_id");
CREATE INDEX IF NOT EXISTS "platform_admin_audit_log_event_idx" ON "platform_admin_audit_log" ("event_type");
