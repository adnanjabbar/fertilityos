import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { fertilizationEvents } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateFertSchema = z.object({
  opuId: z.string().uuid().optional().nullable(),
  fertilizationType: z.enum(["ivf", "icsi", "half_icsi"]).optional(),
  oocytesInseminated: z.number().int().min(0).optional().nullable(),
  oocytesFertilized: z.number().int().min(0).optional().nullable(),
  zygotesNormal: z.number().int().min(0).optional().nullable(),
  zygotesAbnormal: z.number().int().min(0).optional().nullable(),
  performedAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cycleId: string; eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cycleId, eventId } = await params;

  const [evt] = await db
    .select()
    .from(fertilizationEvents)
    .where(
      and(
        eq(fertilizationEvents.id, eventId),
        eq(fertilizationEvents.cycleId, cycleId),
        eq(fertilizationEvents.tenantId, session.user.tenantId)
      )
    )
    .limit(1);
  if (!evt) {
    return NextResponse.json({ error: "Fertilization event not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateFertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updateValues: Partial<typeof fertilizationEvents.$inferInsert> = { updatedAt: new Date() };
  if (data.opuId !== undefined) updateValues.opuId = data.opuId;
  if (data.fertilizationType !== undefined) updateValues.fertilizationType = data.fertilizationType;
  if (data.oocytesInseminated !== undefined) updateValues.oocytesInseminated = data.oocytesInseminated;
  if (data.oocytesFertilized !== undefined) updateValues.oocytesFertilized = data.oocytesFertilized;
  if (data.zygotesNormal !== undefined) updateValues.zygotesNormal = data.zygotesNormal;
  if (data.zygotesAbnormal !== undefined) updateValues.zygotesAbnormal = data.zygotesAbnormal;
  if (data.performedAt !== undefined) updateValues.performedAt = data.performedAt ? new Date(data.performedAt) : null;
  if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null;

  const [updated] = await db
    .update(fertilizationEvents)
    .set(updateValues)
    .where(eq(fertilizationEvents.id, eventId))
    .returning();

  return NextResponse.json(updated);
}
