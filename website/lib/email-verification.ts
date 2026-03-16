/**
 * Email verification code: create, store, send, and verify.
 * Used for clinic registration (context: clinic_register).
 */

import { randomInt } from "crypto";
import { db } from "@/db";
import { emailVerificationCodes, verifiedEmails } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

const CODE_EXPIRY_MINUTES = 15;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_SENDS = 3;

export type EmailVerificationContext = "clinic_register";

export async function createAndSendEmailVerification(params: {
  email: string;
  context: EmailVerificationContext;
}): Promise<{ ok: boolean; error?: string }> {
  const email = params.email.trim().toLowerCase();
  if (!email) return { ok: false, error: "Invalid email" };

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  const recent = await db
    .select({ id: emailVerificationCodes.id })
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.email, email),
        eq(emailVerificationCodes.context, params.context),
        gt(emailVerificationCodes.createdAt, windowStart)
      )
    );
  if (recent.length >= RATE_LIMIT_MAX_SENDS) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(emailVerificationCodes).values({
    email,
    code,
    context: params.context,
    expiresAt,
  });

  const subject = "Your verification code – FertilityOS";
  const html = `
    <p>Your verification code is: <strong>${code}</strong></p>
    <p>It expires in ${CODE_EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
    <p>— FertilityOS</p>
  `;
  const text = `Your verification code is ${code}. It expires in ${CODE_EXPIRY_MINUTES} minutes.`;

  const result = await sendEmail({ to: email, subject, html, text });
  if (!result.ok) return { ok: false, error: result.error ?? "Could not send email" };
  return { ok: true };
}

export async function verifyEmailCode(params: {
  email: string;
  code: string;
  context: EmailVerificationContext;
}): Promise<{ ok: boolean; error?: string }> {
  const email = params.email.trim().toLowerCase();
  const code = params.code.trim();
  if (!email || code.length !== 6) return { ok: false, error: "Invalid email or code" };

  const [row] = await db
    .select()
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.email, email),
        eq(emailVerificationCodes.context, params.context),
        eq(emailVerificationCodes.code, code),
        gt(emailVerificationCodes.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!row) return { ok: false, error: "Invalid or expired code" };

  await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.id, row.id));

  await db
    .insert(verifiedEmails)
    .values({
      email,
      context: params.context,
      verifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [verifiedEmails.email, verifiedEmails.context],
      set: { verifiedAt: new Date(), usedAt: null },
    });

  return { ok: true };
}

export async function consumeVerifiedEmail(params: {
  email: string;
  context: EmailVerificationContext;
}): Promise<boolean> {
  const email = params.email.trim().toLowerCase();
  const [row] = await db
    .select()
    .from(verifiedEmails)
    .where(
      and(
        eq(verifiedEmails.email, email),
        eq(verifiedEmails.context, params.context)
      )
    )
    .limit(1);
  if (!row || row.usedAt) return false;
  await db
    .update(verifiedEmails)
    .set({ usedAt: new Date() })
    .where(eq(verifiedEmails.id, row.id));
  return true;
}
