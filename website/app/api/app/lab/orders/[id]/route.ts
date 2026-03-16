import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { labOrders, labOrderItems, labTests, patients } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * GET /api/app/lab/orders/[id]
 * Get one native lab order with items and test names.
 */
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
        eq(labOrders.id, id),
        isNull(labOrders.connectorId)
      )
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const order = {
    id: row.id,
    patientId: row.patientId,
    patientName: [row.firstName, row.lastName].filter(Boolean).join(" ") || null,
    status: row.status,
    requestedAt: row.requestedAt,
    resultAt: row.resultAt,
  };

  const items = await db
    .select({
      id: labOrderItems.id,
      testCode: labTests.code,
      testName: labTests.name,
      status: labOrderItems.status,
      resultValue: labOrderItems.resultValue,
    })
    .from(labOrderItems)
    .innerJoin(labTests, eq(labOrderItems.testId, labTests.id))
    .where(
      and(eq(labOrderItems.tenantId, session.user.tenantId), eq(labOrderItems.orderId, id))
    );

  return NextResponse.json({ ...order, items });
}
