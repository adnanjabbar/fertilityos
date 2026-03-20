import { db } from "@/db";
import { platformAdminAuditLog } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";

export const PLATFORM_COMPLIANCE_TAGS = "GDPR,HIPAA,HL7";

export type PlatformAdminEventType =
  | "subscription_billing_plan_changed"
  | "subscription_status_changed"
  | "tenant_modules_changed";

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
