import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { ivfCycles, patients } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";

const createCycleSchema = z.object({
  cycleNumber: z.string().min(1).max(32),
  cycleType: z.string().max(32).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { patientId } = await params;

  const [patient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(
      and(
        eq(patients.id, patientId),
        eq(patients.tenantId, session.user.tenantId)
      )
    )
    .limit(1);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const list = await db
    .select()
    .from(ivfCycles)
    .where(
      and(
        eq(ivfCycles.patientId, patientId),
        eq(ivfCycles.tenantId, session.user.tenantId)
      )
    )
    .orderBy(desc(ivfCycles.startDate));

  return NextResponse.json(list);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { patientId } = await params;

  const [patient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(
      and(
        eq(patients.id, patientId),
        eq(patients.tenantId, session.user.tenantId)
      )
    )
    .limit(1);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createCycleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const startDate = data.startDate ? new Date(data.startDate) : null;
  const endDate = data.endDate ? new Date(data.endDate) : null;

  const [created] = await db
    .insert(ivfCycles)
    .values({
      tenantId: session.user.tenantId,
      patientId,
      cycleNumber: data.cycleNumber.trim(),
      cycleType: (data.cycleType?.trim() || "fresh").toLowerCase(),
      status: "planned",
      startDate,
      endDate,
      notes: data.notes?.trim() || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
