import { NextResponse } from "next/server";
import { db } from "@/db";
import { patients, patientPortalTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendEmail, patientPortalMagicLinkContent } from "@/lib/email";

const TOKEN_EXPIRY_HOURS = 24;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const [patient] = await db
      .select({ id: patients.id, firstName: patients.firstName, email: patients.email })
      .from(patients)
      .where(eq(patients.email, email))
      .limit(1);

    if (!patient) {
      return NextResponse.json({
        message: "If an account exists for this email, we sent you a sign-in link.",
      });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await db.insert(patientPortalTokens).values({
      patientId: patient.id,
      email: patient.email ?? email,
      token,
      expiresAt,
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
    const origin = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
    const magicLinkUrl = `${origin}/portal/verify?token=${encodeURIComponent(token)}`;

    const { subject, html, text } = patientPortalMagicLinkContent({
      magicLinkUrl,
      patientFirstName: patient.firstName ?? undefined,
    });

    await sendEmail({
      to: patient.email ?? email,
      subject,
      html,
      text,
    });

    return NextResponse.json({
      message: "If an account exists for this email, we sent you a sign-in link.",
    });
  } catch (e) {
    console.error("[portal] request-link error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
