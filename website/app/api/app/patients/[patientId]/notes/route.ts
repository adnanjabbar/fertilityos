import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { clinicalNotes, patients, users } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";

const createNoteSchema = z.object({
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  diagnosisCode: z.string().max(64).optional().nullable(),
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
    .select({
      id: clinicalNotes.id,
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
        eq(clinicalNotes.patientId, patientId),
        eq(clinicalNotes.tenantId, session.user.tenantId)
      )
    )
    .orderBy(desc(clinicalNotes.createdAt));

  return NextResponse.json(list);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) {
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

  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [created] = await db
    .insert(clinicalNotes)
    .values({
      tenantId: session.user.tenantId,
      patientId,
      authorId: session.user.id,
      noteType: "soap",
      subjective: data.subjective?.trim() || null,
      objective: data.objective?.trim() || null,
      assessment: data.assessment?.trim() || null,
      plan: data.plan?.trim() || null,
      diagnosisCode: data.diagnosisCode?.trim() || null,
    })
    .returning({
      id: clinicalNotes.id,
      patientId: clinicalNotes.patientId,
      authorId: clinicalNotes.authorId,
      noteType: clinicalNotes.noteType,
      subjective: clinicalNotes.subjective,
      objective: clinicalNotes.objective,
      assessment: clinicalNotes.assessment,
      plan: clinicalNotes.plan,
      diagnosisCode: clinicalNotes.diagnosisCode,
      createdAt: clinicalNotes.createdAt,
      updatedAt: clinicalNotes.updatedAt,
    });

  return NextResponse.json(created, { status: 201 });
}
