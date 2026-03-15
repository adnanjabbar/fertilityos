# Letterhead & Prescription Print (Phase 7.5)

This document describes the letterhead, prescription printing with QR code, and patient portal 2FA (national ID + phone + OTP) features.

## Overview

- **Tenant branding:** Clinic letterhead image, logo, template choice, print margins (mm), and footer (address, phone, email, website, optional text).
- **Prescription print:** Printable prescription view with configured margins and a unique QR code linking to the patient portal verify flow.
- **Patient 2FA:** Patients can sign in via the QR link using national ID type + value + phone; they receive an OTP by SMS and then access their records (prescriptions, appointments, profile, invoices).

## Schema

- **tenant_branding:** One row per tenant. Fields: `letterhead_image_url`, `use_letterhead_template`, `template_slug`, `margin_top_mm`, `margin_bottom_mm`, `margin_left_mm`, `margin_right_mm`, `footer_address`, `footer_phone`, `footer_email`, `footer_website`, `footer_text`, `logo_url`.
- **prescriptions:** Added `prescription_number` (varchar, unique per tenant). Assigned automatically on create (numeric sequence per tenant).
- **patients:** Added `national_id_type` (e.g. `national_id`, `ssn`, `citizen_id`, `other`) and `national_id_value` for 2FA identification.
- **patient_otp_codes:** Stores OTP for portal 2FA: `patient_id`, `phone`, `code`, `expires_at`. Deleted after successful verify.

Migrations: `0024_letterhead_prescription_portal_2fa.sql`. Register in `scripts/run-migrations.js`.

## Configuration / Environment

- **NEXTAUTH_URL** (or **VERCEL_URL**): Base URL used for portal verify links and QR code payload. Set in production so QR codes point to the correct domain.
- **SMS (OTP):** Uses the same Twilio integration as SMS reminders. Set **TWILIO_ACCOUNT_SID**, **TWILIO_AUTH_TOKEN**, and **TWILIO_PHONE_NUMBER** (or **TWILIO_PHONE**) in `.env`. If not set, OTP is logged to console (stub) and the API may still return success for local testing.

No other env or config is required for letterhead or print margins; they are stored per tenant in `tenant_branding`.

## App: Letterhead & printing (Settings)

- **Route:** `/app/settings/letterhead` (admin only).
- **API:** `GET /api/app/branding`, `PATCH /api/app/branding`.
- **UI:** Upload letterhead image URL (or use template), set logo URL, footer (address, phone, email, website, optional text), and print margins in mm. Multi-page prescriptions use the same margins.

## Prescription print

- **Route:** `/app/prescriptions/[id]/print`. Opened from patient detail → Prescriptions → “Print” on a prescription.
- **Behavior:** Renders prescription within the tenant’s configured margins; shows letterhead/logo, prescription details, lines (formulary or protocol), and a QR code. The QR code links to `/portal/verify?p=<prescriptionId>` so the patient can scan and start the 2FA flow.
- **QR payload:** URL only (e.g. `https://your-domain.com/portal/verify?p=uuid`). Patient scans → browser opens verify page with `p` set.

## Patient 2FA (portal verify)

- **Entry:** `/portal/verify?token=...` (magic link, existing flow) or `/portal/verify?p=prescriptionId` (from QR).
- **Flow when `p` is present:**
  1. User enters national ID type, national ID value, and phone (must match the patient record for that prescription’s tenant).
  2. `POST /api/portal/verify` with `nationalIdType`, `nationalIdValue`, `phone`, `prescriptionId` → backend finds patient, creates OTP, sends SMS, returns `verificationId`.
  3. User enters the 6-digit code.
  4. `POST /api/portal/verify-otp` with `verificationId`, `code` → backend validates, creates a one-time portal token, returns `redirectUrl` (e.g. `/portal/verify?token=...`) or `token`.
  5. Client redirects to `/portal/verify?token=...` → existing magic-link provider signs the user in → redirect to `/portal`.

Only the patient matching the given national ID and phone for that prescription’s tenant can complete the flow and see their records.

## Portal: Patient records

- **Prescriptions:** `GET /api/portal/prescriptions` (list) or `GET /api/portal/prescriptions?id=<id>` (single). Requires portal session (`patientId`).
- **Appointments:** Existing `GET /api/portal/appointments`.
- **Profile / Invoices:** Existing portal pages.

Portal nav includes “Prescriptions”; dashboard links to Prescriptions and other sections.

## Patient demographics (app)

- In patient detail (edit form): **Phone**, **National ID type**, **National ID value**. Required for 2FA when the patient uses the prescription QR link. Shown in read-only summary when set.

## Dependencies

- **qrcode:** Used on the server to generate the QR data URL for the print view.
- **Twilio:** Optional; used for sending OTP by SMS when configured.
