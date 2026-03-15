import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { embryoGeneticResults, embryos } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateGeneticResultSchema = z.object({
  testType: z.enum(["PGT-A", "PGT-M", "PGT-SR", "PGT-HLA", "other"]).optional(),
  result: z.enum(["euploid", "aneuploid", "mosaic", "inconclusive"]).optional(),
  resultDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  labReference: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; resultId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: embryoId, resultId } = await params;

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

  const parsed = updateGeneticResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updateValues: Partial<typeof embryoGeneticResults.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.testType !== undefined) updateValues.testType = data.testType;
  if (data.result !== undefined) updateValues.result = data.result;
  if (data.resultDate !== undefined) updateValues.resultDate = new Date(data.resultDate);
  if (data.labReference !== undefined) updateValues.labReference = data.labReference?.trim() || null;
  if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null;

  const [updated] = await db
    .update(embryoGeneticResults)
    .set(updateValues)
    .where(
      and(
        eq(embryoGeneticResults.id, resultId),
        eq(embryoGeneticResults.embryoId, embryoId),
        eq(embryoGeneticResults.tenantId, session.user.tenantId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Genetic result not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
