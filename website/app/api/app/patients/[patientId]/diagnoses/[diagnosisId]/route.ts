import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { icd11Entities, patientDiagnoses, patients, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const CUSTOM_DIAGNOSIS_ALLOWED_ROLES = ["admin", "doctor", "nurse"] as const;

const updateDiagnosisSchema = z.object({
  icd11Code: z.string().max(32).optional().nullable(),
  customDiagnosis: z.string().max(2000).optional().nullable(),
}).refine(
  (data) => {
    if (data.icd11Code !== undefined || data.customDiagnosis !== undefined) return true;
    return false;
  },
  { message: "Provide icd11Code or customDiagnosis to update" }
);

async function getDiagnosisWithDetail(
  diagnosisId: string,
  tenantId: string,
  patientId: string
) {
  const [row] = await db
    .select({
      id: patientDiagnoses.id,
      tenantId: patientDiagnoses.tenantId,
      patientId: patientDiagnoses.patientId,
      icd11Code: patientDiagnoses.icd11Code,
      customDiagnosis: patientDiagnoses.customDiagnosis,
      recordedById: patientDiagnoses.recordedById,
      recordedAt: patientDiagnoses.recordedAt,
      roleSlugAtRecord: patientDiagnoses.roleSlugAtRecord,
      createdAt: patientDiagnoses.createdAt,
      updatedAt: patientDiagnoses.updatedAt,
      recordedByName: users.fullName,
      icd11Title: icd11Entities.title,
      icd11Description: icd11Entities.description,
      icd11ParentCode: icd11Entities.parentCode,
      icd11ChapterCode: icd11Entities.chapterCode,
      icd11ChapterTitle: icd11Entities.chapterTitle,
      icd11SectionCode: icd11Entities.sectionCode,
      icd11SectionTitle: icd11Entities.sectionTitle,
    })
    .from(patientDiagnoses)
    .innerJoin(users, eq(patientDiagnoses.recordedById, users.id))
    .leftJoin(
      icd11Entities,
      eq(patientDiagnoses.icd11Code, icd11Entities.code)
    )
    .where(
      and(
        eq(patientDiagnoses.id, diagnosisId),
        eq(patientDiagnoses.tenantId, tenantId),
        eq(patientDiagnoses.patientId, patientId)
      )
    )
    .limit(1);

  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenantId,
    patientId: row.patientId,
    icd11Code: row.icd11Code,
    customDiagnosis: row.customDiagnosis,
    recordedById: row.recordedById,
    recordedAt: row.recordedAt,
    roleSlugAtRecord: row.roleSlugAtRecord,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    recordedByName: row.recordedByName,
    icd11: row.icd11Code
      ? {
          code: row.icd11Code,
          title: row.icd11Title,
          description: row.icd11Description,
          parentCode: row.icd11ParentCode,
          chapterCode: row.icd11ChapterCode,
          chapterTitle: row.icd11ChapterTitle,
          sectionCode: row.icd11SectionCode,
          sectionTitle: row.icd11SectionTitle,
        }
      : null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ patientId: string; diagnosisId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { patientId, diagnosisId } = await params;

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

  const row = await getDiagnosisWithDetail(
    diagnosisId,
    session.user.tenantId,
    patientId
  );
  if (!row) {
    return NextResponse.json({ error: "Diagnosis not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ patientId: string; diagnosisId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { patientId, diagnosisId } = await params;

  const [existing] = await db
    .select()
    .from(patientDiagnoses)
    .where(
      and(
        eq(patientDiagnoses.id, diagnosisId),
        eq(patientDiagnoses.tenantId, session.user.tenantId),
        eq(patientDiagnoses.patientId, patientId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Diagnosis not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateDiagnosisSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const newCustom = data.customDiagnosis !== undefined ? (data.customDiagnosis?.trim() || null) : undefined;
  const newIcd11 = data.icd11Code !== undefined ? (data.icd11Code?.trim() || null) : undefined;

  if (newCustom !== undefined && newCustom !== null && newCustom.length > 0) {
    const allowed = CUSTOM_DIAGNOSIS_ALLOWED_ROLES.includes(
      session.user.roleSlug as (typeof CUSTOM_DIAGNOSIS_ALLOWED_ROLES)[number]
    );
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Your role is not permitted to add or edit custom diagnoses.",
        },
        { status: 403 }
      );
    }
  }

  if (newIcd11 !== undefined && newIcd11) {
    const [codeExists] = await db
      .select({ code: icd11Entities.code })
      .from(icd11Entities)
      .where(eq(icd11Entities.code, newIcd11))
      .limit(1);
    if (!codeExists) {
      return NextResponse.json(
        { error: "ICD-11 code not found in reference data" },
        { status: 400 }
      );
    }
  }

  const updateValues: Partial<typeof patientDiagnoses.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.icd11Code !== undefined) updateValues.icd11Code = newIcd11 ?? null;
  if (data.customDiagnosis !== undefined) updateValues.customDiagnosis = newCustom ?? null;

  const [updated] = await db
    .update(patientDiagnoses)
    .set(updateValues)
    .where(
      and(
        eq(patientDiagnoses.id, diagnosisId),
        eq(patientDiagnoses.tenantId, session.user.tenantId),
        eq(patientDiagnoses.patientId, patientId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Diagnosis not found" }, { status: 404 });
  }

  const row = await getDiagnosisWithDetail(
    diagnosisId,
    session.user.tenantId,
    patientId
  );
  return NextResponse.json(row ?? updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ patientId: string; diagnosisId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { patientId, diagnosisId } = await params;

  const [deleted] = await db
    .delete(patientDiagnoses)
    .where(
      and(
        eq(patientDiagnoses.id, diagnosisId),
        eq(patientDiagnoses.tenantId, session.user.tenantId),
        eq(patientDiagnoses.patientId, patientId)
      )
    )
    .returning({ id: patientDiagnoses.id });

  if (!deleted) {
    return NextResponse.json({ error: "Diagnosis not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
