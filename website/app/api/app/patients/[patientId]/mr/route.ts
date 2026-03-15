import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * GET /api/app/patients/[patientId]/mr
 * Returns MR number and optional barcode payload for the patient.
 */
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
    .select({
      id: patients.id,
      mrNumber: patients.mrNumber,
      firstName: patients.firstName,
      lastName: patients.lastName,
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

  return NextResponse.json({
    mrNumber: patient.mrNumber ?? null,
    barcodePayload: patient.mrNumber ?? null,
    patientName: `${patient.firstName} ${patient.lastName}`.trim(),
  });
}
