# Security and Compliance Hardening (Phase 9.4)

This document describes security measures and compliance-related behavior in FertilityOS.

## Rate Limiting

- **Auth (credentials sign-in):** In-memory rate limit per identifier `IP:email`. After **10 failed or successful attempts** in a **15-minute** window, further attempts return “Too many sign-in attempts. Try again in 15 minutes.”
- **OTP send:** Rate limit per `IP:phone:context`. **5 requests** per 15-minute window per identifier. Exceeding returns HTTP **429** with message “Too many OTP requests. Try again in 15 minutes.”

Implementation: `lib/rate-limit.ts` (in-memory store). For multi-instance or serverless deployments, replace with a shared store (e.g. Redis, Vercel KV) and use the same key scheme and limits.

## HTTP Security Headers

Set globally via `next.config.ts`:

- **X-Content-Type-Options:** `nosniff`
- **X-Frame-Options:** `DENY`
- **Referrer-Policy:** `strict-origin-when-cross-origin`
- **Content-Security-Policy:** Restricts scripts, styles, fonts, images, and connections to allowed origins; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'`. Scripts allow `'unsafe-inline'` and `'unsafe-eval'` for Next.js; tighten if you move to strict nonce-based CSP.

## Audit Log for Sensitive Reads

- **Patient list:** When the patient list API (`GET /api/app/patients`) returns **more than 50** patients, an audit entry is written:
  - **Action:** `patient_list_view`
  - **Entity type:** `patient`
  - **Details:** `{ count, query }`
  - **IP** and **user** are recorded.

Other sensitive actions (e.g. export, bulk operations) should be wired to `logAudit` in the same way. See `lib/audit.ts` and existing usage in patient create/update, invitations, and auth.

## Data Retention and Deletion

- **Retention:** Clinical and operational data are retained according to tenant and jurisdictional requirements. FertilityOS does not auto-delete patient or audit data by default.
- **Deletion:** Admins can delete patients (and related data) from the app; this should be done in line with clinic policy and legal obligations. Audit logs may be retained for compliance even after related entity deletion.
- **GDPR-style rights (optional):**
  - **Export my data:** Can be implemented for the patient portal by aggregating the patient’s own profile, appointments, invoices, and documents into a downloadable package (e.g. JSON or PDF).
  - **Delete my data:** Can be implemented as a request flow (e.g. request form + admin approval and execution) that deletes or anonymizes the patient record and linked PII, again subject to retention of audit or legally required data.

## Outbound Email and Branding

- All outbound emails (campaigns, reminders, notifications) should use the platform footer with “FertilityOS” (gradient) linking to **https://www.thefertilityos.com** when in platform mode, as specified in Phase 8 and product branding.

## Optional Hardening (Future)

- **IP allowlist:** Restrict admin or super-admin access by IP (e.g. in middleware or auth checks).
- **Stricter CSP:** Move to nonce- or hash-based `script-src` and remove `'unsafe-inline'` / `'unsafe-eval'` where possible.
- **Redis-backed rate limiting:** For production at scale, use a shared store so limits apply across instances and serverless invocations.

## References

- [Phase 9 handoff](../System-Architecture/Planning/phase-9-handoff.md)
- [Audit log](./lib/audit.ts)
- [Rate limit](./lib/rate-limit.ts)
