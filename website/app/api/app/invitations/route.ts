import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { invitations, users } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";

const createSchema = z.object({
  email: z.string().email(),
  roleSlug: z.enum([
    "admin",
    "doctor",
    "nurse",
    "embryologist",
    "lab_tech",
    "reception",
    "radiologist",
    "staff",
  ]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const list = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      roleSlug: invitations.roleSlug,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.tenantId, session.user.tenantId),
        isNull(invitations.acceptedAt)
      )
    )
    .orderBy(desc(invitations.createdAt));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { roleSlug } = parsed.data;

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(eq(users.tenantId, session.user.tenantId), eq(users.email, email))
    )
    .limit(1);

  if (existingUser) {
    return NextResponse.json(
      { error: "A user with this email already exists in your clinic." },
      { status: 409 }
    );
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [inv] = await db
    .insert(invitations)
    .values({
      tenantId: session.user.tenantId,
      email,
      roleSlug,
      token,
      expiresAt,
      invitedById: session.user.id,
    })
    .returning({
      id: invitations.id,
      email: invitations.email,
      roleSlug: invitations.roleSlug,
      expiresAt: invitations.expiresAt,
    });

  if (!inv) {
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000";
  const inviteLink = `${baseUrl}/invite/${token}`;

  return NextResponse.json({
    id: inv.id,
    email: inv.email,
    roleSlug: inv.roleSlug,
    expiresAt: inv.expiresAt,
    inviteLink,
    message:
      "Invitation created. Share the link with the invitee (you can add email sending later).",
  });
}
