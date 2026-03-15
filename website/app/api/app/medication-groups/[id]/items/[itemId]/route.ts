import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { medicationGroups, medicationGroupItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateItemSchema = z.object({
  quantityPerCycle: z.string().max(64).optional().nullable(),
  defaultDurationDays: z.number().int().min(0).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId, itemId } = await params;

  const [group] = await db
    .select()
    .from(medicationGroups)
    .where(
      and(
        eq(medicationGroups.id, groupId),
        eq(medicationGroups.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!group) {
    return NextResponse.json({ error: "Medication group not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updateValues: Partial<typeof medicationGroupItems.$inferInsert> = {};
  if (data.quantityPerCycle !== undefined)
    updateValues.quantityPerCycle = data.quantityPerCycle?.trim() || null;
  if (data.defaultDurationDays !== undefined)
    updateValues.defaultDurationDays = data.defaultDurationDays ?? null;
  if (data.sortOrder !== undefined) updateValues.sortOrder = data.sortOrder;

  if (Object.keys(updateValues).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(medicationGroupItems)
    .set(updateValues)
    .where(
      and(
        eq(medicationGroupItems.id, itemId),
        eq(medicationGroupItems.medicationGroupId, groupId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Group item not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId, itemId } = await params;

  const [group] = await db
    .select()
    .from(medicationGroups)
    .where(
      and(
        eq(medicationGroups.id, groupId),
        eq(medicationGroups.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!group) {
    return NextResponse.json({ error: "Medication group not found" }, { status: 404 });
  }

  const [deleted] = await db
    .delete(medicationGroupItems)
    .where(
      and(
        eq(medicationGroupItems.id, itemId),
        eq(medicationGroupItems.medicationGroupId, groupId)
      )
    )
    .returning({ id: medicationGroupItems.id });

  if (!deleted) {
    return NextResponse.json({ error: "Group item not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
