import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { appointments, patients } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateAppointmentSchema = z.object({
  patientId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional().nullable(),
  title: z.string().max(255).optional().nullable(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  type: z.string().max(64).optional(),
  status: z.string().max(32).optional(),
  notes: z.string().optional().nullable(),
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

  const [row] = await db
    .select({
      id: appointments.id,
      tenantId: appointments.tenantId,
      patientId: appointments.patientId,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      providerId: appointments.providerId,
      title: appointments.title,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      type: appointments.type,
      status: appointments.status,
      notes: appointments.notes,
      reminderSentAt: appointments.reminderSentAt,
      reminderSmsSentAt: appointments.reminderSmsSentAt,
      videoRoomId: appointments.videoRoomId,
      createdAt: appointments.createdAt,
      updatedAt: appointments.updatedAt,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  return NextResponse.json(row);
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (data.patientId) {
    const [patient] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(
        and(
          eq(patients.id, data.patientId),
          eq(patients.tenantId, session.user.tenantId)
        )
      )
      .limit(1);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
  }

  const updateValues: Partial<typeof appointments.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.patientId !== undefined) updateValues.patientId = data.patientId;
  if (data.providerId !== undefined) updateValues.providerId = data.providerId;
  if (data.title !== undefined) updateValues.title = data.title?.trim() || null;
  if (data.startAt !== undefined) updateValues.startAt = new Date(data.startAt);
  if (data.endAt !== undefined) updateValues.endAt = new Date(data.endAt);
  if (data.type !== undefined) updateValues.type = data.type.trim();
  if (data.status !== undefined) updateValues.status = data.status.trim();
  if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null;

  const [updated] = await db
    .update(appointments)
    .set(updateValues)
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.tenantId, session.user.tenantId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
