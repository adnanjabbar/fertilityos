/**
 * OTP generation, storage, and delivery (SMS or WhatsApp).
 * Used for: admin_signup, staff_invite, patient_verify.
 * Rate limit: max 3 sends per phone+context per 15 minutes.
 */

import { randomInt } from "crypto";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { sendSms } from "@/lib/sms";
import { sendWhatsApp } from "@/lib/whatsapp";

const OTP_EXPIRY_MINUTES = 10;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_SENDS = 3;

export type OtpContext = "admin_signup" | "staff_invite" | "patient_verify";

function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s/g, "");
}

export async function createAndSendOtp(params: {
  phone: string;
  context: OtpContext;
  tenantId?: string;
  metadata?: Record<string, unknown>;
  recipientName?: string;
}): Promise<{ ok: boolean; error?: string; verificationId?: string }> {
  const phone = normalizePhone(params.phone);
  if (!phone) return { ok: false, error: "Invalid phone number" };

  // Rate limit
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  const recent = await db
    .select({ id: otpCodes.id, createdAt: otpCodes.createdAt })
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, phone),
        eq(otpCodes.context, params.context),
        gt(otpCodes.createdAt, windowStart)
      )
    );
  if (recent.length >= RATE_LIMIT_MAX_SENDS) {
    const oldestCreatedAt = recent.reduce(
      (min, r) => (r.createdAt < min ? r.createdAt : min),
      recent[0]!.createdAt
    );
    const windowEndMs =
      oldestCreatedAt.getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
    const minutesLeft = Math.max(
      1,
      Math.ceil((windowEndMs - Date.now()) / (60 * 1000))
    );
    return {
      ok: false,
      error: `Too many attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}.`,
    };
  }

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const [row] = await db
    .insert(otpCodes)
    .values({
      context: params.context,
      phone,
      code,
      expiresAt,
      tenantId: params.tenantId ?? null,
      metadata: params.metadata ?? null,
    })
    .returning({ id: otpCodes.id });

  if (!row) return { ok: false, error: "Failed to create verification code" };

  const messageBody = params.recipientName
    ? `${params.recipientName}, your verification code is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`
    : `Your verification code is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;

  let sent = false;
  if (params.tenantId) {
    const whatsappResult = await sendWhatsApp({
      to: phone,
      body: messageBody,
      tenantId: params.tenantId,
    });
    if (whatsappResult.ok) sent = true;
  }
  if (!sent) {
    const smsResult = await sendSms({
      to: phone,
      body: messageBody,
      tenantId: params.tenantId,
    });
    sent = smsResult.ok;
    if (!sent) return { ok: false, error: smsResult.error ?? "Could not send code" };
  }

  return { ok: true, verificationId: row.id };
}

export async function verifyOtp(params: {
  phone: string;
  code: string;
  context: OtpContext;
  tenantId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const phone = normalizePhone(params.phone);
  if (!phone || !params.code.trim()) return { ok: false, error: "Invalid phone or code" };

  const [row] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, phone),
        eq(otpCodes.context, params.context),
        eq(otpCodes.code, params.code.trim()),
        gt(otpCodes.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!row) return { ok: false, error: "Invalid or expired code" };

  await db.delete(otpCodes).where(eq(otpCodes.id, row.id));
  return { ok: true };
}
