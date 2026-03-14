import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { referralCodes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, "Code can only contain letters, numbers, hyphens, and underscores"),
  note: z.string().max(500).optional(),
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
      id: referralCodes.id,
      code: referralCodes.code,
      note: referralCodes.note,
      usedCount: referralCodes.usedCount,
      createdAt: referralCodes.createdAt,
    })
    .from(referralCodes)
    .where(eq(referralCodes.tenantId, session.user.tenantId))
    .orderBy(desc(referralCodes.createdAt));

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

  const code = parsed.data.code.trim().toUpperCase();
  const note = parsed.data.note?.trim() ?? null;

  const [existing] = await db
    .select({ id: referralCodes.id })
    .from(referralCodes)
    .where(
      and(
        eq(referralCodes.tenantId, session.user.tenantId),
        eq(referralCodes.code, code)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "A referral code with this value already exists for your clinic." },
      { status: 409 }
    );
  }

  const [created] = await db
    .insert(referralCodes)
    .values({
      tenantId: session.user.tenantId,
      code,
      createdById: session.user.id,
      note,
    })
    .returning({
      id: referralCodes.id,
      code: referralCodes.code,
      note: referralCodes.note,
      usedCount: referralCodes.usedCount,
      createdAt: referralCodes.createdAt,
    });

  if (!created) {
    return NextResponse.json(
      { error: "Failed to create referral code" },
      { status: 500 }
    );
  }

  return NextResponse.json(created, { status: 201 });
}
