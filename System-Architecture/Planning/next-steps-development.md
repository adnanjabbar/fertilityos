# Next Steps — FertilityOS Development

**Current state:** Phase 2 (registration, team, RBAC, subdomain) and Phase 3 core modules (Patients, Appointments, EMR, IVF Lab, Billing) are implemented. MVP core feature set is in place.

---

## Completed (MVP core)

| Area | Status |
|------|--------|
| Clinic registration & admin | ✅ |
| Staff / Team (invitations, roles) | ✅ |
| RBAC & subdomain (tenant-by-slug) | ✅ |
| Patient Management (CRUD, list, detail) | ✅ |
| Appointments (CRUD, list by date/patient, detail) | ✅ |
| Clinical notes — SOAP (per patient) | ✅ |
| IVF cycles & embryos (per patient) | ✅ |
| Invoices & line items (per patient, unique numbers) | ✅ |
| Super Dashboard (platform overview) | ✅ |
| Demo seed & browser seed | ✅ |

---

## Recommended next steps (in order)

### 1. MVP polish (pre–beta) — Done

| # | Item | Status |
|---|------|--------|
| 1.1 | **Appointment reminders (email)** | Done. `appointments.reminder_sent_at`; cron `/api/cron/send-appointment-reminders`; Resend. See `website/APPOINTMENT-REMINDERS.md`. |
| 1.2 | **Stripe subscription (per tenant)** | Done. `tenant_subscriptions`; Checkout + Portal; webhook `/api/webhooks/stripe`; App → Billing. See `website/STRIPE-SETUP.md`. |
| 1.3 | **Module toggles in app** | Done. `tenants.enabled_modules`; nav by module; `PATCH /api/app/super/tenants/[tenantId]/modules`. |
_ (and optionally 1h) before appointment. Use Resend, SendGrid, or nodemailer; store “reminder sent” on appointment or in a small `appointment_reminders` table; optional cron or Vercel cron to run daily. |
| 1.2 | **Stripe subscription (per tenant)** | P0 | Create Stripe Customer per tenant (or per clinic); subscribe to a plan (e.g. Starter monthly). Webhook to sync subscription status; store `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus` on tenant or new `subscriptions` table. Billing page in app: “Manage subscription” → Stripe Customer Portal or checkout. |
| 1.3 | **Module toggles in app** | P1 | Tenants see only modules they’re subscribed to. Store enabled modules per tenant (e.g. `tenant_modules` or JSON on tenant). Hide nav items and routes for disabled modules; Super Admin can toggle modules per tenant or rely on Stripe product metadata. |

### 2. Phase 4 — first picks

| # | Item | Description |
|---|------|-------------|
| 2.1 | **Patient portal (read-only)** | Patient-facing login (separate auth or magic link); view own profile, appointments, invoices. Subdomain or path: `portal.thefertilityos.com` or `/portal`. |
| 2.2 | **Reporting / analytics dashboard** | Simple reports: appointments per period, revenue per period, patients added, IVF cycles per clinic. Charts (e.g. Recharts) on dashboard or dedicated `/app/reports`. |
| 2.3 | **Telemedicine** | Video visits (e.g. Daily.co, Twilio, or Zoom SDK); link to appointment type “video”; start call from appointment detail. |
| 2.4 | **Inventory (consumables)** | Track lab consumables per tenant: name, quantity, reorder level; low-stock alert on dashboard. |

### 3. Later (Phase 4–5)

- Donor management, surrogacy, LIS/LIMS integration, mobile apps, multi-language, HL7 FHIR (see `product-roadmap.md`).

**Phase 4 & 5 (first batch) completed:** Patient portal, reports, telemedicine, inventory, API keys, i18n, referrals, compliance. See `phase-4-handoff.md`, `phase-5-handoff.md`.

**Phase 6 completed:** Donors, audit logging, multi-currency, surrogacy. See `phase-6-handoff.md`.

**Next batch:** Phase 7 — PGT/PGS logging, prescriptions, ICD-10 diagnosis, SMS reminders. See `phase-7-handoff.md`.

---

## Implementation notes

- **Reminders:** Add `reminderSentAt` (or a small reminder log table), plus a route or cron that finds appointments in the next 24h and sends email; mark sent to avoid duplicates.
- **Stripe:** New table e.g. `tenant_subscriptions` (tenantId, stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd) or add columns on `tenants`. Use Stripe webhooks (subscription updated/deleted) to keep status in sync.
- **Module toggles:** Add `enabledModules: text[]` or JSON on `tenants`; middleware or layout reads it and hides nav/redirects for disabled modules; Super Dashboard can edit which modules are enabled per tenant (or derive from Stripe).

---

## How to proceed

- **Option A — MVP polish first:** Implement 1.1 (reminders), then 1.2 (Stripe), then 1.3 (module toggles). Then beta.
- **Option B — Phase 4 first:** Pick one of 2.1–2.4 (e.g. Patient portal or Reporting) and implement; then return to 1.1–1.3.
- **Option C — Multi-agent:** Use the same handoff pattern as Phase 3: one doc per initiative (e.g. `phase-4-1-appointment-reminders.md`, `phase-4-2-stripe-billing.md`) with clear scope and APIs so multiple agents can work in parallel.

Tell me which option (and which specific item) you want to tackle first, and I can produce the detailed handoff or implement it.
