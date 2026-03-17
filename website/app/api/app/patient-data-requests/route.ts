import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  patientDataRequests,
  patients,
  tenants,
} from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug === "patient") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: patientDataRequests.id,
      patientId: patientDataRequests.patientId,
      type: patientDataRequests.type,
      status: patientDataRequests.status,
      requestedAt: patientDataRequests.requestedAt,
      completedAt: patientDataRequests.completedAt,
      completedByUserId: patientDataRequests.completedByUserId,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      patientEmail: patients.email,
      tenantName: tenants.name,
    })
    .from(patientDataRequests)
    .innerJoin(patients, eq(patientDataRequests.patientId, patients.id))
    .leftJoin(tenants, eq(patientDataRequests.tenantId, tenants.id))
    .where(
      and(
        eq(patientDataRequests.tenantId, session.user.tenantId),
        eq(patientDataRequests.type, "delete"),
        eq(patientDataRequests.status, "pending")
      )
    )
    .orderBy(desc(patientDataRequests.requestedAt));

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      patientId: r.patientId,
      type: r.type,
      status: r.status,
      requestedAt: r.requestedAt,
      completedAt: r.completedAt,
      completedByUserId: r.completedByUserId,
      patient: {
        id: r.patientId,
        firstName: r.patientFirstName,
        lastName: r.patientLastName,
        email: r.patientEmail ?? null,
      },
      tenantName: r.tenantName ?? null,
    }))
  );
}
