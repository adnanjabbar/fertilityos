import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { patients, patientDataRequests } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST() {
  const session = await auth();
  if (!session?.user?.patientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [patient] = await db
    .select({ id: patients.id, tenantId: patients.tenantId })
    .from(patients)
    .where(eq(patients.id, session.user.patientId))
    .limit(1);

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const [existing] = await db
    .select({ id: patientDataRequests.id })
    .from(patientDataRequests)
    .where(
      and(
        eq(patientDataRequests.patientId, patient.id),
        eq(patientDataRequests.type, "delete"),
        eq(patientDataRequests.status, "pending")
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { message: "You already have a pending account deletion request. The clinic will process it and contact you if needed." },
      { status: 200 }
    );
  }

  await db.insert(patientDataRequests).values({
    tenantId: patient.tenantId,
    patientId: patient.id,
    type: "delete",
    status: "pending",
  });

  return NextResponse.json({
    success: true,
    message: "Your request has been recorded. The clinic will process it and contact you if needed.",
  });
}
