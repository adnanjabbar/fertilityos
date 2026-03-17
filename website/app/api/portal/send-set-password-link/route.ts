import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { patients, patientPasswordTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendEmail, patientPortalSetPasswordContent } from "@/lib/email";

const SET_PASSWORD_TOKEN_EXPIRY_HOURS = 24;

export async function POST() {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.roleSlug !== "patient" || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patientId = session.user.patientId ?? session.user.id;
  const [patient] = await db
    .select({ id: patients.id, tenantId: patients.tenantId, email: patients.email, firstName: patients.firstName })
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);

  if (!patient?.email?.trim()) {
    return NextResponse.json({ error: "No email on file. Contact your clinic to add an email." }, { status: 400 });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SET_PASSWORD_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await db.insert(patientPasswordTokens).values({
    tenantId: patient.tenantId,
    patientId: patient.id,
    token,
    type: "set",
    expiresAt,
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const origin = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  const setPasswordUrl = `${origin}/portal/set-password?token=${encodeURIComponent(token)}`;

  const { subject, html, text } = patientPortalSetPasswordContent({
    setPasswordUrl,
    patientFirstName: patient.firstName ?? undefined,
  });

  await sendEmail({
    to: patient.email,
    subject,
    html,
    text,
  });

  return NextResponse.json({
    message: "We sent you an email with a link to set your password. The link expires in 24 hours.",
  });
}
