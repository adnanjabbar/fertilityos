import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { ivfCycles, oocyteRetrievals } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const createOpuSchema = z.object({
  retrievalDate: z.string().optional().nullable(),
  oocytesTotal: z.number().int().min(0).optional().nullable(),
  oocytesMature: z.number().int().min(0).optional().nullable(),
  oocytesImmature: z.number().int().min(0).optional().nullable(),
  oocytesMii: z.number().int().min(0).optional().nullable(),
  oocytesGv: z.number().int().min(0).optional().nullable(),
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
    .from(oocyteRetrievals)
    .where(
      and(
        eq(oocyteRetrievals.cycleId, cycleId),
        eq(oocyteRetrievals.tenantId, session.user.tenantId)
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

  const parsed = createOpuSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [created] = await db
    .insert(oocyteRetrievals)
    .values({
      tenantId: session.user.tenantId,
      cycleId,
      retrievalDate: data.retrievalDate ? new Date(data.retrievalDate) : null,
      performedById: session.user.id,
      oocytesTotal: data.oocytesTotal ?? null,
      oocytesMature: data.oocytesMature ?? null,
      oocytesImmature: data.oocytesImmature ?? null,
      oocytesMii: data.oocytesMii ?? null,
      oocytesGv: data.oocytesGv ?? null,
      notes: data.notes?.trim() || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
