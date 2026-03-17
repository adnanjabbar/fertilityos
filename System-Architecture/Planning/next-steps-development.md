# Next Steps â€” FertilityOS Development

**Current state:** Phase 2 (registration, team, RBAC, subdomain) and Phase 3 core modules (Patients, Appointments, EMR, IVF Lab, Billing) are implemented. MVP core feature set is in place.

---

## Completed (MVP core)

| Area | Status |
|------|--------|
| Clinic registration & admin | âœ… |
| Staff / Team (invitations, roles) | âœ… |
| RBAC & subdomain (tenant-by-slug) | âœ… |
| Patient Management (CRUD, list, detail) | âœ… |
| Appointments (CRUD, list by date/patient, detail) | âœ… |
| Clinical notes â€” SOAP (per patient) | âœ… |
| IVF cycles & embryos (per patient) | âœ… |
| Invoices & line items (per patient, unique numbers) | âœ… |
| Super Dashboard (platform overview) | âœ… |
| Demo seed & browser seed | âœ… |

---

## Recommended next steps (in order)

### 1. MVP polish (preâ€“beta) â€” Done

| # | Item | Status |
|---|------|--------|
| 1.1 | **Appointment reminders (email)** | Done. `appointments.reminder_sent_at`; cron `/api/cron/send-appointment-reminders`; Resend. See `website/APPOINTMENT-REMINDERS.md`. |
| 1.2 | **Stripe subscription (per tenant)** | Done. `tenant_subscriptions`; Checkout + Portal; webhook `/api/webhooks/stripe`; App â†’ Billing. See `website/STRIPE-SETUP.md`. |
| 1.3 | **Module toggles in app** | Done. `tenants.enabled_modules`; nav by module; `PATCH /api/app/super/tenants/[tenantId]/modules`. |

### 2. Phase 4 â€” first picks

| # | Item | Description |
|---|------|-------------|
| 2.1 | **Patient portal (read-only)** | Patient-facing login (separate auth or magic link); view own profile, appointments, invoices. Subdomain or path: `portal.thefertilityos.com` or `/portal`. |
| 2.2 | **Reporting / analytics dashboard** | Simple reports: appointments per period, revenue per period, patients added, IVF cycles per clinic. Charts (e.g. Recharts) on dashboard or dedicated `/app/reports`. |
| 2.3 | **Telemedicine** | Video visits (e.g. Daily.co, Twilio, or Zoom SDK); link to appointment type "video"; start call from appointment detail. |
| 2.4 | **Inventory (consumables)** | Track lab consumables per tenant: name, quantity, reorder level; low-stock alert on dashboard. |

### 3. Later (Phase 4â€“5)

- Donor management, surrogacy, LIS/LIMS integration, mobile apps, multi-language, HL7 FHIR (see `product-roadmap.md`).

**Phase 4 & 5 (first batch) completed:** Patient portal, reports, telemedicine, inventory, API keys, i18n, referrals, compliance. See `phase-4-handoff.md`, `phase-5-handoff.md`.

**Phase 6 completed:** Donors, audit logging, multi-currency, surrogacy. See `phase-6-handoff.md`.

**Phase 7 completed:** PGT/PGS logging, formulary & prescriptions, full ICD-11 diagnosis, letterhead/QR/patient 2FA, MR printing, SMS reminders, tenant integrations (Twilio/Daily), pricing ($29.99/$49.99/$79.99), 14-day trial and trial signup storage. See `phase-7-handoff.md`. Full WHO ICD-11 MMS seeded via `seed-icd11-full.js`.

**Phase 8 completed:** WhatsApp integration (tenant-owned), newsletter/email campaigns (TheFertilityOS footer: gradient â€œFertilityOSâ€ â†’ www.thefertilityos.com), LIS/LIMS lab connectors, multi-location. See `phase-8-handoff.md`.

**Phase 9 completed:** PWA (manifest, service worker, offline page), security hardening (rate limiting on auth/OTP, CSP and security headers, audit for patient list view), public Integrations catalog (`/integrations`), white-label (logo, primary color, â€œPowered byâ€ toggle in Letterhead settings), and mobile-apps exploration doc. See `website/PWA-AND-MOBILE.md`, `website/SECURITY-AND-COMPLIANCE.md`, `website/API-MARKETPLACE.md`, `website/ENTERPRISE-WHITELABEL.md`, `website/MOBILE-APPS.md`.

**Phase 10 (10.1 + 10.2) completed:** Patient portal password and GDPR-style export/delete request flow. 10.1: patients can set a password (link from Profile or email) and sign in with email + password; "Forgot password" sends a reset link. 10.2: "Export my data" and "Request account deletion" in the portal; admin handling of delete requests. See `website/PATIENT-PORTAL-PASSWORD.md`, `website/SECURITY-AND-COMPLIANCE.md`, `System-Architecture/Planning/phase-10-handoff.md`.

---

## Implementation notes

- **Reminders:** Add `reminderSentAt` (or a small reminder log table), plus a route or cron that finds appointments in the next 24h and sends email; mark sent to avoid duplicates.
- **Stripe:** New table e.g. `tenant_subscriptions` (tenantId, stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd) or add columns on `tenants`. Use Stripe webhooks (subscription updated/deleted) to keep status in sync.
- **Module toggles:** Add `enabledModules: text[]` or JSON on `tenants`; middleware or layout reads it and hides nav/redirects for disabled modules; Super Dashboard can edit which modules are enabled per tenant (or derive from Stripe).

---

## How to proceed

- **Option A â€” MVP polish first:** Implement 1.1 (reminders), then 1.2 (Stripe), then 1.3 (module toggles). Then beta.
- **Option B â€” Phase 4 first:** Pick one of 2.1â€“2.4 (e.g. Patient portal or Reporting) and implement; then return to 1.1â€“1.3.
- **Option C â€” Multi-agent:** Use the same handoff pattern as Phase 3: one doc per initiative (e.g. `phase-4-1-appointment-reminders.md`, `phase-4-2-stripe-billing.md`) with clear scope and APIs so multiple agents can work in parallel.

Tell me which option (and which specific item) you want to tackle first, and I can produce the detailed handoff or implement it.
