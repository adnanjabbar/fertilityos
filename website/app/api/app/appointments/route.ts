import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { appointments, patients } from "@/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { z } from "zod";

const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid().optional().nullable(),
  title: z.string().max(255).optional(),
  startAt: z.string().datetime({ message: "Invalid start date/time" }),
  endAt: z.string().datetime({ message: "Invalid end date/time" }),
  type: z.string().max(64).optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const patientId = url.searchParams.get("patientId")?.trim() || null;

  const conditions = [eq(appointments.tenantId, session.user.tenantId)];
  if (patientId) {
    conditions.push(eq(appointments.patientId, patientId));
  }
  if (fromParam) {
    try {
      const fromDate = new Date(fromParam);
      if (!Number.isNaN(fromDate.getTime())) {
        conditions.push(gte(appointments.startAt, fromDate));
      }
    } catch {
      // ignore invalid from
    }
  }
  if (toParam) {
    try {
      const toDate = new Date(toParam);
      if (!Number.isNaN(toDate.getTime())) {
        conditions.push(lte(appointments.startAt, toDate));
      }
    } catch {
      // ignore invalid to
    }
  }

  const list = await db
    .select({
      id: appointments.id,
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
      createdAt: appointments.createdAt,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(conditions.length > 1 ? and(...conditions) : conditions[0])
    .orderBy(desc(appointments.startAt));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);

  // Ensure patient belongs to tenant
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

  const [created] = await db
    .insert(appointments)
    .values({
      tenantId: session.user.tenantId,
      patientId: data.patientId,
      providerId: data.providerId || null,
      title: data.title?.trim() || null,
      startAt,
      endAt,
      type: (data.type?.trim() || "consultation").toLowerCase(),
      status: "scheduled",
      notes: data.notes?.trim() || null,
    })
    .returning({
      id: appointments.id,
      patientId: appointments.patientId,
      providerId: appointments.providerId,
      title: appointments.title,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      type: appointments.type,
      status: appointments.status,
      notes: appointments.notes,
      createdAt: appointments.createdAt,
    });

  return NextResponse.json(created, { status: 201 });
}
