import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { icd11Entities, patientDiagnoses, patients, users } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";

const CUSTOM_DIAGNOSIS_ALLOWED_ROLES = ["admin", "doctor", "nurse"] as const;

const createDiagnosisSchema = z.object({
  icd11Code: z.string().max(32).optional().nullable(),
  customDiagnosis: z.string().max(2000).optional().nullable(),
}).refine(
  (data) => (data.icd11Code?.trim() || "").length > 0 || (data.customDiagnosis?.trim() || "").length > 0,
  { message: "Either icd11Code or customDiagnosis must be provided" }
);

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

  const rows = await db
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
        eq(patientDiagnoses.patientId, patientId),
        eq(patientDiagnoses.tenantId, session.user.tenantId)
      )
    )
    .orderBy(desc(patientDiagnoses.recordedAt));

  const list = rows.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    patientId: r.patientId,
    icd11Code: r.icd11Code,
    customDiagnosis: r.customDiagnosis,
    recordedById: r.recordedById,
    recordedAt: r.recordedAt,
    roleSlugAtRecord: r.roleSlugAtRecord,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    recordedByName: r.recordedByName,
    icd11: r.icd11Code
      ? {
          code: r.icd11Code,
          title: r.icd11Title,
          description: r.icd11Description,
          parentCode: r.icd11ParentCode,
          chapterCode: r.icd11ChapterCode,
          chapterTitle: r.icd11ChapterTitle,
          sectionCode: r.icd11SectionCode,
          sectionTitle: r.icd11SectionTitle,
        }
      : null,
  }));

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

  const parsed = createDiagnosisSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
        message: parsed.error.errors.find((e) => e.message)?.message,
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const icd11Code = data.icd11Code?.trim() || null;
  const customDiagnosis = data.customDiagnosis?.trim() || null;

  if (customDiagnosis !== null && customDiagnosis.length > 0) {
    const allowed = CUSTOM_DIAGNOSIS_ALLOWED_ROLES.includes(
      session.user.roleSlug as (typeof CUSTOM_DIAGNOSIS_ALLOWED_ROLES)[number]
    );
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Your role is not permitted to add custom diagnoses. Use ICD-11 search or contact an administrator.",
        },
        { status: 403 }
      );
    }
  }

  if (icd11Code) {
    const [exists] = await db
      .select({ code: icd11Entities.code })
      .from(icd11Entities)
      .where(eq(icd11Entities.code, icd11Code))
      .limit(1);
    if (!exists) {
      return NextResponse.json(
        { error: "ICD-11 code not found in reference data" },
        { status: 400 }
      );
    }
  }

  const roleSlugAtRecord =
    typeof session.user.roleSlug === "string"
      ? session.user.roleSlug
      : null;

  const [created] = await db
    .insert(patientDiagnoses)
    .values({
      tenantId: session.user.tenantId,
      patientId,
      icd11Code,
      customDiagnosis: customDiagnosis || null,
      recordedById: session.user.id,
      roleSlugAtRecord,
    })
    .returning();

  const icd11Row = created?.icd11Code
    ? await db
        .select()
        .from(icd11Entities)
        .where(eq(icd11Entities.code, created.icd11Code))
        .limit(1)
        .then((r) => r[0])
    : null;

  const [recordedBy] = await db
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, created!.recordedById))
    .limit(1);

  return NextResponse.json(
    {
      ...created,
      recordedByName: recordedBy?.fullName ?? null,
      icd11: icd11Row
        ? {
            code: icd11Row.code,
            title: icd11Row.title,
            description: icd11Row.description,
            parentCode: icd11Row.parentCode,
            chapterCode: icd11Row.chapterCode,
            chapterTitle: icd11Row.chapterTitle,
            sectionCode: icd11Row.sectionCode,
            sectionTitle: icd11Row.sectionTitle,
          }
        : null,
    },
    { status: 201 }
  );
}
