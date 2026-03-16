import { NextResponse } from "next/server";
import { z } from "zod";
import { createAndSendEmailVerification } from "@/lib/email-verification";

const bodySchema = z.object({
  email: z.string().email("Invalid email"),
  context: z.literal("clinic_register"),
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

    const result = await createAndSendEmailVerification({
      email: parsed.data.email,
      context: parsed.data.context,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "Verification code sent to your email.",
    });
  } catch (e) {
    console.error("[send-email-verification] error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
