import { db } from "@/db";
import { platformAdminAuditLog } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";

export const PLATFORM_COMPLIANCE_TAGS = "GDPR,HIPAA,HL7";

export type PlatformAdminEventType =
  | "subscription_billing_plan_changed"
  | "subscription_status_changed"
  | "tenant_modules_changed"
  | "tenant_permanently_deleted"
  | "stripe_subscription_sync"
  | "platform_promotion_code_created"
  | "platform_promotion_code_deactivated";

/**
 * Append-only platform audit row + mirror summary on tenant audit_logs for clinic visibility.
 * No PHI in payloads — configuration and accountability only.
 */
export async function logPlatformAdminChange(params: {
  tenantId: string;
  actorUserId: string;
  eventType: PlatformAdminEventType;
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
  request?: Request | null;
  notes?: string | null;
}): Promise<void> {
  const ip = params.request ? getClientIp(params.request) : null;
  const userAgent = params.request?.headers.get("user-agent") ?? null;

  await db.insert(platformAdminAuditLog).values({
    tenantId: params.tenantId,
    actorUserId: params.actorUserId,
    eventType: params.eventType,
    previousState: params.previousState,
    newState: params.newState,
    complianceTags: PLATFORM_COMPLIANCE_TAGS,
    ipAddress: ip,
    userAgent,
    notes: params.notes ?? null,
  });

  await logAudit({
    tenantId: params.tenantId,
    userId: params.actorUserId,
    action: `platform.${params.eventType}`,
    entityType: "tenant",
    entityId: params.tenantId,
    details: {
      eventType: params.eventType,
      previous: params.previousState,
      next: params.newState,
      complianceTags: PLATFORM_COMPLIANCE_TAGS,
      notes: params.notes ?? undefined,
    },
    ipAddress: ip,
  });
}

/**
 * Log clinic purge before DELETE CASCADE. Row is stored under **system** tenant so it is not
 * removed when the clinic row is deleted.
 */
export async function logTenantPermanentDeletion(params: {
  systemTenantId: string;
  actorUserId: string;
  deleted: { id: string; name: string; slug: string };
  request?: Request | null;
  notes?: string | null;
}): Promise<void> {
  const ip = params.request ? getClientIp(params.request) : null;
  const userAgent = params.request?.headers.get("user-agent") ?? null;

  await db.insert(platformAdminAuditLog).values({
    tenantId: params.systemTenantId,
    actorUserId: params.actorUserId,
    eventType: "tenant_permanently_deleted",
    previousState: {
      deletedTenantId: params.deleted.id,
      deletedTenantName: params.deleted.name,
      deletedTenantSlug: params.deleted.slug,
    },
    newState: { result: "tenant_and_dependents_removed_cascade" },
    complianceTags: PLATFORM_COMPLIANCE_TAGS,
    ipAddress: ip,
    userAgent,
    notes: params.notes ?? null,
  });

  await logAudit({
    tenantId: params.systemTenantId,
    userId: params.actorUserId,
    action: "platform.tenant_permanently_deleted",
    entityType: "tenant",
    entityId: params.deleted.id,
    details: {
      deletedTenantName: params.deleted.name,
      deletedTenantSlug: params.deleted.slug,
      complianceTags: PLATFORM_COMPLIANCE_TAGS,
      notes: params.notes ?? undefined,
    },
    ipAddress: ip,
  });
}

/** Stripe webhook (no human actor): billing sync audit on system tenant. */
export async function logStripeSubscriptionSync(params: {
  systemTenantId: string;
  affectedTenantId: string;
  eventType: string;
  stripeEventId: string;
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
}): Promise<void> {
  await db.insert(platformAdminAuditLog).values({
    tenantId: params.systemTenantId,
    actorUserId: null,
    eventType: "stripe_subscription_sync",
    previousState: {
      stripeEventType: params.eventType,
      stripeEventId: params.stripeEventId,
      affectedTenantId: params.affectedTenantId,
      ...(params.previousState ?? {}),
    },
    newState: params.newState,
    complianceTags: PLATFORM_COMPLIANCE_TAGS,
    ipAddress: null,
    userAgent: "Stripe-Webhook",
    notes: "Automated billing sync (no PHI)",
  });

  await logAudit({
    tenantId: params.systemTenantId,
    userId: null,
    action: "platform.stripe_subscription_sync",
    entityType: "tenant",
    entityId: params.affectedTenantId,
    details: {
      stripeEventType: params.eventType,
      stripeEventId: params.stripeEventId,
      complianceTags: PLATFORM_COMPLIANCE_TAGS,
    },
  });
}
