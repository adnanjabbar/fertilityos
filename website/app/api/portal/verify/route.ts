import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  patients,
  prescriptions,
  patientOtpCodes,
} from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { randomInt } from "crypto";
import { sendSms } from "@/lib/sms";

const OTP_EXPIRY_MINUTES = 10;
const NATIONAL_ID_TYPES = ["national_id", "ssn", "citizen_id", "other"] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const nationalIdType = typeof body.nationalIdType === "string" ? body.nationalIdType.trim() : "";
    const nationalIdValue = typeof body.nationalIdValue === "string" ? body.nationalIdValue.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim().replace(/\s/g, "") : "";
    const prescriptionId = typeof body.prescriptionId === "string" ? body.prescriptionId.trim() : null;

    if (!nationalIdType || !nationalIdValue || !phone) {
      return NextResponse.json(
        { error: "National ID type, national ID value, and phone are required." },
        { status: 400 }
      );
    }
    if (!NATIONAL_ID_TYPES.includes(nationalIdType as (typeof NATIONAL_ID_TYPES)[number])) {
      return NextResponse.json(
        { error: "Invalid national ID type." },
        { status: 400 }
      );
    }

    let tenantId: string;

    if (prescriptionId) {
      const [rx] = await db
        .select({ tenantId: prescriptions.tenantId, patientId: prescriptions.patientId })
        .from(prescriptions)
        .where(eq(prescriptions.id, prescriptionId))
        .limit(1);
      if (!rx) {
        return NextResponse.json(
          { error: "Prescription not found or link expired." },
          { status: 404 }
        );
      }
      tenantId = rx.tenantId;
    } else {
      return NextResponse.json(
        { error: "Prescription reference is required. Use the link from your printed prescription." },
        { status: 400 }
      );
    }

    const [patient] = await db
      .select({
        id: patients.id,
        firstName: patients.firstName,
        phone: patients.phone,
        nationalIdType: patients.nationalIdType,
        nationalIdValue: patients.nationalIdValue,
      })
      .from(patients)
      .where(
        and(
          eq(patients.tenantId, tenantId),
          eq(patients.nationalIdType, nationalIdType),
          eq(patients.nationalIdValue, nationalIdValue),
          eq(patients.phone, phone)
        )
      )
      .limit(1);

    if (!patient) {
      return NextResponse.json(
        { error: "No patient found with this national ID and phone number. Please check your details or contact the clinic." },
        { status: 404 }
      );
    }

    if (prescriptionId) {
      const [rx] = await db
        .select({ patientId: prescriptions.patientId })
        .from(prescriptions)
        .where(eq(prescriptions.id, prescriptionId))
        .limit(1);
      if (!rx || rx.patientId !== patient.id) {
        return NextResponse.json(
          { error: "This prescription does not belong to the identified patient." },
          { status: 403 }
        );
      }
    }

    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const [otpRow] = await db
      .insert(patientOtpCodes)
      .values({
        patientId: patient.id,
        phone,
        code,
        expiresAt,
      })
      .returning({ id: patientOtpCodes.id });

    if (!otpRow) {
      return NextResponse.json({ error: "Failed to create verification code." }, { status: 500 });
    }

    const smsBody = `${patient.firstName ?? "Patient"}, your verification code is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;
    const smsResult = await sendSms({ to: phone, body: smsBody, tenantId });
    if (!smsResult.ok) {
      console.error("[portal] verify SMS failed:", smsResult.error);
      return NextResponse.json(
        { error: "Could not send verification code. Please try again or contact the clinic." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verificationId: otpRow.id,
      message: "Verification code sent to your phone.",
    });
  } catch (e) {
    console.error("[portal] verify error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
