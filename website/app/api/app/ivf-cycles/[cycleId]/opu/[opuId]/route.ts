import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { ivfCycles, oocyteRetrievals } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateOpuSchema = z.object({
  retrievalDate: z.string().optional().nullable(),
  oocytesTotal: z.number().int().min(0).optional().nullable(),
  oocytesMature: z.number().int().min(0).optional().nullable(),
  oocytesImmature: z.number().int().min(0).optional().nullable(),
  oocytesMii: z.number().int().min(0).optional().nullable(),
  oocytesGv: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cycleId: string; opuId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cycleId, opuId } = await params;

  const [opu] = await db
    .select()
    .from(oocyteRetrievals)
    .where(
      and(
        eq(oocyteRetrievals.id, opuId),
        eq(oocyteRetrievals.cycleId, cycleId),
        eq(oocyteRetrievals.tenantId, session.user.tenantId)
      )
    )
    .limit(1);
  if (!opu) {
    return NextResponse.json({ error: "OPU not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateOpuSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updateValues: Partial<typeof oocyteRetrievals.$inferInsert> = { updatedAt: new Date() };
  if (data.retrievalDate !== undefined) updateValues.retrievalDate = data.retrievalDate ? new Date(data.retrievalDate) : null;
  if (data.oocytesTotal !== undefined) updateValues.oocytesTotal = data.oocytesTotal;
  if (data.oocytesMature !== undefined) updateValues.oocytesMature = data.oocytesMature;
  if (data.oocytesImmature !== undefined) updateValues.oocytesImmature = data.oocytesImmature;
  if (data.oocytesMii !== undefined) updateValues.oocytesMii = data.oocytesMii;
  if (data.oocytesGv !== undefined) updateValues.oocytesGv = data.oocytesGv;
  if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null;

  const [updated] = await db
    .update(oocyteRetrievals)
    .set(updateValues)
    .where(eq(oocyteRetrievals.id, opuId))
    .returning();

  return NextResponse.json(updated);
}
