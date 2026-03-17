# Phase 10 — Patient Portal Password & Data Rights

**Prerequisite:** Phases 4–9 done. Patient portal exists (magic-link auth via `patient_portal_tokens`). Patients table has no password today.

**Goal:** Let patients sign in with email + password; support "Set password" and "Forgot password". Optionally add GDPR-style "Export my data" in the portal.

---

## 10.1 Patient portal password

- **Scope:** Add optional password for patients. When set, patients can sign in at `/portal/login` with email + password (in addition to magic link). New patients or invited patients get a "Set your password" flow (link from email or first-time after magic link). "Forgot password" sends a reset link (or OTP) to the patient's email.
- **Deliverables:**
  - Migration: add `password_hash` to `patients` (or separate `patient_credentials` table if you prefer not to touch patients). Prefer `patients.password_hash` for simplicity.
  - "Set password" flow: token-based (e.g. `patient_password_set_tokens` with expiry) or one-time link sent when staff invites patient to portal. Page e.g. `/portal/set-password?token=...`.
  - "Forgot password" flow: request by email → send reset link (e.g. `patient_password_reset_tokens` table, expiry 1h) → page `/portal/reset-password?token=...` to set new password.
  - NextAuth: add Credentials provider for patients (match email + tenant from session or from request body; verify password). Ensure portal login page can choose "Magic link" or "Password" or show both.
  - Document in `website/PATIENT-PORTAL-PASSWORD.md`.

---

## 10.2 Patient data export (GDPR-style)

- **Scope:** In the patient portal, add "Export my data" that generates a downloadable file (e.g. JSON or ZIP with JSON + PDF summary) containing the patient's profile, appointments, invoices (metadata and line items), and any other personal data the app stores. Optional: "Request account deletion" that creates a request record for clinic admin to process.
- **Deliverables:** API `GET /api/portal/export-my-data` (or POST that returns file); portal page or button that triggers download. Optional table `patient_data_requests` (type: export | delete, status: pending | completed). Document in `website/SECURITY-AND-COMPLIANCE.md` (already references export/delete).
- **Completed:** Done: export API, portal export + delete request UI, `patient_data_requests` table, admin list/complete UI, documented in `SECURITY-AND-COMPLIANCE.md`.

---

## Execution

- **Order:** 10.1 first (password), then 10.2 (export). Both can be done in one phase.
- Update `next-steps-development.md` when complete.
