import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { embryos, ivfCycles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const patchEmbryoSchema = z.object({
  fertilizationEventId: z.string().uuid().optional().nullable(),
  day: z.string().max(16).optional().nullable(),
  dayCreated: z.number().int().min(0).optional().nullable(),
  grade: z.string().max(64).optional().nullable(),
  gradeDetail: z.string().max(64).optional().nullable(),
  status: z.string().max(32).optional(),
  source: z.enum(["fresh", "frozen", "donor"]).optional(),
  disposition: z.enum(["culture", "transferred", "frozen", "discarded", "biopsied"]).optional(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cycleId: string; embryoId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cycleId, embryoId } = await params;

  const [cycle] = await db
    .select({ id: ivfCycles.id })
    .from(ivfCycles)
    .where(
      and(
        eq(ivfCycles.id, cycleId),
        eq(ivfCycles.tenantId, session.user.tenantId)
      )
    )
    .limit(1);
  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  const [embryo] = await db
    .select()
    .from(embryos)
    .where(
      and(
        eq(embryos.id, embryoId),
        eq(embryos.cycleId, cycleId),
        eq(embryos.tenantId, session.user.tenantId)
      )
    )
    .limit(1);
  if (!embryo) {
    return NextResponse.json({ error: "Embryo not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchEmbryoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (data.fertilizationEventId !== undefined) update.fertilizationEventId = data.fertilizationEventId;
  if (data.day !== undefined) update.day = data.day?.trim() || null;
  if (data.dayCreated !== undefined) update.dayCreated = data.dayCreated;
  if (data.grade !== undefined) update.grade = data.grade?.trim() || null;
  if (data.gradeDetail !== undefined) update.gradeDetail = data.gradeDetail?.trim() || null;
  if (data.status !== undefined) update.status = (data.status?.trim() || "fresh").toLowerCase();
  if (data.source !== undefined) update.source = data.source;
  if (data.disposition !== undefined) update.disposition = data.disposition;
  if (data.notes !== undefined) update.notes = data.notes?.trim() || null;

  const [updated] = await db
    .update(embryos)
    .set(update as typeof embryos.$inferInsert)
    .where(eq(embryos.id, embryoId))
    .returning();

  return NextResponse.json(updated);
}
