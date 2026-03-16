import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { labOrders, labOrderItems, labTests, patients } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

/**
 * GET /api/app/lab/reports
 * List lab orders awaiting final approval (pathologist/admin dashboard).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin" && session.user.roleSlug !== "pathologist") {
    return NextResponse.json(
      { error: "Only admin or pathologist can view reports to approve" },
      { status: 403 }
    );
  }

  const orders = await db
    .select({
      id: labOrders.id,
      patientId: labOrders.patientId,
      firstName: patients.firstName,
      lastName: patients.lastName,
      status: labOrders.status,
      requestedAt: labOrders.requestedAt,
      resultAt: labOrders.resultAt,
    })
    .from(labOrders)
    .innerJoin(patients, eq(labOrders.patientId, patients.id))
    .where(
      and(
        eq(labOrders.tenantId, session.user.tenantId),
        eq(labOrders.status, "awaiting_final_approval"),
        isNull(labOrders.connectorId)
      )
    )
    .orderBy(desc(labOrders.updatedAt));

  const list = orders.map((row) => ({
    id: row.id,
    patientId: row.patientId,
    patientName: [row.firstName, row.lastName].filter(Boolean).join(" ") || null,
    status: row.status,
    requestedAt: row.requestedAt,
    resultAt: row.resultAt,
  }));

  return NextResponse.json(list);
}
