import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { clinicalNotes, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateNoteSchema = z.object({
  subjective: z.string().optional().nullable(),
  objective: z.string().optional().nullable(),
  assessment: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  diagnosisCode: z.string().max(64).optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;

  const [row] = await db
    .select({
      id: clinicalNotes.id,
      tenantId: clinicalNotes.tenantId,
      patientId: clinicalNotes.patientId,
      authorId: clinicalNotes.authorId,
      authorName: users.fullName,
      noteType: clinicalNotes.noteType,
      subjective: clinicalNotes.subjective,
      objective: clinicalNotes.objective,
      assessment: clinicalNotes.assessment,
      plan: clinicalNotes.plan,
      diagnosisCode: clinicalNotes.diagnosisCode,
      createdAt: clinicalNotes.createdAt,
      updatedAt: clinicalNotes.updatedAt,
    })
    .from(clinicalNotes)
    .innerJoin(users, eq(clinicalNotes.authorId, users.id))
    .where(
      and(
        eq(clinicalNotes.id, noteId),
        eq(clinicalNotes.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updateValues: Partial<typeof clinicalNotes.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.subjective !== undefined) updateValues.subjective = data.subjective?.trim() || null;
  if (data.objective !== undefined) updateValues.objective = data.objective?.trim() || null;
  if (data.assessment !== undefined) updateValues.assessment = data.assessment?.trim() || null;
  if (data.plan !== undefined) updateValues.plan = data.plan?.trim() || null;
  if (data.diagnosisCode !== undefined) updateValues.diagnosisCode = data.diagnosisCode?.trim() || null;

  const [updated] = await db
    .update(clinicalNotes)
    .set(updateValues)
    .where(
      and(
        eq(clinicalNotes.id, noteId),
        eq(clinicalNotes.tenantId, session.user.tenantId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
