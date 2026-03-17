import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { cryoStraws, embryos, ivfCycles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const createCryoStrawSchema = z.object({
  embryoId: z.string().uuid(),
  strawLabel: z.string().max(128).optional().nullable(),
  storageLocation: z.string().max(255).optional().nullable(),
  frozenAt: z.string().min(1),
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
    .from(cryoStraws)
    .where(
      and(
        eq(cryoStraws.cycleId, cycleId),
        eq(cryoStraws.tenantId, session.user.tenantId)
      )
    );

  return NextResponse.json(list);
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createCryoStrawSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [created] = await db
    .insert(cryoStraws)
    .values({
      tenantId: session.user.tenantId,
      cycleId,
      embryoId: data.embryoId,
      strawLabel: data.strawLabel?.trim() || null,
      storageLocation: data.storageLocation?.trim() || null,
      frozenAt: new Date(data.frozenAt),
      notes: data.notes?.trim() || null,
    })
    .returning();

  await db
    .update(embryos)
    .set({ disposition: "frozen", updatedAt: new Date() })
    .where(
      and(
        eq(embryos.id, data.embryoId),
        eq(embryos.cycleId, cycleId),
        eq(embryos.tenantId, session.user.tenantId)
      )
    );

  return NextResponse.json(created, { status: 201 });
}
