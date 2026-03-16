import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailCode } from "@/lib/email-verification";

const bodySchema = z.object({
  email: z.string().email("Invalid email"),
  code: z.string().length(6, "Code must be 6 digits"),
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

    const result = await verifyEmailCode({
      email: parsed.data.email,
      code: parsed.data.code,
      context: parsed.data.context,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Email verified.",
    });
  } catch (e) {
    console.error("[verify-email] error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
