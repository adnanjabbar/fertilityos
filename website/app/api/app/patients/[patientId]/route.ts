import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit, getClientIp } from "@/lib/audit";

const NATIONAL_ID_TYPES = ["national_id", "ssn", "citizen_id", "other"] as const;

const updatePatientSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  dateOfBirth: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().max(64).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(128).optional().nullable(),
  state: z.string().max(128).optional().nullable(),
  country: z.string().max(128).optional().nullable(),
  postalCode: z.string().max(32).optional().nullable(),
  gender: z.string().max(32).optional().nullable(),
  notes: z.string().optional().nullable(),
  nationalIdType: z.enum(NATIONAL_ID_TYPES).optional().nullable(),
  nationalIdValue: z.string().max(255).optional().nullable(),
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
    .select()
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

  return NextResponse.json(patient);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { patientId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updatePatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const dateOfBirth =
    data.dateOfBirth === null || data.dateOfBirth === ""
      ? null
      : data.dateOfBirth
        ? new Date(data.dateOfBirth)
        : undefined;

  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (data.firstName !== undefined) updateValues.firstName = data.firstName.trim();
  if (data.lastName !== undefined) updateValues.lastName = data.lastName.trim();
  if (data.dateOfBirth !== undefined) updateValues.dateOfBirth = dateOfBirth;
  if (data.email !== undefined) updateValues.email = data.email?.trim() || null;
  if (data.phone !== undefined) updateValues.phone = data.phone?.trim() || null;
  if (data.address !== undefined) updateValues.address = data.address?.trim() || null;
  if (data.city !== undefined) updateValues.city = data.city?.trim() || null;
  if (data.state !== undefined) updateValues.state = data.state?.trim() || null;
  if (data.country !== undefined) updateValues.country = data.country?.trim().toUpperCase() || null;
  if (data.postalCode !== undefined) updateValues.postalCode = data.postalCode?.trim() || null;
  if (data.gender !== undefined) updateValues.gender = data.gender?.trim() || null;
  if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null;
  if (data.nationalIdType !== undefined) updateValues.nationalIdType = data.nationalIdType ?? null;
  if (data.nationalIdValue !== undefined) updateValues.nationalIdValue = data.nationalIdValue?.trim() || null;

  const [updated] = await db
    .update(patients)
    .set(updateValues as Partial<typeof patients.$inferInsert>)
    .where(
      and(
        eq(patients.id, patientId),
        eq(patients.tenantId, session.user.tenantId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  await logAudit({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "patient.update",
    entityType: "patient",
    entityId: patientId,
    details: { firstName: updated.firstName, lastName: updated.lastName },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { patientId } = await params;

  const [patient] = await db
    .select({ id: patients.id, firstName: patients.firstName, lastName: patients.lastName })
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

  await db
    .delete(patients)
    .where(
      and(
        eq(patients.id, patientId),
        eq(patients.tenantId, session.user.tenantId)
      )
    );

  await logAudit({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "patient.delete",
    entityType: "patient",
    entityId: patientId,
    details: { firstName: patient.firstName, lastName: patient.lastName },
    ipAddress: getClientIp(_request),
  });

  return NextResponse.json({ success: true });
}
