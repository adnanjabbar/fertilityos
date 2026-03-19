import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, userPasswordTokens } from "@/db/schema";
import { and, eq, gt, isNull } from "drizzle-orm";
import { validateStaffPassword } from "@/lib/password-policy";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body.password === "string" ? body.password : "";

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Missing token or password" }, { status: 400 });
    }

    const passwordValidation = validateStaffPassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 });
    }

    const [row] = await db
      .select({
        id: userPasswordTokens.id,
        tenantId: userPasswordTokens.tenantId,
        userId: userPasswordTokens.userId,
        expiresAt: userPasswordTokens.expiresAt,
        usedAt: userPasswordTokens.usedAt,
        type: userPasswordTokens.type,
      })
      .from(userPasswordTokens)
      .where(
        and(
          eq(userPasswordTokens.token, token),
          eq(userPasswordTokens.type, "reset"),
          gt(userPasswordTokens.expiresAt, new Date()),
          isNull(userPasswordTokens.usedAt)
        )
      )
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
    await db
      .update(userPasswordTokens)
      .set({ usedAt: new Date() })
      .where(eq(userPasswordTokens.id, row.id));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[auth] reset-password error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

