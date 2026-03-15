import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { medicationGroups } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateGroupSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [group] = await db
    .select()
    .from(medicationGroups)
    .where(
      and(
        eq(medicationGroups.id, id),
        eq(medicationGroups.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!group) {
    return NextResponse.json({ error: "Medication group not found" }, { status: 404 });
  }

  return NextResponse.json(group);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updateValues: Partial<typeof medicationGroups.$inferInsert> = { updatedAt: new Date() };
  if (data.name !== undefined) updateValues.name = data.name.trim();
  if (data.description !== undefined) updateValues.description = data.description?.trim() || null;

  const [updated] = await db
    .update(medicationGroups)
    .set(updateValues)
    .where(
      and(
        eq(medicationGroups.id, id),
        eq(medicationGroups.tenantId, session.user.tenantId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Medication group not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(medicationGroups)
    .where(
      and(
        eq(medicationGroups.id, id),
        eq(medicationGroups.tenantId, session.user.tenantId)
      )
    )
    .returning({ id: medicationGroups.id });

  if (!deleted) {
    return NextResponse.json({ error: "Medication group not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
