import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { invoices, invoiceLines, patients } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const lineSchema = z.object({
  description: z.string().min(1).max(2000),
  quantity: z.number().int().min(1).or(z.string().min(1)).transform((v) => (typeof v === "string" ? parseInt(v, 10) : v)),
  unitPrice: z.number().min(0).or(z.string()).transform((v) => (typeof v === "string" ? parseFloat(v) || 0 : v)),
});

const updateInvoiceSchema = z.object({
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  paidAt: z.string().datetime().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(lineSchema).optional(),
});

function toAmount(v: number): string {
  return String(Math.round(v * 100) / 100);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [inv] = await db
    .select({
      id: invoices.id,
      tenantId: invoices.tenantId,
      patientId: invoices.patientId,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
      totalAmount: invoices.totalAmount,
      currency: invoices.currency,
      notes: invoices.notes,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
    })
    .from(invoices)
    .innerJoin(patients, eq(invoices.patientId, patients.id))
    .where(
      and(
        eq(invoices.id, id),
        eq(invoices.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!inv) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, id));

  return NextResponse.json({ ...inv, lines });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [existing] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.id, id),
        eq(invoices.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const updateValues: Partial<typeof invoices.$inferInsert> = { updatedAt: new Date() };
  if (data.status !== undefined) updateValues.status = data.status;
  if (data.paidAt !== undefined) updateValues.paidAt = data.paidAt ? new Date(data.paidAt) : null;
  if (data.dueDate !== undefined) updateValues.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null;

  if (data.lines !== undefined && data.lines.length > 0) {
    const lines = data.lines.map((l) => ({
      description: l.description.trim(),
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      amount: l.quantity * l.unitPrice,
    }));
    const totalAmount = lines.reduce((sum, l) => sum + l.amount, 0);
    updateValues.totalAmount = toAmount(totalAmount);

    await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id));
    await db.insert(invoiceLines).values(
      lines.map((l) => ({
        invoiceId: id,
        description: l.description,
        quantity: String(l.quantity),
        unitPrice: toAmount(l.unitPrice),
        amount: toAmount(l.amount),
      }))
    );
  }

  const [updated] = await db
    .update(invoices)
    .set(updateValues)
    .where(
      and(
        eq(invoices.id, id),
        eq(invoices.tenantId, session.user.tenantId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, id));
  return NextResponse.json({ ...updated, lines });
}
