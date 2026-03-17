import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  embryoTransferEmbryos,
  embryoTransfers,
  embryos,
  ivfCycles,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

const createTransferSchema = z.object({
  transferDate: z.string().min(1),
  transferType: z.enum(["fresh", "frozen"]).default("fresh"),
  numberEmbryosTransferred: z.number().int().min(0).optional().nullable(),
  numberImplanted: z.number().int().min(0).optional().nullable(),
  performedById: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  embryoIds: z.array(z.string().uuid()).optional().default([]),
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

  const list = await db
    .select()
    .from(embryoTransfers)
    .where(
      and(
        eq(embryoTransfers.cycleId, cycleId),
        eq(embryoTransfers.tenantId, session.user.tenantId)
      )
    );

  const transferIds = list.map((t) => t.id);
  const allLinks =
    transferIds.length === 0
      ? []
      : await db
          .select()
          .from(embryoTransferEmbryos)
          .where(inArray(embryoTransferEmbryos.transferId, transferIds));
  const byTransfer = transferIds.reduce(
    (acc, id) => {
      acc[id] = allLinks.filter((l) => l.transferId === id).map((l) => l.embryoId);
      return acc;
    },
    {} as Record<string, string[]>
  );

  return NextResponse.json(
    list.map((t) => ({ ...t, embryoIds: byTransfer[t.id] ?? [] }))
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cycleId } = await params;

  const [cycle] = await db
    .select({ id: ivfCycles.id, patientId: ivfCycles.patientId })
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createTransferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [created] = await db
    .insert(embryoTransfers)
    .values({
      tenantId: session.user.tenantId,
      cycleId,
      patientId: cycle.patientId,
      transferDate: new Date(data.transferDate),
      transferType: data.transferType,
      numberEmbryosTransferred: data.numberEmbryosTransferred ?? null,
      numberImplanted: data.numberImplanted ?? null,
      performedById: data.performedById ?? session.user.id ?? null,
      notes: data.notes?.trim() || null,
    })
    .returning();

  if (data.embryoIds.length > 0) {
    await db.insert(embryoTransferEmbryos).values(
      data.embryoIds.map((embryoId) => ({
        transferId: created.id,
        embryoId,
      }))
    );
    for (const embryoId of data.embryoIds) {
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

  const embryoIds = data.embryoIds;
  return NextResponse.json({ ...created, embryoIds }, { status: 201 });
}
