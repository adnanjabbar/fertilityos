import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.patientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, session.user.patientId))
    .limit(1);

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    email: patient.email,
    phone: patient.phone,
    address: patient.address,
    city: patient.city,
    state: patient.state,
    country: patient.country,
    postalCode: patient.postalCode,
    gender: patient.gender,
  });
}
