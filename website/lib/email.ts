/**
 * Email sending for FertilityOS. Uses Resend when RESEND_API_KEY is set.
 * When not set, logs to console (e.g. local dev or cron dry-run).
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.REMINDER_FROM_EMAIL ?? "FertilityOS <noreply@thefertilityos.com>";
const FROM_DOMAIN = process.env.RESEND_FROM_DOMAIN ?? "thefertilityos.com";

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(options: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const { to, subject, html, text } = options;

  if (!to?.trim()) {
    return { ok: false, error: "Missing recipient" };
  }

  if (RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: to.trim(),
        subject,
        html,
        text: text ?? undefined,
      });
      if (error) {
        console.error("[email] Resend error:", error);
        return { ok: false, error: String(error) };
      }
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[email] Send failed:", msg);
      return { ok: false, error: msg };
    }
  }

  // No API key: fail so verification/password-reset flows show an error instead of silently not sending
  console.log("[email] (no RESEND_API_KEY) Would send:", { to: to.trim(), subject });
  return {
    ok: false,
    error: "Email is not configured. Set RESEND_API_KEY in the app environment and add your domain in Resend.",
  };
}

export function appointmentReminderContent(params: {
  patientFirstName: string;
  patientLastName: string;
  startAt: Date;
  type: string;
  clinicName?: string;
}): { subject: string; html: string; text: string } {
  const { patientFirstName, patientLastName, startAt, type, clinicName } = params;
  const dateStr = startAt.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
  const clinic = clinicName ?? "Your clinic";
  const subject = `Appointment reminder: ${type} on ${dateStr}`;
  const text = `Hi ${patientFirstName} ${patientLastName},\n\nThis is a reminder that you have an appointment (${type}) on ${dateStr}.\n\n${clinic}`;
  const html = `
    <p>Hi ${patientFirstName} ${patientLastName},</p>
    <p>This is a reminder that you have an appointment <strong>${type}</strong> on <strong>${dateStr}</strong>.</p>
    <p>${clinic}</p>
    <p>— FertilityOS</p>
  `.trim();

  return { subject, html, text };
}

export function patientPortalMagicLinkContent(params: {
  magicLinkUrl: string;
  patientFirstName?: string;
}): { subject: string; html: string; text: string } {
  const { magicLinkUrl, patientFirstName } = params;
  const name = patientFirstName ?? "there";
  const subject = "Sign in to your patient portal";
  const text = `Hi ${name},\n\nClick the link below to sign in to your patient portal:\n\n${magicLinkUrl}\n\nThis link expires in 24 hours. If you didn't request it, you can ignore this email.\n\n— FertilityOS`;
  const html = `
    <p>Hi ${name},</p>
    <p>Click the link below to sign in to your patient portal:</p>
    <p><a href="${magicLinkUrl}" style="color: #2563eb;">Sign in</a></p>
    <p>Or copy and paste: ${magicLinkUrl}</p>
    <p style="color: #64748b; font-size: 14px;">This link expires in 24 hours. If you didn't request it, you can ignore this email.</p>
    <p>— FertilityOS</p>
  `.trim();
  return { subject, html, text };
}

export function patientPortalPasswordResetContent(params: {
  resetUrl: string;
  patientFirstName?: string;
}): { subject: string; html: string; text: string } {
  const { resetUrl, patientFirstName } = params;
  const name = patientFirstName ?? "there";
  const subject = "Reset your patient portal password";
  const text = `Hi ${name},\n\nClick the link below to set a new password for your patient portal:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request it, you can ignore this email.\n\n— FertilityOS`;
  const html = `
    <p>Hi ${name},</p>
    <p>Click the link below to set a new password for your patient portal:</p>
    <p><a href="${resetUrl}" style="color: #2563eb;">Set new password</a></p>
    <p>Or copy and paste: ${resetUrl}</p>
    <p style="color: #64748b; font-size: 14px;">This link expires in 1 hour. If you didn't request it, you can ignore this email.</p>
    <p>— FertilityOS</p>
  `.trim();
  return { subject, html, text };
}

export function staffPasswordResetContent(params: {
  resetUrl: string;
  staffName?: string;
}): { subject: string; html: string; text: string } {
  const { resetUrl, staffName } = params;
  const name = staffName ?? "there";
  const subject = "Reset your FertilityOS password";
  const text = `Hi ${name},\n\nClick the link below to set a new password for your FertilityOS account:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request it, you can ignore this email.\n\n— FertilityOS`;
  const html = `
    <p>Hi ${name},</p>
    <p>Click the link below to set a new password for your FertilityOS account:</p>
    <p><a href="${resetUrl}" style="color: #2563eb;">Set new password</a></p>
    <p>Or copy and paste: ${resetUrl}</p>
    <p style="color: #64748b; font-size: 14px;">This link expires in 1 hour. If you didn't request it, you can ignore this email.</p>
    <p>— FertilityOS</p>
  `.trim();
  return { subject, html, text };
}

export function patientPortalSetPasswordContent(params: {
  setPasswordUrl: string;
  patientFirstName?: string;
}): { subject: string; html: string; text: string } {
  const { setPasswordUrl, patientFirstName } = params;
  const name = patientFirstName ?? "there";
  const subject = "Set your patient portal password";
  const text = `Hi ${name},\n\nClick the link below to set a password for your patient portal. You can then sign in with your email and password anytime:\n\n${setPasswordUrl}\n\nThis link expires in 24 hours.\n\n— FertilityOS`;
  const html = `
    <p>Hi ${name},</p>
    <p>Click the link below to set a password for your patient portal. You can then sign in with your email and password anytime:</p>
    <p><a href="${setPasswordUrl}" style="color: #2563eb;">Set password</a></p>
    <p>Or copy and paste: ${setPasswordUrl}</p>
    <p style="color: #64748b; font-size: 14px;">This link expires in 24 hours.</p>
    <p>— FertilityOS</p>
  `.trim();
  return { subject, html, text };
}
