import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { ivfCycles, fertilizationEvents } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const createFertSchema = z.object({
  opuId: z.string().uuid().optional().nullable(),
  fertilizationType: z.enum(["ivf", "icsi", "half_icsi"]).optional(),
  oocytesInseminated: z.number().int().min(0).optional().nullable(),
  oocytesFertilized: z.number().int().min(0).optional().nullable(),
  zygotesNormal: z.number().int().min(0).optional().nullable(),
  zygotesAbnormal: z.number().int().min(0).optional().nullable(),
  performedAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateFertSchema = createFertSchema.partial();

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
    .from(fertilizationEvents)
    .where(
      and(
        eq(fertilizationEvents.cycleId, cycleId),
        eq(fertilizationEvents.tenantId, session.user.tenantId)
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

  const parsed = createFertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [created] = await db
    .insert(fertilizationEvents)
    .values({
      tenantId: session.user.tenantId,
      cycleId,
      opuId: data.opuId ?? null,
      fertilizationType: (data.fertilizationType ?? "icsi").toLowerCase(),
      oocytesInseminated: data.oocytesInseminated ?? null,
      oocytesFertilized: data.oocytesFertilized ?? null,
      zygotesNormal: data.zygotesNormal ?? null,
      zygotesAbnormal: data.zygotesAbnormal ?? null,
      performedAt: data.performedAt ? new Date(data.performedAt) : null,
      performedById: session.user.id,
      notes: data.notes?.trim() || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
