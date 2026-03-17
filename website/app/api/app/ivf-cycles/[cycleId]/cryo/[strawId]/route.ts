import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { cryoStraws, embryos, ivfCycles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const patchCryoStrawSchema = z.object({
  strawLabel: z.string().max(128).optional().nullable(),
  storageLocation: z.string().max(255).optional().nullable(),
  frozenAt: z.string().min(1).optional(),
  thawedAt: z.string().nullable().optional(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cycleId: string; strawId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cycleId, strawId } = await params;

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

  const [straw] = await db
    .select()
    .from(cryoStraws)
    .where(
      and(
        eq(cryoStraws.id, strawId),
        eq(cryoStraws.cycleId, cycleId),
        eq(cryoStraws.tenantId, session.user.tenantId)
      )
    )
    .limit(1);
  if (!straw) {
    return NextResponse.json({ error: "Cryo straw not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchCryoStrawSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (data.strawLabel !== undefined) update.strawLabel = data.strawLabel?.trim() || null;
  if (data.storageLocation !== undefined) update.storageLocation = data.storageLocation?.trim() || null;
  if (data.frozenAt !== undefined) update.frozenAt = new Date(data.frozenAt);
  if (data.thawedAt !== undefined) update.thawedAt = data.thawedAt === null || data.thawedAt === "" ? null : new Date(data.thawedAt);
  if (data.notes !== undefined) update.notes = data.notes?.trim() || null;

  if (data.thawedAt !== undefined && data.thawedAt !== null && data.thawedAt !== "") {
    await db
      .update(embryos)
      .set({ disposition: "culture", updatedAt: new Date() })
      .where(
        and(
          eq(embryos.id, straw.embryoId),
          eq(embryos.tenantId, session.user.tenantId)
        )
      );
  }

  const [updated] = await db
    .update(cryoStraws)
    .set(update as typeof cryoStraws.$inferInsert)
    .where(eq(cryoStraws.id, strawId))
    .returning();

  return NextResponse.json(updated);
}
