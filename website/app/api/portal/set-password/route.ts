import { NextResponse } from "next/server";
import { db } from "@/db";
import { patients, patientPasswordTokens } from "@/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!token) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    const [row] = await db
      .select({
        tokenId: patientPasswordTokens.id,
        patientId: patientPasswordTokens.patientId,
      })
      .from(patientPasswordTokens)
      .where(
        and(
          eq(patientPasswordTokens.token, token),
          gt(patientPasswordTokens.expiresAt, new Date()),
          isNull(patientPasswordTokens.usedAt)
        )
      )
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db
      .update(patients)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(patients.id, row.patientId));

    await db
      .update(patientPasswordTokens)
      .set({ usedAt: new Date() })
      .where(eq(patientPasswordTokens.id, row.tokenId));

    return NextResponse.json({ message: "Password set successfully. You can sign in with your email and password." });
  } catch (e) {
    console.error("[portal] set-password error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
