# Phase 7 — Full handoff (multi-agent)

**Prerequisite:** Phases 4–6 done. App shell uses left sidebar + gradient styling.

**Goal:** EMR/IVF polish, formulary & prescriptions, ICD-11, letterhead/prescription printing with QR & patient 2FA, MR-based labels/wrist bands, SMS reminders. Split across agents 7.1–7.6.

**Repo:** `FertilityOS` · **App:** `website/` (Next.js, Drizzle, Auth.js).  
**Conventions:** Tenant-scoped APIs, `website/db/schema.ts`, migrations in `website/db/migrations/`, add to `run-migrations.js`. UI: left sidebar nav, gradient (blue–purple), touch targets ≥44px, focus states, aria-labels.

---

## 7.1 PGT/PGS results logging (IVF module)

**Scope:** Log PGT/PGS results per embryo for compliance and reporting.

- **Schema:** Add to `embryos` or new `embryo_genetic_results`: embryoId, testType (e.g. PGT-A, PGT-M), result (euploid, aneuploid, mosaic, inconclusive), resultDate, labReference (optional), notes. Migration.
- **APIs:** GET/POST/PATCH for genetic results scoped by embryo (and tenant). List on embryo detail.
- **UI:** Embryo detail (or IVF cycle view): section "Genetic testing" with add/view/edit results. Nav: existing IVF/Patients flow.
- **Deliverables:** Schema + migration, APIs, UI section. Document in `website/PGT-PGS-LOGGING.md`.

---

## 7.2 Formulary (clinic medication database) & prescriptions

**Scope:** Clinic-owned formulary (internal pharmacy). Prescriptions only from formulary or from clinic-created medication groups (e.g. IVF Protocol). No free-text medication—only selections from formulary or protocol.

### 7.2.1 Formulary (medications backend)

- **Schema — `medications` (formulary):**
  - id, tenantId, brandName (varchar), genericName (varchar), dosage (varchar, e.g. "10mg"), form (enum or varchar): tablet, capsule, injection, suppository, pessary, syrup, cream, gel, drops, inhaler, other.
  - frequencyOptions (text[] or JSONB): allow multiple for this med if needed; typically one default. System-wide frequency list: OD, BD, TDS, QID, at_night, at_morning, once_weekly, twice_weekly, half_monthly, once_monthly, as_needed, other (with custom text).
  - instructionsCheckboxes (JSONB or separate table): pregnancy_safe, lactation_safe, addiction_risk, dependency_risk, drug_interaction_risk, cautions (boolean or tag). Plus instructionsExtended (text, clinic-defined).
  - pharmaceuticalCompany (varchar, optional).
  - createdAt, updatedAt.
- **Schema — `medication_groups` (e.g. IVF Protocol):**
  - id, tenantId, name (e.g. "IVF Protocol"), description (optional), createdAt, updatedAt.
- **Schema — `medication_group_items`:**
  - id, medicationGroupId, medicationId (FK medications), quantityPerCycle (optional), defaultDurationDays (optional), sortOrder. So a protocol is a list of formulary medications with optional qty/duration.
- **APIs:** CRUD for medications (formulary) and medication_groups + group_items. List medications for dropdowns; list groups for “prescribe protocol” flow. All tenant-scoped.
- **UI — Formulary:** `/app/medications` or under Settings/Administration: list medications, add/edit: brand name, generic name, dosage, form (dropdown), frequency options (multi-select from system list), instruction checkboxes (pregnancy safe, lactation, addiction, cautions, drug interaction, etc.), extended instructions (textarea), pharmaceutical company (optional). Hint: “Adding instructions helps patients follow their medication plans.”
- **UI — Protocols:** Same area: list medication groups, add/edit group, add medications from formulary to group with optional quantity/duration and order.

### 7.2.2 Prescriptions

- **Schema — `prescriptions`:**
  - id, tenantId, patientId, prescribedById (userId), status (prescribed | dispensed | completed | cancelled), startDate, endDate (optional), notes, createdAt, updatedAt.
  - Either: prescriptionType (single | protocol). If single: prescriptionLine links to one medication. If protocol: prescriptionLine links to medication_group (and we expand to lines per medication in group).
- **Schema — `prescription_lines`:**
  - id, prescriptionId, medicationId (FK medications, not null for single med), medicationGroupId (FK medication_groups, null for single), quantity, durationDays, frequency (stored as chosen from med’s options or override), instructionsOverride (text, optional). So one prescription can have many lines (either one line per selected formulary med, or N lines from a protocol).
