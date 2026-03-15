import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { medicationGroups, medicationGroupItems, medications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const addItemSchema = z.object({
  medicationId: z.string().uuid(),
  quantityPerCycle: z.string().max(64).optional().nullable(),
  defaultDurationDays: z.number().int().min(0).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId } = await params;

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

  const items = await db
    .select({
      id: medicationGroupItems.id,
      medicationGroupId: medicationGroupItems.medicationGroupId,
      medicationId: medicationGroupItems.medicationId,
      quantityPerCycle: medicationGroupItems.quantityPerCycle,
      defaultDurationDays: medicationGroupItems.defaultDurationDays,
      sortOrder: medicationGroupItems.sortOrder,
      brandName: medications.brandName,
      genericName: medications.genericName,
      dosage: medications.dosage,
      form: medications.form,
    })
    .from(medicationGroupItems)
    .innerJoin(medications, eq(medicationGroupItems.medicationId, medications.id))
    .where(eq(medicationGroupItems.medicationGroupId, groupId))
    .orderBy(medicationGroupItems.sortOrder);

  return NextResponse.json(items);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId } = await params;

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

  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Verify medication belongs to same tenant
  const [med] = await db
    .select({ id: medications.id })
    .from(medications)
    .where(
      and(
        eq(medications.id, data.medicationId),
        eq(medications.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!med) {
    return NextResponse.json(
      { error: "Medication not found or not in formulary" },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(medicationGroupItems)
    .values({
      medicationGroupId: groupId,
      medicationId: data.medicationId,
      quantityPerCycle: data.quantityPerCycle?.trim() || null,
      defaultDurationDays: data.defaultDurationDays ?? null,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
