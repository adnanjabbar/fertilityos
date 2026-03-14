import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  quantity: z.union([z.number(), z.string()]).optional().transform((v) => (v !== undefined ? String(v) : undefined)),
  unit: z.string().max(32).optional(),
  reorderLevel: z.union([z.number(), z.string()]).optional().transform((v) => (v !== undefined ? String(v) : undefined)),
  notes: z.string().optional().nullable(),
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

  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(
      and(
        eq(inventoryItems.id, id),
        eq(inventoryItems.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
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

  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updateValues: Partial<typeof inventoryItems.$inferInsert> = { updatedAt: new Date() };
  if (data.name !== undefined) updateValues.name = data.name.trim();
  if (data.quantity !== undefined) updateValues.quantity = data.quantity;
  if (data.unit !== undefined) updateValues.unit = data.unit.trim();
  if (data.reorderLevel !== undefined) updateValues.reorderLevel = data.reorderLevel;
  if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null;

  const [updated] = await db
    .update(inventoryItems)
    .set(updateValues)
    .where(
      and(
        eq(inventoryItems.id, id),
        eq(inventoryItems.tenantId, session.user.tenantId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
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
    .delete(inventoryItems)
    .where(
      and(
        eq(inventoryItems.id, id),
        eq(inventoryItems.tenantId, session.user.tenantId)
      )
    )
    .returning({ id: inventoryItems.id });

  if (!deleted) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
