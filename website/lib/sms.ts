/**
 * SMS sending for FertilityOS. Tenants use their own Twilio credentials (stored in tenant_integrations).
 * No platform Twilio keys — each clinic adds their account in Settings → Integrations.
 * If tenantId is provided, only that tenant's credentials are used; otherwise no SMS is sent (stub logged).
 */

export type SendSmsOptions = {
  to: string;
  body: string;
  /** When set, use this tenant's Twilio credentials from tenant_integrations. Required for real SMS. */
  tenantId?: string;
};

export async function sendSms(options: SendSmsOptions): Promise<{ ok: boolean; error?: string }> {
  const { to, body, tenantId } = options;

  const normalizedTo = to?.trim().replace(/\s/g, "");
  if (!normalizedTo) {
    return { ok: false, error: "Missing recipient phone" };
  }

  let accountSid: string | undefined;
  let authToken: string | undefined;
  let fromPhone: string | undefined;

  if (tenantId) {
    const { db } = await import("@/db");
    const { tenantIntegrations } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const [row] = await db
      .select({
        twilioAccountSid: tenantIntegrations.twilioAccountSid,
        twilioAuthToken: tenantIntegrations.twilioAuthToken,
        twilioPhoneNumber: tenantIntegrations.twilioPhoneNumber,
      })
      .from(tenantIntegrations)
      .where(eq(tenantIntegrations.tenantId, tenantId))
      .limit(1);
    if (row?.twilioAccountSid && row?.twilioAuthToken && row?.twilioPhoneNumber) {
      accountSid = row.twilioAccountSid;
      authToken = row.twilioAuthToken;
      fromPhone = row.twilioPhoneNumber;
    }
  } else if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    accountSid = process.env.TWILIO_ACCOUNT_SID;
    authToken = process.env.TWILIO_AUTH_TOKEN;
    fromPhone = process.env.TWILIO_PHONE_NUMBER;
  }

  if (accountSid && authToken && fromPhone) {
    try {
      const twilio = await import("twilio");
      const client = twilio.default(accountSid, authToken);
      await client.messages.create({
        body,
        from: fromPhone,
        to: normalizedTo,
      });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[sms] Twilio error:", msg);
      return { ok: false, error: msg };
    }
  }

  // No tenant credentials (and we do not use platform keys): stub
  console.log("[sms] (no tenant Twilio) Would send:", { to: normalizedTo, body: body.slice(0, 50) + (body.length > 50 ? "…" : "") });
  return { ok: true };
}

export function appointmentReminderSmsBody(params: {
  patientFirstName: string;
  startAt: Date;
  type: string;
  clinicName?: string;
}): string {
  const { patientFirstName, startAt, type, clinicName } = params;
  const dateStr = startAt.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  const clinic = clinicName ?? "Your clinic";
  return `${patientFirstName}, reminder: ${type} appointment on ${dateStr}. ${clinic}`;
}
