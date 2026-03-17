import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  embryoTransferEmbryos,
  embryoTransfers,
  embryos,
  ivfCycles,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const patchTransferSchema = z.object({
  transferDate: z.string().min(1).optional(),
  transferType: z.enum(["fresh", "frozen"]).optional(),
  numberEmbryosTransferred: z.number().int().min(0).optional().nullable(),
  numberImplanted: z.number().int().min(0).optional().nullable(),
  performedById: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  embryoIds: z.array(z.string().uuid()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cycleId: string; transferId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cycleId, transferId } = await params;

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

  const [transfer] = await db
    .select()
    .from(embryoTransfers)
    .where(
      and(
        eq(embryoTransfers.id, transferId),
        eq(embryoTransfers.cycleId, cycleId),
        eq(embryoTransfers.tenantId, session.user.tenantId)
      )
    )
    .limit(1);
  if (!transfer) {
    return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchTransferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (data.transferDate !== undefined) update.transferDate = new Date(data.transferDate);
  if (data.transferType !== undefined) update.transferType = data.transferType;
  if (data.numberEmbryosTransferred !== undefined) update.numberEmbryosTransferred = data.numberEmbryosTransferred;
  if (data.numberImplanted !== undefined) update.numberImplanted = data.numberImplanted;
  if (data.performedById !== undefined) update.performedById = data.performedById;
  if (data.notes !== undefined) update.notes = data.notes?.trim() || null;

  if (Object.keys(update).length > 1) {
    await db
      .update(embryoTransfers)
      .set(update as typeof embryoTransfers.$inferInsert)
      .where(eq(embryoTransfers.id, transferId));
  }

  if (data.embryoIds !== undefined) {
    const existingLinks = await db
      .select()
      .from(embryoTransferEmbryos)
      .where(eq(embryoTransferEmbryos.transferId, transferId));
    const existingIds = new Set(existingLinks.map((l) => l.embryoId));
    const newIds = new Set(data.embryoIds);

    const toRemove = existingLinks.filter((l) => !newIds.has(l.embryoId)).map((l) => l.embryoId);
    const toAdd = data.embryoIds.filter((id) => !existingIds.has(id));

    for (const embryoId of toRemove) {
      await db
        .delete(embryoTransferEmbryos)
        .where(
          and(
            eq(embryoTransferEmbryos.transferId, transferId),
            eq(embryoTransferEmbryos.embryoId, embryoId)
          )
        );
      await db
        .update(embryos)
        .set({ disposition: "culture", updatedAt: new Date() })
        .where(
          and(
            eq(embryos.id, embryoId),
            eq(embryos.cycleId, cycleId),
            eq(embryos.tenantId, session.user.tenantId)
          )
        );
    }
    if (toAdd.length > 0) {
      await db.insert(embryoTransferEmbryos).values(
        toAdd.map((embryoId) => ({ transferId, embryoId }))
      );
      for (const embryoId of toAdd) {
        await db
          .update(embryos)
          .set({ disposition: "transferred", updatedAt: new Date() })
          .where(
            and(
              eq(embryos.id, embryoId),
              eq(embryos.cycleId, cycleId),
              eq(embryos.tenantId, session.user.tenantId)
            )
          );
      }
    }
  }

  const [updated] = await db
    .select()
    .from(embryoTransfers)
    .where(eq(embryoTransfers.id, transferId))
    .limit(1);
  const links = await db
    .select({ embryoId: embryoTransferEmbryos.embryoId })
    .from(embryoTransferEmbryos)
    .where(eq(embryoTransferEmbryos.transferId, transferId));
  return NextResponse.json({
    ...updated,
    embryoIds: links.map((l) => l.embryoId),
  });
}
