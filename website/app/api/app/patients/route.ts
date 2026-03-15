import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { eq, desc, or, ilike, and } from "drizzle-orm";
import { z } from "zod";
import { logAudit, getClientIp } from "@/lib/audit";
import { generateNextMrNumber } from "@/lib/mr";

const createPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  dateOfBirth: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(64).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(128).optional(),
  state: z.string().max(128).optional(),
  country: z.string().max(2).optional(),
  postalCode: z.string().max(32).optional(),
  gender: z.string().max(32).optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";

  const conditions = [eq(patients.tenantId, session.user.tenantId)];
  if (q.length > 0) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        ilike(patients.firstName, pattern),
        ilike(patients.lastName, pattern),
        ilike(patients.email, pattern)
      )!
    );
  }

  const list = await db
    .select({
      id: patients.id,
      firstName: patients.firstName,
      lastName: patients.lastName,
      dateOfBirth: patients.dateOfBirth,
      email: patients.email,
      phone: patients.phone,
      createdAt: patients.createdAt,
    })
    .from(patients)
    .where(conditions.length > 1 ? and(...conditions) : conditions[0])
    .orderBy(desc(patients.createdAt));

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

  const parsed = createPatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const dateOfBirth = data.dateOfBirth
    ? new Date(data.dateOfBirth)
    : null;

  const mrNumber = await generateNextMrNumber(session.user.tenantId);

  const [created] = await db
    .insert(patients)
    .values({
      tenantId: session.user.tenantId,
      mrNumber,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      dateOfBirth,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      country: data.country?.trim().toUpperCase() || null,
      postalCode: data.postalCode?.trim() || null,
      gender: data.gender?.trim() || null,
      notes: data.notes?.trim() || null,
    })
    .returning({
      id: patients.id,
      mrNumber: patients.mrNumber,
      firstName: patients.firstName,
      lastName: patients.lastName,
      dateOfBirth: patients.dateOfBirth,
      email: patients.email,
      phone: patients.phone,
      createdAt: patients.createdAt,
    });

  await logAudit({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "patient.create",
    entityType: "patient",
    entityId: created.id,
    details: { firstName: created.firstName, lastName: created.lastName },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(created, { status: 201 });
}
