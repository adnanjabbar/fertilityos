import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { referralCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  note: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updates: { note?: string | null } = {};
  if (parsed.data.note !== undefined) {
    updates.note = parsed.data.note?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(referralCodes)
    .set(updates)
    .where(
      and(
        eq(referralCodes.id, id),
        eq(referralCodes.tenantId, session.user.tenantId)
      )
    )
    .returning({
      id: referralCodes.id,
      code: referralCodes.code,
      note: referralCodes.note,
      usedCount: referralCodes.usedCount,
      createdAt: referralCodes.createdAt,
    });

  if (!updated) {
    return NextResponse.json(
      { error: "Referral code not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(updated);
}
