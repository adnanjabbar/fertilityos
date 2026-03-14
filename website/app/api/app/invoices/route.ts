import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { invoices, invoiceLines, patients } from "@/db/schema";
import { eq, and, desc, like, sql } from "drizzle-orm";
import { z } from "zod";

const lineSchema = z.object({
  description: z.string().min(1).max(2000),
  quantity: z.number().int().min(1).or(z.string().min(1)).transform((v) => (typeof v === "string" ? parseInt(v, 10) : v)),
  unitPrice: z.number().min(0).or(z.string()).transform((v) => (typeof v === "string" ? parseFloat(v) || 0 : v)),
});

const createInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(lineSchema).min(1, "At least one line item required"),
});

function toAmount(v: number): string {
  return String(Math.round(v * 100) / 100);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId")?.trim() || null;
  const status = url.searchParams.get("status")?.trim() || null;

  const conditions = [eq(invoices.tenantId, session.user.tenantId)];
  if (patientId) conditions.push(eq(invoices.patientId, patientId));
  if (status) conditions.push(eq(invoices.status, status));

  const list = await db
    .select({
      id: invoices.id,
      patientId: invoices.patientId,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
      totalAmount: invoices.totalAmount,
      currency: invoices.currency,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(patients, eq(invoices.patientId, patients.id))
    .where(conditions.length > 1 ? and(...conditions) : conditions[0])
    .orderBy(desc(invoices.createdAt));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [patient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(
      and(
        eq(patients.id, data.patientId),
        eq(patients.tenantId, session.user.tenantId)
      )
    )
    .limit(1);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const [last] = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(
      and(
        eq(invoices.tenantId, session.user.tenantId),
        like(invoices.invoiceNumber, `${prefix}%`)
      )
    )
    .orderBy(desc(invoices.invoiceNumber))
    .limit(1);

  let nextNum = 1;
  if (last?.invoiceNumber) {
    const match = last.invoiceNumber.match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const invoiceNumber = `${prefix}${String(nextNum).padStart(3, "0")}`;

  const lines = data.lines.map((l) => ({
    description: l.description.trim(),
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    amount: l.quantity * l.unitPrice,
  }));
  const totalAmount = lines.reduce((sum, l) => sum + l.amount, 0);
  const dueDate = data.dueDate ? new Date(data.dueDate) : null;

  const [created] = await db
    .insert(invoices)
    .values({
      tenantId: session.user.tenantId,
      patientId: data.patientId,
      invoiceNumber,
      status: "draft",
      dueDate,
      totalAmount: toAmount(totalAmount),
      currency: "USD",
      notes: data.notes?.trim() || null,
    })
    .returning();

  if (!created) {
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }

  await db.insert(invoiceLines).values(
    lines.map((l) => ({
      invoiceId: created.id,
      description: l.description,
      quantity: String(l.quantity),
      unitPrice: toAmount(l.unitPrice),
      amount: toAmount(l.amount),
    }))
  );

  const [withLines] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, created.id))
    .limit(1);

  return NextResponse.json(withLines ?? created, { status: 201 });
}
