import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  patients,
  appointments,
  invoices,
  invoiceLines,
  prescriptions,
  prescriptionLines,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(request: Request) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.roleSlug !== "patient" ||
    !session.user.patientId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patientId = session.user.patientId;

  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const tenantId = patient.tenantId;

  const [patientAppointments, patientInvoices] = await Promise.all([
    db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, patientId)),
    db
      .select()
      .from(invoices)
      .where(eq(invoices.patientId, patientId)),
  ]);

  const invoiceIds = patientInvoices.map((i) => i.id);
  const invoiceLineItems =
    invoiceIds.length > 0
      ? await db
          .select()
          .from(invoiceLines)
          .where(inArray(invoiceLines.invoiceId, invoiceIds))
      : [];

  const patientPrescriptions = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.patientId, patientId));

  const prescriptionIds = patientPrescriptions.map((p) => p.id);
  const linesForPatient =
    prescriptionIds.length > 0
      ? await db
          .select()
          .from(prescriptionLines)
          .where(inArray(prescriptionLines.prescriptionId, prescriptionIds))
      : [];

  const { passwordHash: _pw, ...profile } = patient;
  const profileSanitized = profile as Omit<typeof patient, "passwordHash">;

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: profileSanitized,
    appointments: patientAppointments,
    invoices: patientInvoices.map((inv) => ({
      ...inv,
      lineItems: invoiceLineItems.filter((l) => l.invoiceId === inv.id),
    })),
    prescriptions: patientPrescriptions.map((pr) => ({
      ...pr,
      lineItems: linesForPatient.filter((l) => l.prescriptionId === pr.id),
    })),
  };

  try {
    await logAudit({
      tenantId,
      action: "patient.export_data",
      entityType: "patient",
      entityId: patientId,
      details: { patientId, exportRequest: "data_export" },
      ipAddress: getClientIp(request) ?? undefined,
    });
  } catch {
    // non-fatal: continue to return export
  }

  const filename = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
  const json = JSON.stringify(payload, null, 2);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
