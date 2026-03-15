import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  prescriptions,
  prescriptionLines,
  medications,
  medicationGroups,
  medicationGroupItems,
  users,
} from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";

const PRESCRIPTION_STATUSES = ["prescribed", "dispensed", "completed", "cancelled"] as const;

const lineFromFormularySchema = z.object({
  medicationId: z.string().uuid(),
  quantity: z.string().max(64).optional(),
  durationDays: z.number().int().min(0).optional().nullable(),
  frequency: z.string().max(128).optional().nullable(),
  instructionsOverride: z.string().optional().nullable(),
});

const updatePrescriptionSchema = z.object({
  status: z.enum(PRESCRIPTION_STATUSES).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(lineFromFormularySchema).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [prescription] = await db
    .select({
      id: prescriptions.id,
      tenantId: prescriptions.tenantId,
      patientId: prescriptions.patientId,
      prescribedById: prescriptions.prescribedById,
      status: prescriptions.status,
      prescriptionNumber: prescriptions.prescriptionNumber,
      startDate: prescriptions.startDate,
      endDate: prescriptions.endDate,
      notes: prescriptions.notes,
      createdAt: prescriptions.createdAt,
      updatedAt: prescriptions.updatedAt,
      prescribedByName: users.fullName,
    })
    .from(prescriptions)
    .innerJoin(users, eq(prescriptions.prescribedById, users.id))
    .where(
      and(
        eq(prescriptions.id, id),
        eq(prescriptions.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!prescription) {
    return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
  }

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
    .where(eq(prescriptionLines.prescriptionId, id));

  const linesWithDetails = await Promise.all(
    lines.map(async (line) => {
      if (line.medicationId) {
        const [med] = await db
          .select()
          .from(medications)
          .where(eq(medications.id, line.medicationId))
          .limit(1);
        return {
          ...line,
          medication: med
            ? {
                brandName: med.brandName,
                genericName: med.genericName,
                dosage: med.dosage,
                form: med.form,
              }
            : null,
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

  return NextResponse.json({
    ...prescription,
    lines: linesWithDetails,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(prescriptions)
    .where(
      and(
        eq(prescriptions.id, id),
        eq(prescriptions.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updatePrescriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const tenantId = session.user.tenantId;

  if (data.lines !== undefined) {
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

  const updateValues: Partial<typeof prescriptions.$inferInsert> = { updatedAt: new Date() };
  if (data.status !== undefined) updateValues.status = data.status;
  if (data.startDate !== undefined)
    updateValues.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined)
    updateValues.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null;

  if (Object.keys(updateValues).length > 1) {
    await db
      .update(prescriptions)
      .set(updateValues)
      .where(
        and(
          eq(prescriptions.id, id),
          eq(prescriptions.tenantId, tenantId)
        )
      );
  }

  if (data.lines !== undefined) {
    await db.delete(prescriptionLines).where(eq(prescriptionLines.prescriptionId, id));
    if (data.lines.length > 0) {
      await db.insert(prescriptionLines).values(
        data.lines.map((line) => ({
          prescriptionId: id,
          medicationId: line.medicationId,
          quantity: line.quantity?.trim() || "1",
          durationDays: line.durationDays ?? null,
          frequency: line.frequency?.trim() || null,
          instructionsOverride: line.instructionsOverride?.trim() || null,
        }))
      );
    }
  }

  const [updated] = await db
    .select()
    .from(prescriptions)
    .where(
      and(
        eq(prescriptions.id, id),
        eq(prescriptions.tenantId, tenantId)
      )
    )
    .limit(1);

  return NextResponse.json(updated!);
}
