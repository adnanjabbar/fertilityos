# MR Number & Label Printing (Phase 7.6)

This document describes the Medical Record (MR) number and label printing feature: wrist bands, IVF lab barcodes, vial/sample labels, and medication envelopes, with support for Zebra (ZPL), Brother, generic thermal, and PDF/large-format printers.

---

## Schema

### Patients: MR number

- **Column:** `patients.mr_number` (varchar 64, nullable, unique per tenant).
- **Uniqueness:** Unique index on `(tenant_id, mr_number)` so each tenant has no duplicate MRs.
- **Generation:** Assigned when a new patient is created via the API. Format: `PREFIX-YY-NNNN` (e.g. `CLINIC-25-0001`).
  - **PREFIX** is derived from the tenant’s `slug` (alphanumeric, up to 8 characters), or `"MR"` if no slug.
  - **YY** is the 2-digit year at creation time.
  - **NNNN** is a 4-digit sequence number per tenant (and prefix+year).
- **Migration:** `0023_mr_number_and_print_jobs.sql` adds the column, creates the unique index, backfills existing patients with MRs, and creates the `print_jobs` table.

### Print jobs (audit)

- **Table:** `print_jobs`
  - `id`, `tenant_id`, `type` (varchar 64), `payload` (JSONB), `printed_at`, `printed_by_id` (FK users), `created_at`.
- Used to record each label print (optional per request) for audit.

---

## Label types

| Type                  | Content                                                                 | Use case                          |
|-----------------------|-------------------------------------------------------------------------|-----------------------------------|
| **Wrist band**        | MR + patient name + DOB (optional barcode)                             | Patient identification            |
| **IVF lab barcode**   | MR barcode + MR + name + date                                         | Lab workflow                      |
| **Vial label**        | Type (e.g. “Vial”) + MR barcode + MR + date                            | Vials / small containers          |
| **Sample bottle**     | Type (e.g. “Sample”) + MR barcode + MR + date                          | Sample bottles                    |
| **Medication envelope** | MR + name + prescription/date + barcode                             | Medication packaging              |

Variants:

- **With barcode:** Include Code 128 barcode (where supported).
- **Text only:** Text only (used for wrist band variant).

---

## Printer types & output

| Printer type   | Output        | Typical use                          |
|----------------|---------------|--------------------------------------|
| **Zebra**      | ZPL (application/zpl) | Zebra label printers (e.g. ZD series) |
| **Brother**    | ZPL           | Brother QL/label printers that accept ZPL |
| **Thermal**    | Plain text    | Generic thermal/receipt printers     |
| **PDF**        | HTML (text/html) | Browser print to PDF / large format |

### ZPL (Zebra) generation

- Labels use ZPL II: `^XA` … `^XZ`.
- **Text:** `^FO x,y ^A0N,height,width ^FD…^FS`
- **Code 128 barcode:** `^FO x,y ^BY2,2,50 ^BCN,height,Y,N,N ^FD…^FS`
- Character escaping is applied for `^`, `~`, `\` and control characters in field data.

### PDF / large format

- Output is HTML with print-friendly CSS. User can “Print” from the browser to save as PDF or send to a standard printer.
- Barcode is represented as a placeholder line (e.g. `|| MR-25-0001 ||`) when no client-side barcode library is used; for production PDF barcodes you can add a JS barcode generator or server-side image.

---

## APIs

### GET `/api/app/patients/[patientId]/mr`

- **Auth:** Tenant-scoped session required.
- **Response:** `{ mrNumber, barcodePayload, patientName }`.
- Use for displaying MR and for client-side barcode rendering if needed.

### POST `/api/app/print/label`

- **Auth:** Tenant-scoped session required.
- **Body (JSON):**
  - `type` (required): `wrist_band` | `ivf_lab_barcode` | `vial_label` | `sample_bottle` | `medication_envelope`
  - `patientId` (required): UUID
  - `variant` (optional): `with_barcode` | `text_only` (default `with_barcode`)
  - `printerType` (required): `zebra` | `brother` | `thermal` | `pdf`
  - `recordPrintJob` (optional): boolean (default `true`) — write to `print_jobs`
  - `prescriptionInfo` (optional): string — for medication envelope
  - `sampleType` (optional): string — for vial/sample (e.g. “Vial”, “Petri”)
- **Response:** Raw label content:
  - ZPL: `Content-Type: application/zpl`, filename in `Content-Disposition`
  - HTML: `Content-Type: text/html` (print or save as PDF)
  - Thermal: `Content-Type: text/plain`

---

## UI

- **Patient detail:** MR number is shown in the patient summary when present.
- **“Print labels” button:** Opens a modal with:
  - **Label type:** Wrist band, IVF lab barcode, Vial label, Sample bottle, Medication envelope.
  - **Printer type:** Zebra, Brother, Generic thermal, PDF.
  - **Preview:** For PDF, opens the HTML in a new tab for print/preview.
  - **Print / Download:** For PDF, “Print / Download PDF”; for Zebra/Brother/thermal, “Download ZPL/File” to save the generated file.

Navigation: available from the patient detail page only (no separate sidebar item required per spec; optional “Print” under Patients can link to a patient selector if desired later).

---

## Migration and run order

1. Run migrations (includes `0023_mr_number_and_print_jobs.sql`):
   ```bash
   cd website && node scripts/run-migrations.js
   ```
2. Existing patients receive backfilled MR numbers (tenant prefix + current 2-digit year + sequence).
3. New patients receive an MR on create via `generateNextMrNumber()` in the API.

---

## Files

- **Schema:** `db/schema.ts` — `patients.mrNumber`, `printJobs` table.
- **Migration:** `db/migrations/0023_mr_number_and_print_jobs.sql`.
- **MR generation:** `lib/mr.ts` — `generateNextMrNumber(tenantId)`.
- **Label generation:** `lib/labels.ts` — `generateLabel(type, printerType, data, variant)`.
- **APIs:** `app/api/app/patients/[patientId]/mr/route.ts`, `app/api/app/print/label/route.ts`.
- **UI:** Patient detail — MR display and “Print labels” modal in `app/app/patients/[patientId]/PatientDetailClient.tsx`.
