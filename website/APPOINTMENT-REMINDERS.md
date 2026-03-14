# Appointment Reminders (Email)

Appointment reminders are sent to the **patient’s email** for appointments in the **next 24 hours** that are still **scheduled** and have not had a reminder sent yet.

## How it works

1. A **cron job** (or scheduled task) calls the reminder endpoint daily (e.g. every morning).
2. The endpoint finds appointments with `startAt` between now and now+24h, `status = 'scheduled'`, and `reminder_sent_at IS NULL`.
3. For each, it sends an email via **Resend** and sets `reminder_sent_at` so we don’t send twice.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CRON_SECRET` | Yes (for cron) | Secret to authorize the cron request. Use in query or header: `?secret=CRON_SECRET` or `x-cron-secret: CRON_SECRET`. |
| `RESEND_API_KEY` | For real email | [Resend](https://resend.com) API key. If unset, emails are logged to console only. |
| `REMINDER_FROM_EMAIL` | No | Sender address, e.g. `FertilityOS <noreply@thefertilityos.com>`. |
| `RESEND_FROM_DOMAIN` | No | Domain used by Resend for the from address. |

## Cron endpoint

- **URL:** `GET` or `POST` `/api/cron/send-appointment-reminders`
- **Auth:** `?secret=YOUR_CRON_SECRET` or header `x-cron-secret: YOUR_CRON_SECRET`
- **Response:** JSON with `sent`, `failed`, and per-appointment `results`

Example (Vercel Cron in `vercel.json`):

```json
{
  "crons": [{ "path": "/api/cron/send-appointment-reminders", "schedule": "0 8 * * *" }]
}
```

For DigitalOcean or external cron, call:

```bash
curl -X POST "https://your-app.com/api/cron/send-appointment-reminders?secret=YOUR_CRON_SECRET"
```

## Database

- Column `appointments.reminder_sent_at` stores when the reminder was sent.
- Migration: `0008_appointment_reminder_sent.sql` (adds the column). Run with `node scripts/run-0008-only.js` if other migrations are already applied.
