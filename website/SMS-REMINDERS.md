# SMS Appointment Reminders (Phase 7.4)

SMS reminders extend the existing email reminders. Each **tenant** can choose how to send appointment reminders: **Email only**, **SMS only**, or **Both**. The cron job sends according to the tenant’s setting and records when email and/or SMS were sent on each appointment.

## Schema

- **Tenants:** `reminder_channel` enum (`email` | `sms` | `both`). Default: `email`.
- **Appointments:** `reminder_sent_at` (email), `reminder_sms_sent_at` (SMS). Both are set when the corresponding reminder is sent.

**Migration:** `db/migrations/0020_reminder_channel_and_sms.sql`. Run with `node scripts/run-migrations.js` from `website/`.

## How it works

1. A **cron job** calls `/api/cron/send-appointment-reminders` (e.g. daily).
2. For each tenant, the endpoint uses **reminderChannel**:
   - **email:** Send email only (same as before). Requires patient email. Sets `reminder_sent_at`.
   - **sms:** Send SMS only. Requires patient phone. Sets `reminder_sms_sent_at`.
   - **both:** Send email and SMS when applicable. Sets both timestamps when each is sent.
3. Appointments are in the same 24-hour window, `status = 'scheduled'`, and only those that still need email and/or SMS (based on channel and null sent timestamps) are processed.

## Twilio integration (tenant-owned, no platform key)

FertilityOS does **not** provide or pay for Twilio. Each clinic adds their own **Twilio credentials** in **Settings → Integrations** (Account SID, Auth Token, “From” phone number). The cron and portal OTP use the **tenant’s** credentials from `tenant_integrations`.

- **Real SMS:** Admin configures Twilio in **Settings → Integrations**. SMS reminders and portal verification then use that tenant’s account.
- **Stub:** If the tenant has not set Twilio credentials, the SMS path logs the would-be message and returns success (no real SMS).

SMS body is short (e.g. “{FirstName}, reminder: {type} appointment on {date/time}. {Clinic name}”).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CRON_SECRET` | Yes (for cron) | Secret for the cron request (`?secret=...` or `x-cron-secret` header). |
| `RESEND_API_KEY` | For real email | [Resend](https://resend.com) API key. If unset, email is logged only. |

No Twilio env vars at the platform level — tenants use their own accounts via Settings → Integrations.

## Cron endpoint

- **URL:** `GET` or `POST` `/api/cron/send-appointment-reminders`
- **Auth:** `?secret=YOUR_CRON_SECRET` or header `x-cron-secret: YOUR_CRON_SECRET`
- **Response:** JSON with `email` and `sms` sections, each with `sent`, `failed`, and `results` (per appointment).

## Settings API

- **GET /api/app/settings** — Returns `defaultCurrency` and `reminderChannel` (`email` | `sms` | `both`). Authenticated app user.
- **PATCH /api/app/settings** — Body may include `reminderChannel`. Admin only. Optional `defaultCurrency` as before.

## UI

- **Billing & settings** (`/app/billing`): “Appointment reminders” card with **Reminder channel** dropdown (Email only / SMS only / Email and SMS). Admin can save. Requires admin to change.
- **Appointment detail** (`/app/appointments/[id]`): Optional “Reminders sent” section shows “Email sent &lt;date/time&gt;” and/or “SMS sent &lt;date/time&gt;” when the corresponding reminder was sent.

## Patient data

- **Email reminders:** Use `patients.email`. If missing, the email step is skipped for that appointment (and reported in cron results).
- **SMS reminders:** Use `patients.phone`. If missing, the SMS step is skipped (and reported in cron results). Phone should be in E.164 or a format Twilio accepts.

## Related

- Email-only behavior and Resend setup: see `APPOINTMENT-REMINDERS.md`.
- Cron schedule examples (Vercel, curl) are in that file; the same endpoint now handles both email and SMS based on tenant settings.
