import { NextResponse } from "next/server";
import { db } from "@/db";
import { trialSignups } from "@/db/schema";
import { eq } from "drizzle-orm";

const BODY = {
  email: "string",
  phone: "string (optional)",
  clinicName: "string (optional)",
} as const;

/**
 * POST /api/landing/trial-request
 * Store trial/waitlist signup. Used to prevent repeat trial abuse (one signup per email).
 * Returns { allowed: true } when new; { allowed: false, reason: "already_requested" } when email already used.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim().replace(/\s/g, "") : null;
    const clinicName = typeof body.clinicName === "string" ? body.clinicName.trim().slice(0, 255) : null;

    if (!email) {
      return NextResponse.json(
        { allowed: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({ id: trialSignups.id })
      .from(trialSignups)
      .where(eq(trialSignups.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json({
        allowed: false,
        reason: "already_requested",
        message: "This email has already been used for a trial or waitlist signup.",
      });
    }

    await db.insert(trialSignups).values({
      email,
      phone: phone || null,
      clinicName: clinicName || null,
    });

    return NextResponse.json({
      allowed: true,
      message: "Thanks! We'll be in touch with next steps for your 14-day trial.",
    });
  } catch (e) {
    console.error("[trial-request]", e);
    return NextResponse.json(
      { allowed: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
