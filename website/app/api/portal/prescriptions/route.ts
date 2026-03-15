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

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.patientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const prescriptionId = searchParams.get("id");

  if (prescriptionId) {
    const [rx] = await db
      .select({
        id: prescriptions.id,
        patientId: prescriptions.patientId,
        status: prescriptions.status,
        prescriptionNumber: prescriptions.prescriptionNumber,
        startDate: prescriptions.startDate,
        endDate: prescriptions.endDate,
        notes: prescriptions.notes,
        createdAt: prescriptions.createdAt,
        prescribedByName: users.fullName,
      })
      .from(prescriptions)
      .innerJoin(users, eq(prescriptions.prescribedById, users.id))
      .where(
        and(
          eq(prescriptions.id, prescriptionId),
          eq(prescriptions.patientId, session.user.patientId)
        )
      )
      .limit(1);

    if (!rx) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    const lines = await db
      .select({
        id: prescriptionLines.id,
        medicationId: prescriptionLines.medicationId,
        medicationGroupId: prescriptionLines.medicationGroupId,
        quantity: prescriptionLines.quantity,
        durationDays: prescriptionLines.durationDays,
        frequency: prescriptionLines.frequency,
        instructionsOverride: prescriptionLines.instructionsOverride,
      })
      .from(prescriptionLines)
      .where(eq(prescriptionLines.prescriptionId, rx.id));

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
            groupName: null as string | null,
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
      ...rx,
      lines: linesWithDetails,
    });
  }

  const list = await db
    .select({
      id: prescriptions.id,
      status: prescriptions.status,
      prescriptionNumber: prescriptions.prescriptionNumber,
      startDate: prescriptions.startDate,
      endDate: prescriptions.endDate,
      notes: prescriptions.notes,
      createdAt: prescriptions.createdAt,
      prescribedByName: users.fullName,
    })
    .from(prescriptions)
    .innerJoin(users, eq(prescriptions.prescribedById, users.id))
    .where(eq(prescriptions.patientId, session.user.patientId))
    .orderBy(desc(prescriptions.createdAt))
    .limit(100);

  return NextResponse.json(list);
}
