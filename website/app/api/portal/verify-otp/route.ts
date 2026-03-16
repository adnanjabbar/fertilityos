import { NextResponse } from "next/server";
import { db } from "@/db";
import { patientOtpCodes, patientPortalTokens, patients } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { randomBytes } from "crypto";

const PORTAL_TOKEN_EXPIRY_HOURS = 24;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const verificationId = typeof body.verificationId === "string" ? body.verificationId.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim().replace(/\s/g, "") : "";

    if (!verificationId || !code) {
      return NextResponse.json(
        { error: "Verification ID and code are required." },
        { status: 400 }
      );
    }

    const [otpRow] = await db
      .select()
      .from(patientOtpCodes)
      .where(
        and(
          eq(patientOtpCodes.id, verificationId),
          gt(patientOtpCodes.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!otpRow) {
      return NextResponse.json(
        { error: "Invalid or expired verification code. Please request a new one." },
        { status: 400 }
      );
    }

    if (otpRow.code !== code) {
      return NextResponse.json(
        { error: "Incorrect verification code." },
        { status: 400 }
      );
    }

    const [patient] = await db
      .select({ id: patients.id, email: patients.email })
      .from(patients)
      .where(eq(patients.id, otpRow.patientId))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + PORTAL_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await db.insert(patientPortalTokens).values({
      patientId: patient.id,
      email: patient.email ?? "",
      token,
      expiresAt,
    });

    await db
      .update(patients)
      .set({ phoneVerifiedAt: new Date() })
      .where(eq(patients.id, patient.id));

    await db.delete(patientOtpCodes).where(eq(patientOtpCodes.id, verificationId));

    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
    const origin = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;

    return NextResponse.json({
      token,
      redirectUrl: `${origin}/portal/verify?token=${encodeURIComponent(token)}`,
    });
  } catch (e) {
    console.error("[portal] verify-otp error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
