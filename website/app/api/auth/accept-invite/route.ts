import { NextResponse } from "next/server";
import { db } from "@/db";
import { invitations, users } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";

const bodySchema = z.object({
  token: z.string().min(1),
  fullName: z.string().min(1, "Full name is required").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().max(64).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { token, fullName, password, phone: rawPhone } = parsed.data;
  const phone = rawPhone?.trim().replace(/\s/g, "") || undefined;

  const [inv] = await db
    .select()
    .from(invitations)
    .where(
      and(eq(invitations.token, token), isNull(invitations.acceptedAt))
    )
    .limit(1);

  if (!inv) {
    return NextResponse.json(
      { error: "Invitation not found or already used." },
      { status: 404 }
    );
  }

  if (new Date() > inv.expiresAt) {
    return NextResponse.json(
      { error: "This invitation has expired." },
      { status: 410 }
    );
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(eq(users.tenantId, inv.tenantId), eq(users.email, inv.email))
    )
    .limit(1);

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    tenantId: inv.tenantId,
    email: inv.email,
    passwordHash,
    fullName: fullName.trim(),
    roleSlug: inv.roleSlug,
    emailVerifiedAt: new Date(),
    ...(phone && { phone, phoneVerifiedAt: new Date() }),
  });

  await db
    .update(invitations)
    .set({ acceptedAt: new Date() })
    .where(eq(invitations.id, inv.id));

  return NextResponse.json({
    success: true,
    message: "Account created. You can now sign in.",
    redirectTo: "/login",
  });
}
