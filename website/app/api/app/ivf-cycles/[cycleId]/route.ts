import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { ivfCycles, embryos } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateCycleSchema = z.object({
  cycleNumber: z.string().max(32).optional(),
  cycleType: z.string().max(32).optional(),
  status: z.string().max(32).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cycleId } = await params;

  const [cycle] = await db
    .select()
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

  const embryosList = await db
    .select()
    .from(embryos)
    .where(
      and(
        eq(embryos.cycleId, cycleId),
        eq(embryos.tenantId, session.user.tenantId)
      )
    );

  return NextResponse.json({ ...cycle, embryos: embryosList });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cycleId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateCycleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updateValues: Partial<typeof ivfCycles.$inferInsert> = { updatedAt: new Date() };
  if (data.cycleNumber !== undefined) updateValues.cycleNumber = data.cycleNumber.trim();
  if (data.cycleType !== undefined) updateValues.cycleType = data.cycleType.trim();
  if (data.status !== undefined) updateValues.status = data.status.trim();
  if (data.startDate !== undefined) updateValues.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) updateValues.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null;

  const [updated] = await db
    .update(ivfCycles)
    .set(updateValues)
    .where(
      and(
        eq(ivfCycles.id, cycleId),
        eq(ivfCycles.tenantId, session.user.tenantId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
