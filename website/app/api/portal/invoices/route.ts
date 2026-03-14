import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.patientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      totalAmount: invoices.totalAmount,
      currency: invoices.currency,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
    })
    .from(invoices)
    .where(eq(invoices.patientId, session.user.patientId))
    .orderBy(desc(invoices.createdAt))
    .limit(100);

  return NextResponse.json(
    list.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      status: i.status,
      totalAmount: i.totalAmount,
      currency: i.currency,
      dueDate: i.dueDate,
      paidAt: i.paidAt,
    }))
  );
}
