import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  patients,
  prescriptions,
  prescriptionLines,
  medications,
  medicationGroups,
  medicationGroupItems,
  users,
} from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

const lineFromFormularySchema = z.object({
  medicationId: z.string().uuid(),
  quantity: z.string().max(64).optional(),
  durationDays: z.number().int().min(0).optional().nullable(),
  frequency: z.string().max(128).optional().nullable(),
  instructionsOverride: z.string().optional().nullable(),
});

const createPrescriptionSchema = z.object({
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(lineFromFormularySchema).min(1).optional(),
  medicationGroupId: z.string().uuid().optional(),
  quantity: z.string().max(64).optional(),
  durationDays: z.number().int().min(0).optional().nullable(),
  frequency: z.string().max(128).optional().nullable(),
  instructionsOverride: z.string().optional().nullable(),
}).refine(
  (data) =>
    (data.lines && data.lines.length > 0 && !data.medicationGroupId) ||
    (data.medicationGroupId && (!data.lines || data.lines.length === 0)),
  { message: "Provide either lines (formulary) or medicationGroupId (protocol), not both." }
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

  const list = await db
    .select({
      id: prescriptions.id,
      patientId: prescriptions.patientId,
      prescribedById: prescriptions.prescribedById,
      prescribedByName: users.fullName,
      status: prescriptions.status,
      prescriptionNumber: prescriptions.prescriptionNumber,
      startDate: prescriptions.startDate,
      endDate: prescriptions.endDate,
      notes: prescriptions.notes,
      createdAt: prescriptions.createdAt,
      updatedAt: prescriptions.updatedAt,
    })
    .from(prescriptions)
    .innerJoin(users, eq(prescriptions.prescribedById, users.id))
    .where(
      and(
        eq(prescriptions.patientId, patientId),
        eq(prescriptions.tenantId, session.user.tenantId)
      )
    )
    .orderBy(desc(prescriptions.createdAt));

  const listWithLines = await Promise.all(
    list.map(async (row) => {
      const lines = await db
        .select({
          id: prescriptionLines.id,
          prescriptionId: prescriptionLines.prescriptionId,
          medicationId: prescriptionLines.medicationId,
          medicationGroupId: prescriptionLines.medicationGroupId,
          quantity: prescriptionLines.quantity,
          durationDays: prescriptionLines.durationDays,
          frequency: prescriptionLines.frequency,
          instructionsOverride: prescriptionLines.instructionsOverride,
        })
        .from(prescriptionLines)
        .where(eq(prescriptionLines.prescriptionId, row.id));

      const linesWithDetails = await Promise.all(
        lines.map(async (line) => {
          if (line.medicationId) {
            const [med] = await db
              .select({
                brandName: medications.brandName,
                genericName: medications.genericName,
                dosage: medications.dosage,
                form: medications.form,
              })
              .from(medications)
              .where(eq(medications.id, line.medicationId))
              .limit(1);
            return {
              ...line,
              medication: med ?? null,
              groupName: null,
              groupItems: null,
            };
          }
          if (line.medicationGroupId) {
            const [group] = await db
              .select({ name: medicationGroups.name })
              .from(medicationGroups)
              .where(eq(medicationGroups.id, line.medicationGroupId))
              .limit(1);
            const items = await db
              .select({
                brandName: medications.brandName,
                genericName: medications.genericName,
                dosage: medications.dosage,
                form: medications.form,
                quantityPerCycle: medicationGroupItems.quantityPerCycle,
                defaultDurationDays: medicationGroupItems.defaultDurationDays,
                sortOrder: medicationGroupItems.sortOrder,
              })
              .from(medicationGroupItems)
              .innerJoin(medications, eq(medicationGroupItems.medicationId, medications.id))
              .where(eq(medicationGroupItems.medicationGroupId, line.medicationGroupId))
              .orderBy(medicationGroupItems.sortOrder);
            return {
              ...line,
              medication: null,
              groupName: group?.name ?? null,
              groupItems: items,
            };
          }
          return { ...line, medication: null, groupName: null, groupItems: null };
        })
      );

      return { ...row, lines: linesWithDetails };
    })
  );

  return NextResponse.json(listWithLines);
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

  const parsed = createPrescriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const tenantId = session.user.tenantId;

  if (data.medicationGroupId) {
    const [group] = await db
      .select()
      .from(medicationGroups)
      .where(
        and(
          eq(medicationGroups.id, data.medicationGroupId),
          eq(medicationGroups.tenantId, tenantId)
        )
      )
      .limit(1);
    if (!group) {
      return NextResponse.json(
        { error: "Medication group not found or not in formulary" },
        { status: 400 }
      );
    }
  } else if (data.lines) {
    for (const line of data.lines) {
      const [med] = await db
        .select()
        .from(medications)
        .where(
          and(
            eq(medications.id, line.medicationId),
            eq(medications.tenantId, tenantId)
          )
        )
        .limit(1);
      if (!med) {
        return NextResponse.json(
          { error: `Medication ${line.medicationId} not found or not in formulary` },
          { status: 400 }
        );
      }
    }
  }

  const startDate = data.startDate ? new Date(data.startDate) : null;
  const endDate = data.endDate ? new Date(data.endDate) : null;

  const [nextNumRow] = await db
    .select({
      next: sql<number>`(SELECT COALESCE(MAX(CAST(NULLIF(TRIM(prescription_number), '') AS integer)), 0) + 1 FROM prescriptions p WHERE p.tenant_id = ${tenantId})`.as("next"),
    })
    .from(prescriptions)
    .where(eq(prescriptions.tenantId, tenantId))
    .limit(1);

  const nextNumber = String(nextNumRow?.next ?? 1);

  const [prescription] = await db
    .insert(prescriptions)
    .values({
      tenantId,
      patientId,
      prescribedById: session.user.id,
      status: "prescribed",
      prescriptionNumber: nextNumber,
      startDate,
      endDate,
      notes: data.notes?.trim() || null,
    })
    .returning();

  if (!prescription) {
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 });
  }

  if (data.medicationGroupId) {
    await db.insert(prescriptionLines).values({
      prescriptionId: prescription.id,
      medicationGroupId: data.medicationGroupId,
      quantity: data.quantity?.trim() || "1",
      durationDays: data.durationDays ?? null,
      frequency: data.frequency?.trim() || null,
      instructionsOverride: data.instructionsOverride?.trim() || null,
    });
  } else if (data.lines) {
    await db.insert(prescriptionLines).values(
      data.lines.map((line) => ({
        prescriptionId: prescription.id,
        medicationId: line.medicationId,
        quantity: line.quantity?.trim() || "1",
        durationDays: line.durationDays ?? null,
        frequency: line.frequency?.trim() || null,
        instructionsOverride: line.instructionsOverride?.trim() || null,
      }))
    );
  }

  const [created] = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, prescription.id))
    .limit(1);

  return NextResponse.json(created!, { status: 201 });
}
