import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { eq, desc, or, ilike, and } from "drizzle-orm";
import { z } from "zod";
import { logAudit, getClientIp } from "@/lib/audit";
import { generateNextMrNumber } from "@/lib/mr";

const optionalEmail = z
  .union([z.string().email(), z.literal(""), z.literal(null)])
  .optional()
  .nullable()
  .transform((v) => (v === "" || v === null ? undefined : v));

const optionalString = (maxLen: number) =>
  z
    .union([z.string().max(maxLen), z.literal(""), z.literal(null)])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null ? undefined : v));

const createPatientSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(255)
    .transform((s) => s?.trim())
    .refine((s) => s.length > 0, "First name is required"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(255)
    .transform((s) => s?.trim())
    .refine((s) => s.length > 0, "Last name is required"),
  dateOfBirth: optionalString(32),
  email: optionalEmail,
  phone: optionalString(64),
  address: optionalString(500),
  city: optionalString(128),
  state: optionalString(128),
  country: z
    .union([z.string().max(128), z.literal(""), z.literal(null)])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null ? undefined : v)),
  postalCode: optionalString(32),
  gender: optionalString(32),
  genderIdentity: optionalString(64),
  relationshipStatus: optionalString(32),
  coupleType: optionalString(32),
  spouseFirstName: optionalString(255),
  spouseLastName: optionalString(255),
  spouseDateOfBirth: optionalString(32),
  spouseEmail: optionalEmail,
  spousePhone: optionalString(64),
  notes: optionalString(5000),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    if (list.length > 50) {
      void logAudit({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "patient_list_view",
        entityType: "patient",
        entityId: null,
        details: { count: list.length, query: q || null },
        ipAddress: getClientIp(request),
      }).catch(() => {});
    }

    return NextResponse.json(list);
  } catch (err) {
    console.error("GET /api/app/patients error:", err);
    return NextResponse.json([]);
  }
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

  // Normalize: some clients send null for optional fields; Zod optional() expects undefined
  const raw = body as Record<string, unknown>;
  const normalized =
    raw && typeof raw === "object"
      ? Object.fromEntries(
          Object.entries(raw).map(([k, v]) => [k, v === null ? undefined : v])
        )
      : raw;

  const parsed = createPatientSchema.safeParse(normalized);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const message = Object.entries(fieldErrors)
      .map(([f, errs]) => `${f}: ${(errs || []).join(", ")}`)
      .join("; ");
    return NextResponse.json(
      {
        error: "Validation failed",
        details: fieldErrors,
        message: message || "Validation failed",
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const dateOfBirth = data.dateOfBirth
    ? new Date(data.dateOfBirth)
    : null;

  const mrNumber = await generateNextMrNumber(session.user.tenantId);

  const spouseDateOfBirth = data.spouseDateOfBirth ? new Date(data.spouseDateOfBirth) : null;
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
      country: data.country ? data.country.trim() : null,
      postalCode: data.postalCode?.trim() || null,
      gender: data.gender?.trim() || null,
      genderIdentity: data.genderIdentity?.trim() || null,
      relationshipStatus: data.relationshipStatus?.trim() || null,
      coupleType: data.coupleType?.trim() || null,
      spouseFirstName: data.spouseFirstName?.trim() || null,
      spouseLastName: data.spouseLastName?.trim() || null,
      spouseDateOfBirth,
      spouseEmail: data.spouseEmail?.trim() || null,
      spousePhone: data.spousePhone?.trim() || null,
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