- **Rule:** When creating a prescription, user selects either (a) one or more medications from the clinic formulary, or (b) one medication group (protocol). No typing medication names—only pick from formulary/protocol.
- **APIs:** GET /api/app/patients/[id]/prescriptions, POST/PATCH prescription with lines (medicationIds or medicationGroupId). Validate medicationId/medicationGroupId belong to tenant formulary.
- **UI:** Patient detail → Prescriptions: list prescriptions, add new → “From formulary” (multi-select medications) or “From protocol” (select one group). Show lines with med name, dosage, frequency, duration. Mark dispensed/completed.
- **Deliverables:** Schema + migrations (medications, medication_groups, medication_group_items, prescriptions, prescription_lines), formulary CRUD APIs, protocol CRUD APIs, prescription APIs, UI for formulary + protocols + patient prescriptions. Document in `website/FORMULARY-AND-PRESCRIPTIONS.md`.

---

## 7.3 ICD-11 diagnosis (full implementation) & custom diagnosis

**Scope:** Full ICD-11 (not ICD-10). Store full ICD-11 detail in DB for robust local use. Allow custom diagnosis when not in ICD-11, governed by clinic roles/permissions.

- **Schema:**
  - **icd11_entities** (or similar): id, code (varchar, unique), title (varchar), description (text), parentCode (varchar, optional), chapter/section metadata if needed. Populate from WHO ICD-11 release (import script or seed). Store enough so “ICD-11 Disease Detail” can show full text for the code.
  - **patient_diagnoses:** id, tenantId, patientId, icd11Code (varchar, FK or reference to icd11_entities), customDiagnosis (text, nullable—when not in ICD-11), recordedById (userId), recordedAt, roleSlugAtRecord (optional). When customDiagnosis is set, only roles permitted by clinic (e.g. physician, PA, nurse) can add/edit; enforce via existing RBAC.
  - Optional: link diagnosis to prescription or clinical note (e.g. diagnosisId on prescriptions or clinical_notes).
- **APIs:** GET /api/app/icd11?q=... (search by code or title, returns list with code + title + description). GET/POST/PATCH/DELETE patient diagnoses: include icd11Code + full ICD-11 detail text in response; allow customDiagnosis when role has permission. Validate icd11Code exists in icd11_entities when provided.
- **UI:** Patient form/detail: “Diagnosis (ICD-11)” section. Search/select from ICD-11; show “ICD-11 Disease Detail” (full text) for selected code. Option “Add custom diagnosis (if not in ICD-11)”—only shown to roles allowed by clinic; free-text stored in customDiagnosis. Show both ICD-11 and custom on patient summary.
- **Deliverables:** Schema + migration; ICD-11 data seed/import (full detail text per code); APIs; UI with ICD-11 search, detail section, and role-based custom diagnosis. Document in `website/ICD11-DIAGNOSIS.md`.

---

## 7.4 SMS appointment reminders (optional)

**Scope:** SMS reminders in addition to email (Twilio or similar). Configurable per tenant.

- **Schema:** Add reminderChannel (email | sms | both) to tenants or appointments. Add reminderSmsSentAt on appointments if not present.
- **APIs:** Extend cron `/api/cron/send-appointment-reminders` to send SMS when channel allows. Optional PATCH /api/app/settings for reminder preference.
- **UI:** Settings or Appointments settings: “Reminder channel” (Email / SMS / Both). Optional: “SMS sent” on appointment detail.
- **Deliverables:** Twilio (or stub) integration, cron update, optional settings UI. Document in `website/SMS-REMINDERS.md`.

---

## 7.5 Letterhead, prescription printing, QR code & patient 2FA access

**Scope:** Clinic letterhead/letterpad, printable prescriptions with margins and QR; patient access via QR + 2FA (national ID + contact).

- **Schema:**
  - **tenant_branding** (or extend tenants): letterheadImageUrl (text, optional), useLetterheadTemplate (boolean), templateSlug (varchar, optional, e.g. default_modern). Print margins: marginTop, marginBottom, marginLeft, marginRight (mm or pt). Footer: address, phone, email, website, footerText (optional). Logo URL if not part of letterhead image.
  - **prescriptions:** Ensure prescription has unique identifier (e.g. prescriptionNumber or id) for QR payload. Add prescriptionNumber if not present (unique per tenant).
  - **patients:** Add nationalIdType (varchar: national_id, ssn, citizen_id, other), nationalIdValue (varchar, hashed or encrypted if required by policy). Used for 2FA with phone.
  - **patient_portal_credentials or auth:** Support login by nationalIdType + nationalIdValue + phone; 2FA (e.g. OTP to phone). Link to existing patient portal; ensure QR points to URL that triggers this flow (e.g. /portal/verify?token=... or /portal/login?prescription=...).
