import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { invitations, patients } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { createAndSendOtp } from "@/lib/otp";
import { logAudit } from "@/lib/audit";
import { rateLimitOtp } from "@/lib/rate-limit";

const bodySchema = z.object({
  phone: z.string().min(1, "Phone is required"),
  context: z.enum(["admin_signup", "staff_invite", "patient_verify"]),
  inviteToken: z.string().optional(),
  patientId: z.string().uuid().optional(),
  recipientName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { phone, context, inviteToken, patientId, recipientName } = parsed.data;

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const otpIdentifier = `${ip}:${phone}:${context}`;
    const { allowed } = rateLimitOtp(otpIdentifier);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many OTP requests. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    if (context === "admin_signup") {
      const result = await createAndSendOtp({
        phone,
        context: "admin_signup",
        recipientName: recipientName ?? "You",
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        verificationId: result.verificationId,
        message: "Verification code sent.",
      });
    }

    if (context === "staff_invite") {
      if (!inviteToken) {
        return NextResponse.json({ error: "Invite token is required" }, { status: 400 });
      }
      const [inv] = await db
        .select()
        .from(invitations)
        .where(and(eq(invitations.token, inviteToken), isNull(invitations.acceptedAt)))
        .limit(1);
      if (!inv) {
        return NextResponse.json({ error: "Invitation not found or already used" }, { status: 404 });
      }
      if (inv.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invitation expired" }, { status: 410 });
      }
      const result = await createAndSendOtp({
        phone,
        context: "staff_invite",
        tenantId: inv.tenantId,
        metadata: { inviteToken },
        recipientName: recipientName ?? "You",
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        verificationId: result.verificationId,
        message: "Verification code sent.",
      });
    }

    if (context === "patient_verify") {
      const session = await auth();
      if (!session?.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!patientId) {
        return NextResponse.json({ error: "patientId is required" }, { status: 400 });
      }
      const [patient] = await db
        .select({ id: patients.id, firstName: patients.firstName, phone: patients.phone })
        .from(patients)
        .where(and(eq(patients.id, patientId), eq(patients.tenantId, session.user.tenantId)))
        .limit(1);
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }
      const toPhone = phone.trim().replace(/\s/g, "");
      if (patient.phone?.trim().replace(/\s/g, "") !== toPhone) {
        return NextResponse.json({ error: "Phone does not match patient record" }, { status: 400 });
      }
      const result = await createAndSendOtp({
        phone: toPhone,
        context: "patient_verify",
        tenantId: session.user.tenantId,
        metadata: { patientId },
        recipientName: patient.firstName ?? "Patient",
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      await logAudit({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "auth.phone_verification_sent",
        entityType: "patient",
        entityId: patientId,
        details: { context: "patient_verify" },
      }).catch(() => {});
      return NextResponse.json({
        verificationId: result.verificationId,
        message: "Verification code sent.",
      });
    }

    return NextResponse.json({ error: "Invalid context" }, { status: 400 });
  } catch (e) {
    console.error("[send-otp] error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
