import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";

const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  quantity: z.union([z.number(), z.string()]).transform((v) => String(v)),
  unit: z.string().max(32).optional(),
  reorderLevel: z.union([z.number(), z.string()]).optional().transform((v) => (v !== undefined ? String(v) : "0")),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.tenantId, session.user.tenantId))
    .orderBy(desc(inventoryItems.updatedAt));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [created] = await db
    .insert(inventoryItems)
    .values({
      tenantId: session.user.tenantId,
      name: data.name.trim(),
      quantity: data.quantity,
      unit: (data.unit?.trim() || "units").toLowerCase(),
      reorderLevel: data.reorderLevel ?? "0",
      notes: data.notes?.trim() || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
