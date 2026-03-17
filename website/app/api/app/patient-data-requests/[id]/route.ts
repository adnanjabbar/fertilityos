import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { patientDataRequests, patients } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { logAudit, getClientIp } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug === "patient") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing request id" }, { status: 400 });
  }

  let body: { status?: string; executeDeletion?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.status !== "completed") {
    return NextResponse.json(
      { error: "Only status: 'completed' is supported" },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({
      requestId: patientDataRequests.id,
      patientId: patientDataRequests.patientId,
      tenantId: patientDataRequests.tenantId,
    })
    .from(patientDataRequests)
    .where(
      and(
        eq(patientDataRequests.id, id),
        eq(patientDataRequests.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "Request not found or already processed" },
      { status: 404 }
    );
  }

  const [updated] = await db
    .update(patientDataRequests)
    .set({
      status: "completed",
      completedAt: new Date(),
      completedByUserId: session.user.id,
    })
    .where(eq(patientDataRequests.id, id))
    .returning({ id: patientDataRequests.id });

  if (!updated) {
    return NextResponse.json(
      { error: "Request not found or already processed" },
      { status: 404 }
    );
  }

  let deleted = false;
  if (body.executeDeletion === true) {
    const [patient] = await db
      .select({ id: patients.id, firstName: patients.firstName, lastName: patients.lastName })
      .from(patients)
      .where(
        and(
          eq(patients.id, existing.patientId),
          eq(patients.tenantId, session.user.tenantId)
        )
      )
      .limit(1);

    if (patient) {
      await db
        .delete(patients)
        .where(
          and(
            eq(patients.id, existing.patientId),
            eq(patients.tenantId, session.user.tenantId)
          )
        );
      await logAudit({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "patient.delete",
        entityType: "patient",
        entityId: existing.patientId,
        details: {
          firstName: patient.firstName,
          lastName: patient.lastName,
          viaDataRequest: true,
          requestId: id,
        },
        ipAddress: getClientIp(request),
      });
      deleted = true;
    }
  }

  return NextResponse.json({
    id: updated.id,
    status: "completed",
    ...(deleted ? { deleted: true, message: "Request completed and patient data deleted." } : {}),
  });
}
