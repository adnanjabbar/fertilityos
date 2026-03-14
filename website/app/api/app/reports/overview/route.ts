import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  appointments,
  patients,
  ivfCycles,
  invoices,
} from "@/db/schema";
import { eq, and, gte, lte, sql, count } from "drizzle-orm";

/**
 * GET /api/app/reports/overview?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns counts for the date range: appointments, new patients, IVF cycles, revenue.
 * Optional: appointmentsByDay for a simple chart.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const includeChart = url.searchParams.get("chart") === "true";

  const tenantId = session.user.tenantId;
  let fromDate: Date;
  let toDate: Date;

  if (fromParam && toParam) {
    fromDate = new Date(fromParam);
    toDate = new Date(toParam);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return NextResponse.json({ error: "Invalid from or to date" }, { status: 400 });
    }
    if (fromDate > toDate) {
      [fromDate, toDate] = [toDate, fromDate];
    }
  } else {
    const now = new Date();
    toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const fromTs = fromDate;
  const toTs = new Date(toDate.getTime() + 24 * 60 * 60 * 1000);

  const [appointmentsCount] = await db
    .select({ count: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.tenantId, tenantId),
        gte(appointments.startAt, fromTs),
        lte(appointments.startAt, toTs)
      )
    );

  const [patientsCount] = await db
    .select({ count: count() })
    .from(patients)
    .where(
      and(
        eq(patients.tenantId, tenantId),
        gte(patients.createdAt, fromTs),
        lte(patients.createdAt, toTs)
      )
    );

  const [cyclesCount] = await db
    .select({ count: count() })
    .from(ivfCycles)
    .where(
      and(
        eq(ivfCycles.tenantId, tenantId),
        gte(ivfCycles.createdAt, fromTs),
        lte(ivfCycles.createdAt, toTs)
      )
    );

  const revenueResult = await db
    .select({
      total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS NUMERIC)), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.tenantId, tenantId),
        eq(invoices.status, "paid"),
        gte(invoices.paidAt, fromTs),
        lte(invoices.paidAt, toTs)
      )
    );

  const revenue = revenueResult[0]?.total ?? "0";

  let appointmentsByDay: { date: string; count: number }[] = [];
  if (includeChart) {
    const byDay = await db
      .select({
        date: sql<string>`DATE(${appointments.startAt})::text`,
        count: count(),
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          gte(appointments.startAt, fromTs),
          lte(appointments.startAt, toTs)
        )
      )
      .groupBy(sql`DATE(${appointments.startAt})`)
      .orderBy(sql`DATE(${appointments.startAt})`);
    appointmentsByDay = byDay.map((r) => ({ date: r.date, count: Number(r.count) }));
  }

  return NextResponse.json({
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
    appointments: appointmentsCount?.count ?? 0,
    newPatients: patientsCount?.count ?? 0,
    ivfCycles: cyclesCount?.count ?? 0,
    revenuePaid: parseFloat(revenue),
    appointmentsByDay,
  });
}
