import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { verifyOtp } from "@/lib/otp";
import { logAudit } from "@/lib/audit";

const bodySchema = z.object({
  phone: z.string().min(1, "Phone is required"),
  code: z.string().length(6, "Code must be 6 digits"),
  context: z.enum(["admin_signup", "staff_invite", "patient_verify"]),
  inviteToken: z.string().optional(),
  patientId: z.string().uuid().optional(),
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

    const { phone, code, context, patientId } = parsed.data;

    if (context === "patient_verify") {
      const session = await auth();
      if (!session?.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!patientId) {
        return NextResponse.json({ error: "patientId is required" }, { status: 400 });
      }
    }

    const result = await verifyOtp({
      phone,
      code,
      context,
      tenantId: context === "patient_verify" ? undefined : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (context === "patient_verify" && patientId) {
      const session = await auth();
      if (session?.user?.tenantId) {
        await db
          .update(patients)
          .set({ phoneVerifiedAt: new Date() })
          .where(
            and(
              eq(patients.id, patientId),
              eq(patients.tenantId, session.user.tenantId)
            )
          );
        await logAudit({
          tenantId: session.user.tenantId,
          userId: session.user.id,
          action: "auth.phone_verification_succeeded",
          entityType: "patient",
          entityId: patientId,
          details: { context: "patient_verify" },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: "Phone verified.",
    });
  } catch (e) {
    console.error("[verify-otp] error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
