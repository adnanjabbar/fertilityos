/**
 * Cron endpoint: send appointment reminder emails and/or SMS for appointments in the next 24h.
 * Uses tenant reminderChannel (email | sms | both). Call with GET or POST and ?secret=CRON_SECRET (or header x-cron-secret).
 * Schedule daily (e.g. Vercel Cron, DigitalOcean job, or external cron).
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, patients, tenants } from "@/db/schema";
import { and, eq, gte, lte, or, isNull } from "drizzle-orm";
import { sendEmail, appointmentReminderContent } from "@/lib/email";
import { sendSms, appointmentReminderSmsBody } from "@/lib/sms";

const WINDOW_HOURS = 24; // Remind for appointments in the next 24 hours
const BUFFER_MINUTES = 30; // Don't send if appointment is in the past (e.g. 24h window already passed)

type ReminderChannel = "email" | "sms" | "both";

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

  // Fetch all appointments in window that might need email and/or SMS (based on channel and sent flags)
  const rows = await db
    .select({
      appointmentId: appointments.id,
      startAt: appointments.startAt,
      type: appointments.type,
      patientId: appointments.patientId,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      patientEmail: patients.email,
      patientPhone: patients.phone,
      tenantId: appointments.tenantId,
      tenantName: tenants.name,
      reminderChannel: tenants.reminderChannel,
      reminderSentAt: appointments.reminderSentAt,
      reminderSmsSentAt: appointments.reminderSmsSentAt,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(tenants, eq(appointments.tenantId, tenants.id))
    .where(
      and(
        eq(appointments.status, "scheduled"),
        gte(appointments.startAt, windowStart),
        lte(appointments.startAt, windowEnd),
        or(
          // Need email: (channel is email or both) and email not yet sent
          and(
            or(eq(tenants.reminderChannel, "email"), eq(tenants.reminderChannel, "both")),
            isNull(appointments.reminderSentAt)
          ),
          // Need SMS: (channel is sms or both) and SMS not yet sent
          and(
            or(eq(tenants.reminderChannel, "sms"), eq(tenants.reminderChannel, "both")),
            isNull(appointments.reminderSmsSentAt)
          )
        )
      )
    );

  const emailResults: { appointmentId: string; email: string; ok: boolean; error?: string }[] = [];
  const smsResults: { appointmentId: string; to: string; ok: boolean; error?: string }[] = [];

  for (const row of rows) {
    const channel = (row.reminderChannel ?? "email") as ReminderChannel;
    const needEmail = (channel === "email" || channel === "both") && !row.reminderSentAt;
    const needSms = (channel === "sms" || channel === "both") && !row.reminderSmsSentAt;

    if (needEmail) {
      const email = row.patientEmail?.trim();
      if (!email) {
        emailResults.push({ appointmentId: row.appointmentId, email: "", ok: false, error: "No patient email" });
      } else {
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
        emailResults.push({ appointmentId: row.appointmentId, email, ok: sendResult.ok, error: sendResult.error });
      }
    }

    if (needSms) {
      const phone = row.patientPhone?.trim();
      if (!phone) {
        smsResults.push({ appointmentId: row.appointmentId, to: "", ok: false, error: "No patient phone" });
      } else {
        const body = appointmentReminderSmsBody({
          patientFirstName: row.patientFirstName,
          startAt: row.startAt,
          type: row.type,
          clinicName: row.tenantName ?? undefined,
        });
        const sendResult = await sendSms({ to: phone, body, tenantId: row.tenantId });
        if (sendResult.ok) {
          await db
            .update(appointments)
            .set({ reminderSmsSentAt: now, updatedAt: now })
            .where(eq(appointments.id, row.appointmentId));
        }
        smsResults.push({ appointmentId: row.appointmentId, to: phone, ok: sendResult.ok, error: sendResult.error });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    window: { from: windowStart.toISOString(), to: windowEnd.toISOString() },
    email: { sent: emailResults.filter((r) => r.ok).length, failed: emailResults.filter((r) => !r.ok).length, results: emailResults },
    sms: { sent: smsResults.filter((r) => r.ok).length, failed: smsResults.filter((r) => !r.ok).length, results: smsResults },
  });
}
