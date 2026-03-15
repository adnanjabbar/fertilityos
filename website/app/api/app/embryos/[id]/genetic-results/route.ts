import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { embryoGeneticResults, embryos } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

const createGeneticResultSchema = z.object({
  testType: z.enum(["PGT-A", "PGT-M", "PGT-SR", "PGT-HLA", "other"]),
  result: z.enum(["euploid", "aneuploid", "mosaic", "inconclusive"]),
  resultDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  labReference: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: embryoId } = await params;

  const [embryo] = await db
    .select({ id: embryos.id })
    .from(embryos)
    .where(
      and(
        eq(embryos.id, embryoId),
        eq(embryos.tenantId, session.user.tenantId)
      )
    )
    .limit(1);
  if (!embryo) {
    return NextResponse.json({ error: "Embryo not found" }, { status: 404 });
  }

  const list = await db
    .select()
    .from(embryoGeneticResults)
    .where(
      and(
        eq(embryoGeneticResults.embryoId, embryoId),
        eq(embryoGeneticResults.tenantId, session.user.tenantId)
      )
    )
    .orderBy(desc(embryoGeneticResults.resultDate));

  return NextResponse.json(list);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: embryoId } = await params;

  const [embryo] = await db
    .select({ id: embryos.id })
    .from(embryos)
    .where(
      and(
        eq(embryos.id, embryoId),
        eq(embryos.tenantId, session.user.tenantId)
      )
    )
    .limit(1);
  if (!embryo) {
    return NextResponse.json({ error: "Embryo not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createGeneticResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const resultDate = new Date(data.resultDate);

  const [created] = await db
    .insert(embryoGeneticResults)
    .values({
      tenantId: session.user.tenantId,
      embryoId,
      testType: data.testType,
      result: data.result,
      resultDate,
      labReference: data.labReference?.trim() || null,
      notes: data.notes?.trim() || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
