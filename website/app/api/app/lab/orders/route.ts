import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { labOrders, labOrderItems, labTests, patients } from "@/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  patientId: z.string().uuid(),
  testIds: z.array(z.string().uuid()).min(1),
});

/**
 * GET /api/app/lab/orders
 * List native lab orders (connector_id is null) for the tenant.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: labOrders.id,
      patientId: labOrders.patientId,
      firstName: patients.firstName,
      lastName: patients.lastName,
      status: labOrders.status,
      requestedAt: labOrders.requestedAt,
      resultAt: labOrders.resultAt,
      createdAt: labOrders.createdAt,
    })
    .from(labOrders)
    .innerJoin(patients, eq(labOrders.patientId, patients.id))
    .where(
      and(
        eq(labOrders.tenantId, session.user.tenantId),
        isNull(labOrders.connectorId)
      )
    )
    .orderBy(desc(labOrders.createdAt))
    .limit(100);

  const list = rows.map((r) => ({
    id: r.id,
    patientId: r.patientId,
    patientName: [r.firstName, r.lastName].filter(Boolean).join(" ") || null,
    status: r.status,
    requestedAt: r.requestedAt,
    resultAt: r.resultAt,
    createdAt: r.createdAt,
  }));
  return NextResponse.json(list);
}

/**
 * POST /api/app/lab/orders
 * Create a native lab order (patient + tests). Creates lab_orders row and lab_order_items.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  const { patientId, testIds } = parsed.data;

  const [patient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(
      and(eq(patients.tenantId, session.user.tenantId), eq(patients.id, patientId))
    )
    .limit(1);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const testsInTenant = await db
    .select({ id: labTests.id })
    .from(labTests)
    .where(eq(labTests.tenantId, session.user.tenantId));
  const validTestIds = new Set(testsInTenant.map((t) => t.id));
  const invalid = testIds.filter((id) => !validTestIds.has(id));
  if (invalid.length > 0) {
    return NextResponse.json({ error: "One or more tests not found", testIds: invalid }, { status: 400 });
  }

  const [order] = await db
    .insert(labOrders)
    .values({
      tenantId: session.user.tenantId,
      patientId,
      connectorId: null,
      status: "ordered",
      requestedAt: new Date(),
    })
    .returning({ id: labOrders.id });

  if (!order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  await db.insert(labOrderItems).values(
    testIds.map((testId) => ({
      tenantId: session.user.tenantId,
      orderId: order.id,
      testId,
      status: "ordered",
    }))
  );

  return NextResponse.json({ id: order.id }, { status: 201 });
}
