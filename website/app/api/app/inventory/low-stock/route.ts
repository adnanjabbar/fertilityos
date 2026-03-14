import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * GET /api/app/inventory/low-stock
 * Returns count of items where quantity <= reorderLevel (both parsed as numbers).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db
    .select({ id: inventoryItems.id, quantity: inventoryItems.quantity, reorderLevel: inventoryItems.reorderLevel })
    .from(inventoryItems)
    .where(eq(inventoryItems.tenantId, session.user.tenantId));

  const lowStockCount = list.filter((row) => {
    const q = parseFloat(row.quantity);
    const r = parseFloat(row.reorderLevel);
    if (Number.isNaN(q) || Number.isNaN(r)) return false;
    return q <= r;
  }).length;

  return NextResponse.json({ count: lowStockCount });
}