- **Letterhead:** Clinic can (1) upload own letterhead graphic (store URL or file path), or (2) use provided templates. Templates: select template, set logo, address, phone, email, website, footer (optional). Define print margins; multi-page prescriptions use same margins (content flows in margin box).
- **Prescription print:** Prescription view/print: render within configured margins; multi-page continue same margins. Include unique QR code (e.g. link to portal + prescription id or token). Patient scans QR → login (national ID + phone 2FA) → see that prescription and related digital records.
- **Patient 2FA:** Auto-generated or manual link: patient identifies with national ID (Citizen ID, National ID, SSN, etc.) and contact number; send OTP or magic link for 2FA; then access personal medical records (prescriptions, appointments, etc.). Enforce that only the patient (matching national ID + phone) can access.
- **APIs:** GET/PATCH tenant branding (letterhead, template, margins, footer). GET prescription print payload (for QR). Patient auth: POST /api/portal/verify or similar (national ID + phone → send OTP); POST verify OTP → session; GET patient records.
- **UI:** Settings → Letterhead & printing: upload letterhead or choose template; set logo, address, phone, email, website, footer; set margins (mm). Prescription detail: “Print” button → print view with margins + QR. Portal: entry point from QR (e.g. /portal/verify?p=...) with national ID + phone + 2FA.
- **Deliverables:** Schema + migration (tenant_branding, prescription number, patient national ID fields, portal auth); letterhead/template UI; print view with margins and QR; patient 2FA flow and portal access. Document in `website/LETTERHEAD-AND-PRESCRIPTION-PRINT.md`.

---

## 7.6 MR number & printing (wrist bands, labels, stickers, printers)

**Scope:** MR Number (patient) used for identification and labelling. Print wrist bands, barcodes, stickers for vials/petri dishes/samples, medication envelopes. Support Zebra, Brother, thermal and large-format printers.

- **Schema:**
  - **patients:** Add mrNumber (varchar, unique per tenant), generated on create (e.g. tenant prefix + sequence or year + sequence). Migration.
  - Optional: **print_jobs** or **label_templates** for audit: tenantId, type (wrist_band, barcode, vial_label, etc.), payload (JSONB), printedAt, printedBy.
- **Label types (generated from MR + context):**
  - Wrist band: MR + patient name + DOB or date.
  - IVF lab: MR barcode only; or MR + date + name.
  - Stickers: vials, petri dishes, sample bottles (MR + optional date, type).
  - Medication envelope: MR + patient name + prescription/date.
- **Print options:** User selects label type and optional variants (e.g. wrist band with/without barcode). Generate content (text + barcode if needed). Support:
  - **Zebra (ZPL):** Emit ZPL for label printers.
  - **Brother:** Brother label format or generic.
  - **Generic thermal:** Simple text/barcode for thermal receipt-style.
  - **Large format:** PDF or large label for standard printers (A4/letter).
- **APIs:** GET /api/app/patients/[id]/mr (return MR number, barcode payload if needed). POST /api/app/print/label (body: type, patientId, variant, printerType zebra|brother|thermal|pdf) → returns ZPL, PDF, or HTML for print. Optional: store print job for audit.
- **UI:** Patient detail or dedicated “Print labels”: dropdown “Label type” (Wrist band, IVF lab barcode, Vial label, Sample bottle, Medication envelope, etc.). “Printer type”: Zebra, Brother, Thermal, PDF (preview/download). Preview where possible; “Print” or “Download ZPL/PDF”. Nav: under Patients or shared “Print” in app.
- **Deliverables:** Schema + migration (mrNumber on patients, optional print_jobs); MR generation on patient create; label types and payloads; ZPL/Brother/thermal/PDF generation; APIs; UI for label type + printer selection and print/download. Document in `website/MR-PRINTING-AND-LABELS.md`.

---

## Execution

- **One agent per section (7.1–7.6).** Run in parallel where possible. Dependencies: 7.2 (formulary) before or with prescriptions; 7.5 may reference 7.2 (prescription print). 7.6 (MR) can add mrNumber to patients—coordinate migration if another agent adds patient columns.
- **Order suggestion:** 7.1 (PGT/PGS), 7.4 (SMS), 7.6 (MR + labels) can run first. 7.2 (formulary + prescriptions), 7.3 (ICD-11), 7.5 (letterhead + QR + 2FA) may touch patients/tenants—merge migrations carefully.
- After each: merge, run migrations, update `next-steps-development.md`. Document each feature in the referenced `website/*.md` files.
