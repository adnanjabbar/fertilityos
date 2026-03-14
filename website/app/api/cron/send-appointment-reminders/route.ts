/**
 * Cron endpoint: send appointment reminder emails for appointments in the next 24h.
 * Call with GET or POST and ?secret=CRON_SECRET (or header x-cron-secret).
 * Schedule daily (e.g. Vercel Cron, DigitalOcean job, or external cron).
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, patients, tenants } from "@/db/schema";
import { and, eq, isNull, gte, lte, sql } from "drizzle-orm";
import { sendEmail, appointmentReminderContent } from "@/lib/email";

const WINDOW_HOURS = 24; // Remind for appointments in the next 24 hours
const BUFFER_MINUTES = 30; // Don't send if appointment is in the past (e.g. 24h window already passed)

export async function GET(request: Request) {
  return runReminders(request);
}

export async function POST(request: Request) {
  return runReminders(request);
}

async function runReminders(request: Request) {
  const secret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + BUFFER_MINUTES * 60 * 1000);
  const windowEnd = new Date(now.getTime() + WINDOW_HOURS * 60 * 60 * 1000);

  const toSend = await db
    .select({
      appointmentId: appointments.id,
      startAt: appointments.startAt,
      type: appointments.type,
      patientId: appointments.patientId,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      patientEmail: patients.email,
      tenantId: appointments.tenantId,
      tenantName: tenants.name,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(tenants, eq(appointments.tenantId, tenants.id))
    .where(
      and(
        eq(appointments.status, "scheduled"),
        isNull(appointments.reminderSentAt),
        gte(appointments.startAt, windowStart),
        lte(appointments.startAt, windowEnd)
      )
    );

  const results: { appointmentId: string; email: string; ok: boolean; error?: string }[] = [];

  for (const row of toSend) {
    const email = row.patientEmail?.trim();
    if (!email) {
      results.push({ appointmentId: row.appointmentId, email: "", ok: false, error: "No patient email" });
      continue;
    }

    const { subject, html, text } = appointmentReminderContent({
      patientFirstName: row.patientFirstName,
      patientLastName: row.patientLastName,
      startAt: row.startAt,
      type: row.type,
      clinicName: row.tenantName ?? undefined,
    });

    const sendResult = await sendEmail({ to: email, subject, html, text });

    if (sendResult.ok) {
      await db
        .update(appointments)
        .set({ reminderSentAt: now, updatedAt: now })
        .where(eq(appointments.id, row.appointmentId));
    }

    results.push({
      appointmentId: row.appointmentId,
      email,
      ok: sendResult.ok,
      error: sendResult.error,
    });
  }

  return NextResponse.json({
    ok: true,
    window: { from: windowStart.toISOString(), to: windowEnd.toISOString() },
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
