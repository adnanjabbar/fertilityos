import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { embryos, ivfCycles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const createEmbryoSchema = z.object({
  day: z.string().max(16).optional().nullable(),
  grade: z.string().max(64).optional().nullable(),
  status: z.string().max(32).optional(),
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
    .from(embryos)
    .where(
      and(
        eq(embryos.cycleId, cycleId),
        eq(embryos.tenantId, session.user.tenantId)
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

  const parsed = createEmbryoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [created] = await db
    .insert(embryos)
    .values({
      tenantId: session.user.tenantId,
      cycleId,
      day: data.day?.trim() || null,
      grade: data.grade?.trim() || null,
      status: (data.status?.trim() || "fresh").toLowerCase(),
      notes: data.notes?.trim() || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
