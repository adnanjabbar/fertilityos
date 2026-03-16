import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { labOrders, labOrderItems } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";

const itemUpdateSchema = z.object({
  id: z.string().uuid(),
  resultValue: z.string().max(255).optional().nullable(),
  resultUnit: z.string().max(32).optional().nullable(),
  referenceRange: z.string().max(128).optional().nullable(),
  status: z.string().max(32).optional(),
  resultAt: z.union([z.string(), z.date()]).optional().nullable(),
});

const bodySchema = z.object({
  items: z.array(itemUpdateSchema).min(1),
});

/**
 * PATCH /api/app/lab/orders/[id]/items
 * Update result values and status for order line items.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await params;

  const [order] = await db
    .select({ id: labOrders.id })
    .from(labOrders)
    .where(
      and(
        eq(labOrders.tenantId, session.user.tenantId),
        eq(labOrders.id, orderId),
        isNull(labOrders.connectorId)
      )
    )
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  for (const it of parsed.data.items) {
    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
    if (it.resultValue !== undefined) updatePayload.resultValue = it.resultValue;
    if (it.resultUnit !== undefined) updatePayload.resultUnit = it.resultUnit;
    if (it.referenceRange !== undefined) updatePayload.referenceRange = it.referenceRange;
    if (it.status !== undefined) updatePayload.status = it.status;
    if (it.resultAt !== undefined) {
      updatePayload.resultAt = it.resultAt != null ? new Date(it.resultAt as string) : null;
    }
    await db
      .update(labOrderItems)
      .set(updatePayload as Partial<typeof labOrderItems.$inferInsert>)
      .where(
        and(
          eq(labOrderItems.tenantId, session.user.tenantId),
          eq(labOrderItems.orderId, orderId),
          eq(labOrderItems.id, it.id)
        )
      );
  }

  return NextResponse.json({ success: true });
}
