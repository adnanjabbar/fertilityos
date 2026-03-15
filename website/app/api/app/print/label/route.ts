import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { patients, printJobs } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { generateLabel, type LabelType, type PrinterType, type LabelVariant } from "@/lib/labels";

const printLabelSchema = z.object({
  type: z.enum([
    "wrist_band",
    "ivf_lab_barcode",
    "vial_label",
    "sample_bottle",
    "medication_envelope",
  ]),
  patientId: z.string().uuid(),
  variant: z.enum(["with_barcode", "text_only"]).optional().default("with_barcode"),
  printerType: z.enum(["zebra", "brother", "thermal", "pdf"]),
  recordPrintJob: z.boolean().optional().default(true),
  prescriptionInfo: z.string().optional(),
  sampleType: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = printLabelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { type, patientId, variant, printerType, recordPrintJob, prescriptionInfo, sampleType } = parsed.data;

  const [patient] = await db
    .select({
      id: patients.id,
      mrNumber: patients.mrNumber,
      firstName: patients.firstName,
      lastName: patients.lastName,
      dateOfBirth: patients.dateOfBirth,
    })
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

  if (!patient.mrNumber) {
    return NextResponse.json(
      { error: "Patient has no MR number assigned" },
      { status: 400 }
    );
  }

  const labelData = {
    mrNumber: patient.mrNumber,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString() : null,
    prescriptionInfo,
    sampleType,
  };

  const result = generateLabel(
    type as LabelType,
    printerType as PrinterType,
    labelData,
    variant as LabelVariant
  );

  if (recordPrintJob) {
    await db.insert(printJobs).values({
      tenantId: session.user.tenantId,
      type,
      payload: {
        patientId,
        labelType: type,
        printerType,
        variant,
        mrNumber: patient.mrNumber,
      },
      printedById: session.user.id,
    });
  }

  if (result.contentType === "text/html") {
    const headers: Record<string, string> = { "Content-Type": "text/html; charset=utf-8" };
    if (result.filename) headers["Content-Disposition"] = `inline; filename="${result.filename}"`;
    return new NextResponse(result.body, { status: 200, headers });
  }

  if (result.contentType === "application/zpl") {
    const headers: Record<string, string> = { "Content-Type": "application/zpl; charset=utf-8" };
    if (result.filename) headers["Content-Disposition"] = `attachment; filename="${result.filename}"`;
    return new NextResponse(result.body, { status: 200, headers });
  }

  const headers: Record<string, string> = { "Content-Type": "text/plain; charset=utf-8" };
  if (result.filename) headers["Content-Disposition"] = `attachment; filename="${result.filename}"`;
  return new NextResponse(result.body, { status: 200, headers });
}
