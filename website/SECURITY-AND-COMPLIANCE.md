# Security and Compliance Hardening (Phase 9.4)

This document describes security measures and compliance-related behavior in FertilityOS.

## Rate Limiting

- **Auth (credentials sign-in):** In-memory rate limit per identifier `IP:email`. After **10 failed or successful attempts** in a **15-minute** window, further attempts return “Too many sign-in attempts. Try again in 15 minutes.”
- **OTP send:** Rate limit per `IP:phone:context`. **5 requests** per 15-minute window per identifier. Exceeding returns HTTP **429** with message “Too many OTP requests. Try again in 15 minutes.”
- **Clinic self-registration:** `POST /api/auth/register-clinic` is limited to **10 requests per client IP per hour** at the start of the handler (`rateLimitRegister`), including failed validation. Returns **429** when exceeded.
- **Public geography APIs:** `GET /api/public/geo/*` are limited to **200 requests per client IP per 15 minutes** (`rateLimitPublicGeo`) to reduce scraping while allowing registration UIs.

Implementation: `lib/rate-limit.ts` (in-memory store). For multi-instance or serverless deployments, replace with a shared store (e.g. Redis, Vercel KV) and use the same key scheme and limits.

## HTTP Security Headers

Set globally via `next.config.ts`:

- **X-Content-Type-Options:** `nosniff`
- **X-Frame-Options:** `DENY`
- **Referrer-Policy:** `strict-origin-when-cross-origin`
- **Permissions-Policy:** Restricts powerful features by default (e.g. `camera=(self)`, `microphone=(self)` for telemedicine embeds; `geolocation=()`, `payment=()`). Adjust if you add payment or location features in first-party pages.
- **Content-Security-Policy:** Restricts scripts, styles, fonts, images, and connections to allowed origins; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'`. Scripts allow `'unsafe-inline'` and `'unsafe-eval'` for Next.js; tighten if you move to strict nonce-based CSP.

## Audit Log for Sensitive Reads

- **Patient list:** When the patient list API (`GET /api/app/patients`) returns **more than 50** patients, an audit entry is written:
  - **Action:** `patient_list_view`
  - **Entity type:** `patient`
  - **Details:** `{ count, query }`
  - **IP** and **user** are recorded.

Other sensitive actions (e.g. export, bulk operations) should be wired to `logAudit` in the same way. See `lib/audit.ts` and existing usage in patient create/update, invitations, and auth.

- **Clinic self-registration:** On successful `POST /api/auth/register-clinic`, an audit row is written on the new tenant: action `clinic_self_registered`, entity `tenant`, with slug and country code in details (no passwords).

## Data Retention and Deletion

- **Retention:** Clinical and operational data are retained according to tenant and jurisdictional requirements. FertilityOS does not auto-delete patient or audit data by default.
- **Deletion:** Admins can delete patients (and related data) from the app; this should be done in line with clinic policy and legal obligations. Audit logs may be retained for compliance even after related entity deletion.
- **GDPR-style rights (implemented):**
  - **Export my data:** Implemented in the patient portal. Patients can request a download of their data (profile, appointments, invoices, prescriptions) via "Export my data"; API `GET /api/portal/export-my-data` returns a JSON attachment. Exports can optionally be audit-logged.
  - **Delete my data:** Implemented as a request flow. The patient can submit "Request account deletion" in the portal; this creates a record in `patient_data_requests` (type: delete, status: pending). Clinic staff see pending requests in the app (e.g. Settings > Data requests) and can mark them completed. Actual deletion or anonymization is done by staff per clinic policy (see admin patient deletion in the app).

## Outbound Email and Branding

- All outbound emails (campaigns, reminders, notifications) should use the platform footer with “FertilityOS” (gradient) linking to **https://www.thefertilityos.com** when in platform mode, as specified in Phase 8 and product branding.

## Optional Hardening (Future)

- **IP allowlist:** Restrict admin or super-admin access by IP (e.g. in middleware or auth checks).
- **Stricter CSP:** Move to nonce- or hash-based `script-src` and remove `'unsafe-inline'` / `'unsafe-eval'` where possible.
- **Redis-backed rate limiting:** For production at scale, use a shared store so limits apply across instances and serverless invocations.

## References

- [Phase 9 handoff](../System-Architecture/Planning/phase-9-handoff.md)
- [SSO / OAuth](./SSO-OAUTH.md)
- [Public API catalog](./PUBLIC-API.md)
- [Audit log](./lib/audit.ts)
- [Rate limit](./lib/rate-limit.ts)
