# Phase 7 — Agent briefs (run in parallel)

Use `System-Architecture/Planning/phase-7-handoff.md` as the single source of truth. Each agent implements one section.

---

## Agent 7.1 — PGT/PGS results logging

Implement **Section 7.1** of `phase-7-handoff.md`: PGT/PGS results per embryo. Add schema (embryo_genetic_results or extend embryos), migrations, tenant-scoped APIs (GET/POST/PATCH), and UI section "Genetic testing" on embryo detail. Create `website/PGT-PGS-LOGGING.md`. Follow existing patterns in `website/db/schema.ts` and `website/app/api/`.

---

## Agent 7.2 — Formulary & prescriptions

Implement **Section 7.2** of `phase-7-handoff.md`: (1) Formulary: medications table (brand name, generic, dosage, form, frequency options, instruction checkboxes + extended, optional pharma company); medication_groups and medication_group_items for protocols like "IVF Protocol". (2) Prescriptions: only from formulary or protocol; prescription_lines link to medications or group. CRUD for formulary and protocols; prescription APIs and patient prescriptions UI. Add hint about instructions helping patients. Create `website/FORMULARY-AND-PRESCRIPTIONS.md`. Add nav under Administration or Settings if needed.

---

## Agent 7.3 — ICD-11 and custom diagnosis

Implement **Section 7.3** of `phase-7-handoff.md`: ICD-11 full implementation (not ICD-10). Schema: icd11_entities (code, title, description, etc.) and patient_diagnoses (icd11Code, customDiagnosis, recordedBy, role). Seed/import ICD-11 data with full detail text. APIs: search ICD-11; CRUD patient diagnoses with role check for custom diagnosis. UI: ICD-11 search, "ICD-11 Disease Detail" section, optional custom diagnosis for permitted roles. Create `website/ICD11-DIAGNOSIS.md`.

---

## Agent 7.4 — SMS appointment reminders

Implement **Section 7.4** of `phase-7-handoff.md`: SMS reminders (Twilio or stub). Schema: reminderChannel on tenants/appointments, reminderSmsSentAt on appointments. Extend cron send-appointment-reminders to send SMS. Optional settings UI for channel. Create `website/SMS-REMINDERS.md`.

---

## Agent 7.5 — Letterhead, prescription print, QR, patient 2FA

Implement **Section 7.5** of `phase-7-handoff.md`: Tenant branding (letterhead upload or template, logo, address, phone, email, website, footer, print margins). Prescription print view with margins and unique QR code. Patient 2FA: national ID (type + value) + phone; OTP or magic link; portal access to own records. Schema: tenant_branding, prescriptionNumber, patient nationalIdType/nationalIdValue; portal verify/auth APIs. Create `website/LETTERHEAD-AND-PRESCRIPTION-PRINT.md`. Coordinate with 7.2 if prescription schema changes.

---

## Agent 7.6 — MR number and label/wrist band printing

Implement **Section 7.6** of `phase-7-handoff.md`: Add mrNumber to patients (unique per tenant, auto-generated). Label types: wrist band, IVF barcode, vial/sample stickers, medication envelope. Support Zebra (ZPL), Brother, generic thermal, PDF. APIs: GET patient MR, POST print/label (type, printerType). UI: Label type + printer type selector, preview, print/download. Create `website/MR-PRINTING-AND-LABELS.md`. If migrating patients table, ensure no conflict with 7.2/7.3/7.5.
