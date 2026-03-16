import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { labOrders, labOrderItems, labTests, patients } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";

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
      approvedBy: labOrders.approvedBy,
      approvedAt: labOrders.approvedAt,
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
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt,
  };

  const items = await db
    .select({
      id: labOrderItems.id,
      testId: labOrderItems.testId,
      testCode: labTests.code,
      testName: labTests.name,
      status: labOrderItems.status,
      resultValue: labOrderItems.resultValue,
      resultUnit: labOrderItems.resultUnit,
      referenceRange: labOrderItems.referenceRange,
      resultAt: labOrderItems.resultAt,
    })
    .from(labOrderItems)
    .innerJoin(labTests, eq(labOrderItems.testId, labTests.id))
    .where(
      and(eq(labOrderItems.tenantId, session.user.tenantId), eq(labOrderItems.orderId, id))
    );

  return NextResponse.json({ ...order, items });
}

const updateOrderSchema = z.object({
  status: z.enum([
    "pending",
    "ordered",
    "sample_collected",
    "in_processing",
    "completed",
    "awaiting_final_approval",
    "published",
  ]).optional(),
  action: z.enum(["submit_for_approval", "approve"]).optional(),
});

/**
 * PATCH /api/app/lab/orders/[id]
 * Update order status or approve (pathologist/admin).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const canApprove =
    session.user.roleSlug === "admin" || session.user.roleSlug === "pathologist";

  const [existing] = await db
    .select({ id: labOrders.id, status: labOrders.status })
    .from(labOrders)
    .where(
      and(
        eq(labOrders.tenantId, session.user.tenantId),
        eq(labOrders.id, id),
        isNull(labOrders.connectorId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, action } = parsed.data;

  if (action === "approve") {
    if (!canApprove) {
      return NextResponse.json(
        { error: "Only admin or pathologist can approve reports" },
        { status: 403 }
      );
    }
    await db
      .update(labOrders)
      .set({
        status: "published",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(labOrders.id, id));
    return NextResponse.json({ success: true });
  }

  if (action === "submit_for_approval") {
    await db
      .update(labOrders)
      .set({ status: "awaiting_final_approval", updatedAt: new Date() })
      .where(eq(labOrders.id, id));
    return NextResponse.json({ success: true });
  }

  if (status !== undefined) {
    await db
      .update(labOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(labOrders.id, id));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Provide status or action" }, { status: 400 });
}
