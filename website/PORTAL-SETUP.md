# Patient Portal Setup

The patient portal lets patients sign in with a magic link and view their profile, appointments, and invoices (read-only).

## Auth flow

1. Patient goes to **/portal/login** and enters their email.
2. If a patient record exists with that email, a one-time magic link is created and sent via email (Resend). The link expires in 24 hours.
3. Patient clicks the link (**/portal/verify?token=...**), which signs them in with a "patient" session and redirects to **/portal**.
4. Patient can view Dashboard, My profile, Appointments, and Invoices. Sign out returns them to **/portal/login**.

## Environment

- **RESEND_API_KEY** – Used to send magic-link emails. If unset, the link is logged to the console only (e.g. local dev).
- **RESEND_FROM_DOMAIN** / **REMINDER_FROM_EMAIL** – Same as appointment reminders; see `APPOINTMENT-REMINDERS.md`.
- **NEXTAUTH_URL** (or **VERCEL_URL**) – Base URL used for magic links. Must be set in production so links point to your domain.

## Routes

| Path | Description |
|------|-------------|
| `/portal/login` | Request magic link (email form) |
| `/portal/verify?token=...` | Callback from email; signs in and redirects to `/portal` |
| `/portal` | Dashboard (requires patient session) |
| `/portal/profile` | Read-only patient demographics |
| `/portal/appointments` | List of patient's appointments |
| `/portal/invoices` | List of patient's invoices |

## APIs

- **POST /api/portal/request-link** – Body: `{ "email": "..." }`. Creates token, sends email. Always returns 200 with a generic message (no user enumeration).
- **GET /api/portal/me** – Returns current patient profile (requires patient session).
- **GET /api/portal/appointments** – Returns appointments for the current patient.
- **GET /api/portal/invoices** – Returns invoices for the current patient.

## Database

- **patient_portal_tokens** – Stores magic-link tokens: `patient_id`, `email`, `token`, `expires_at`, `used_at`. Run migration `0012_patient_portal_and_video.sql` (or `node scripts/run-migrations.js`).

## Middleware

- `/portal/login` and `/portal/verify` are public.
- Any other `/portal/*` requires a session with `roleSlug === "patient"`. Staff users hitting `/portal` are redirected to `/app/dashboard`.

## Security notes

- Tokens are single-use and expire after 24 hours.
- Request-link does not reveal whether an account exists; same message is shown in all cases.
- Portal APIs are scoped to the session’s `patientId`; no tenant or patient id in the URL.
