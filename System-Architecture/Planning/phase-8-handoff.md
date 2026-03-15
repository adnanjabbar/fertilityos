# Phase 8 — Next batch: Agent handoff

**Prerequisite:** Phases 4–7 done (portal, reports, telemedicine, inventory, API keys, i18n, referrals, compliance, donors, audit, multi-currency, surrogacy, PGT/PGS, formulary/prescriptions, full ICD-11, letterhead/QR/2FA, MR printing, SMS, tenant integrations, pricing/trial). Full WHO ICD-11 MMS seeded.

**Goal:** Communications (WhatsApp, newsletter/automated emails), lab integration, and platform extensions. Tenants use their own credentials for WhatsApp and optional custom email; we provide the integration surface only.

**Repo:** `FertilityOS` · **App:** `website/` (Next.js, Drizzle, Auth.js).  
**Conventions:** Tenant-scoped APIs, `website/db/schema.ts`, migrations, left sidebar nav, gradient styling. No platform-owned Twilio/Daily/WhatsApp/email accounts — tenants configure in Settings → Integrations.

---

## 8.1 WhatsApp integration (tenant-owned)

**Scope:** Let clinics connect their own WhatsApp Business API (or approved provider) and use it for patient updates, reminders, and simple automation. Platform does not pay for or provide WhatsApp — only storage of tenant credentials and sending via their account.

- **Schema:** Extend `tenant_integrations` (or add table): `whatsapp_provider` (e.g. twilio_whatsapp, meta_cloud_api, other), `whatsapp_phone_number_id`, `whatsapp_access_token` or provider-specific credentials, optional `whatsapp_template_namespace`. Migration.
- **APIs:** GET/PATCH tenant WhatsApp config (admin only). Internal helper (e.g. `lib/whatsapp.ts`) that sends via tenant’s credentials; used by appointment reminders, portal notifications, or future flows. Validate credentials on save (optional test send).
- **UI:** Settings → Integrations: section “WhatsApp” with provider select, phone number ID, token/credentials. Hint: “Use your own WhatsApp Business account; we do not provide or pay for WhatsApp.”
- **Use cases (v1):** Optional “Send reminder via WhatsApp” alongside email/SMS (extend reminder channel or add WhatsApp as option); optional patient notification when prescription is ready or appointment confirmed. Templates and automation (e.g. drip flows) can follow in a later iteration.
- **Deliverables:** Schema + migration, integration config API and UI, send helper, optional reminder/notification hook. Document in `website/WHATSAPP-INTEGRATION.md`.

---

## 8.2 Newsletter and automated emails (tenant-facing)

**Scope:** Allow clinics to send newsletters and automated emails to patients. Two modes: (1) default — sent via our infrastructure with FertilityOS branding in footer; (2) premium — tenant’s own domain/SMTP, no FertilityOS branding in footer.

- **Schema:** `email_campaigns` or `newsletter_campaigns`: id, tenantId, name, subject, bodyHtml, bodyText, status (draft|scheduled|sent), scheduledAt, sentAt, createdById, recipientFilter (e.g. all patients, segment), createdAt, updatedAt. Optional: `email_send_log` (campaignId, patientId, sentAt, provider used). Tenant setting: `email_sending_mode` (platform | custom_domain), `custom_smtp_*` or `custom_domain_*` for premium. Migration.
- **Sending:** Default: use existing Resend (or app email) with “Sent via FertilityOS” / clinic name in From/Reply; store clinic name and optional reply-to from tenant. Premium: tenant configures SMTP or verified domain; send via their config; no FertilityOS footer. Respect tenant’s choice and store which provider was used per send.
- **APIs:** CRUD for campaigns (draft, schedule, cancel). GET list of campaigns; GET/POST/PATCH/DELETE single campaign. Endpoint to “send test” (to current user or specified email). Optional: GET stats (sent, opened, clicked) if using a provider that supports it.
- **UI:** New section “Newsletter” or “Email campaigns” under Administration (or Marketing): list campaigns, create draft (subject, body, recipient filter, schedule or send now), view sent log. Settings: “Email sending” — Default (FertilityOS) vs Custom domain (premium); if custom, form for SMTP or domain verification.
- **Deliverables:** Schema + migration, campaign CRUD APIs, send pipeline (platform vs custom), UI for campaigns and email settings. Document in `website/NEWSLETTER-AND-EMAILS.md`.

---

## 8.3 LIS/LIMS lab integration (connectors)

**Scope:** Foundation for connecting to Laboratory Information Systems (LIS) or Laboratory Information Management Systems (LIMS): store connector config per tenant, define mappings for orders and results, and optionally ingest results into the app (e.g. link to patient/cycle/specimen).

- **Schema:** `lab_connectors`: id, tenantId, name, type (lis | lims), provider (e.g. hl7_fhir, custom_api, file_import), config (JSONB: endpoint, auth, lab_id, etc.), isActive, lastSyncAt, createdAt, updatedAt. Optional: `lab_orders` (tenantId, patientId, cycleId or specimenId, externalId, orderCode, status, requestedAt, resultAt, resultPayload JSONB), `lab_result_mappings` (connectorId, externalCode, internalCode or description). Migration.
- **APIs:** CRUD for lab connectors (admin only). Optional: POST “sync” or “import results” for a connector (file upload or API pull); validate and map results into `lab_orders` or a results table. GET lab orders/results for a patient or cycle.
- **UI:** Settings → Integrations or new “Lab integration”: list connectors, add connector (select type/provider, fill config), test connection, view last sync. Patient or cycle view: optional “Lab results” section showing imported results.
- **Deliverables:** Schema + migration, connector CRUD and config UI, optional one-way import (file or API) with mapping. Document in `website/LIS-LIMS-INTEGRATION.md`. Full HL7/FHIR or vendor-specific adapters can be added incrementally.

---

## 8.4 Multi-location support (optional)

**Scope:** Allow a tenant (clinic) to have multiple physical locations. Appointments, resources, and reporting can be scoped by location.

- **Schema:** `locations`: id, tenantId, name, address, city, state, country, postalCode, timezone, isDefault, createdAt, updatedAt. Add `locationId` (nullable FK) to `appointments`, optional to `patients` (preferred location), and to `users` (default location). Migration.
- **APIs:** CRUD locations (admin). GET locations for tenant. Appointments list/filter by location; create appointment with locationId. Optional: availability or resources per location.
- **UI:** Settings → Locations: list, add, edit. Appointment form: location dropdown when multiple exist. Reports: filter by location.
- **Deliverables:** Schema + migration, location CRUD and UI, appointment–location link, optional reporting filter. Document in `website/MULTI-LOCATION.md`.

---

## Execution

- One agent per section (8.1–8.4). Run in parallel where possible.
- 8.1 and 8.2 extend tenant_integrations or settings; coordinate migrations if both touch the same table.
- After each: merge, run migrations, update `next-steps-development.md`. Document in the referenced `website/*.md` files.
