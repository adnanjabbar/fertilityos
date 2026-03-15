import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  prescriptions,
  prescriptionLines,
  medications,
  medicationGroups,
  medicationGroupItems,
  users,
  patients,
  tenantBranding,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import QRCode from "qrcode";
import PrintPrescriptionView from "./PrintPrescriptionView";

export default async function PrescriptionPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

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

  if (!prescription) redirect("/app/patients");

  const [patient] = await db
    .select({
      firstName: patients.firstName,
      lastName: patients.lastName,
      dateOfBirth: patients.dateOfBirth,
    })
    .from(patients)
    .where(eq(patients.id, prescription.patientId))
    .limit(1);

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
    .where(eq(prescriptionLines.prescriptionId, id));

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
          groupItems: null as Array<{
            brandName: string;
            genericName: string;
            dosage: string;
            form: string;
            quantityPerCycle: string | null;
            defaultDurationDays: number | null;
          }> | null,
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
      return {
        ...line,
        medication: null,
        groupName: null,
        groupItems: null,
      };
    })
  );

  const [branding] = await db
    .select()
    .from(tenantBranding)
    .where(eq(tenantBranding.tenantId, prescription.tenantId))
    .limit(1);

  const baseUrl =
    process.env.NEXTAUTH_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";
  const origin = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  const verifyUrl = `${origin}/portal/verify?p=${encodeURIComponent(prescription.id)}`;

  let qrDataUrl: string;
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 140, margin: 1 });
  } catch {
    qrDataUrl = "";
  }

  const marginTopMm = branding?.marginTopMm ?? 20;
  const marginBottomMm = branding?.marginBottomMm ?? 20;
  const marginLeftMm = branding?.marginLeftMm ?? 20;
  const marginRightMm = branding?.marginRightMm ?? 20;

  return (
    <PrintPrescriptionView
      prescription={{
        id: prescription.id,
        patientId: prescription.patientId,
        prescriptionNumber: prescription.prescriptionNumber,
        status: prescription.status,
        startDate: prescription.startDate,
        endDate: prescription.endDate,
        notes: prescription.notes,
        prescribedByName: prescription.prescribedByName ?? "",
        createdAt: prescription.createdAt,
        lines: linesWithDetails,
      }}
      patient={{
        firstName: patient?.firstName ?? "",
        lastName: patient?.lastName ?? "",
        dateOfBirth: patient?.dateOfBirth ?? null,
      }}
      branding={{
        logoUrl: branding?.logoUrl ?? null,
        letterheadImageUrl: branding?.letterheadImageUrl ?? null,
        footerAddress: branding?.footerAddress ?? null,
        footerPhone: branding?.footerPhone ?? null,
        footerEmail: branding?.footerEmail ?? null,
        footerWebsite: branding?.footerWebsite ?? null,
        footerText: branding?.footerText ?? null,
        marginTopMm,
        marginBottomMm,
        marginLeftMm,
        marginRightMm,
      }}
      verifyUrl={verifyUrl}
      qrDataUrl={qrDataUrl}
    />
  );
}
