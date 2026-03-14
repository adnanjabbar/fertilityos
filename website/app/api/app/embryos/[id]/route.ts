import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { embryos, ivfCycles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateEmbryoSchema = z.object({
  day: z.string().max(16).optional().nullable(),
  grade: z.string().max(64).optional().nullable(),
  status: z.string().max(32).optional(),
  notes: z.string().optional().nullable(),
});

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

  const parsed = updateEmbryoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [embryoRow] = await db
    .select({ id: embryos.id })
    .from(embryos)
    .innerJoin(ivfCycles, eq(embryos.cycleId, ivfCycles.id))
    .where(
      and(
        eq(embryos.id, id),
        eq(embryos.tenantId, session.user.tenantId)
      )
    )
    .limit(1);
  if (!embryoRow) {
    return NextResponse.json({ error: "Embryo not found" }, { status: 404 });
  }

  const data = parsed.data;
  const updateValues: Partial<typeof embryos.$inferInsert> = { updatedAt: new Date() };
  if (data.day !== undefined) updateValues.day = data.day?.trim() || null;
  if (data.grade !== undefined) updateValues.grade = data.grade?.trim() || null;
  if (data.status !== undefined) updateValues.status = data.status.trim();
  if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null;

  const [updated] = await db
    .update(embryos)
    .set(updateValues)
    .where(
      and(
        eq(embryos.id, id),
        eq(embryos.tenantId, session.user.tenantId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Embryo not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
