import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { users, userPasswordTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail, staffPasswordResetContent } from "@/lib/email";
import { rateLimitAuth } from "@/lib/rate-limit";

const RESET_TOKEN_EXPIRY_HOURS = 1;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const { allowed } = rateLimitAuth(`${ip}:${email}`);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    // Do not enumerate accounts: always return the same message.
    const [user] = await db
      .select({
        id: users.id,
        tenantId: users.tenantId,
        email: users.email,
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      await db.insert(userPasswordTokens).values({
        tenantId: user.tenantId,
        userId: user.id,
        token,
        type: "reset",
        expiresAt,
      });

      const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
      const origin = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
      const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

      const { subject, html, text } = staffPasswordResetContent({
        resetUrl,
        staffName: user.fullName ?? undefined,
      });

      await sendEmail({
        to: user.email,
        subject,
        html,
        text,
      });
    }

    return NextResponse.json({
      message: "If an account exists for this email, we sent you a password reset link.",
    });
  } catch (e) {
    console.error("[auth] forgot-password error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

