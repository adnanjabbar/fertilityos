# SSO, Email Verification & Phone Verification Plan

## Goals

- **Clinic signup**: SSO (Google, Apple, Microsoft) or custom email → email verification → detailed signup form → **phone verification (6-digit OTP via WhatsApp/SMS)** → account ready.
- **Staff invites**: After accepting invite (set name/password or SSO), **verify phone** via 6-digit OTP (WhatsApp or SMS) before first app access.
- **Patient phone**: When a patient has a phone number on file, **verify it** with 6-digit OTP (WhatsApp or SMS); mark as verified; use for portal 2FA and secure communications. *(Portal OTP flow already exists; this extends it to “verified phone” on the record.)*
- **HIPAA alignment**: Strong identity (SSO + verified email + verified phone), audit trail, and access controls.

---

## Current State

| Area | Current | Gap |
|------|---------|-----|
| **Auth** | NextAuth with Credentials only (email + password) | No SSO (Google/Apple/Microsoft) |
| **Clinic registration** | Single form: clinic details + admin email/password → create tenant + user | No email verification; no phone verification |
| **Staff** | Invite by email → accept-invite (set name + password) | No phone verification |
| **Patient portal** | National ID + phone + prescription → send OTP via SMS → verify-otp | OTP already sent via Twilio SMS; no “verified phone” flag on patient |
| **SMS/WhatsApp** | Twilio (SMS + optional WhatsApp), Meta Cloud API (WhatsApp); tenant-level config | Reuse for all OTP flows |

---

## Recommendations

### 1. SSO (Google, Apple, Microsoft) + Email

- **Add OAuth providers** in NextAuth for Google and Microsoft. Apple Sign In requires Apple Developer account and is more involved; can be Phase 2.
- **Custom email** remains: keep Credentials provider; optionally add “magic link” (passwordless) via email later.
- **Email verification**: For **custom email signup**, send a verification link or 6-digit code to email before treating the account as verified. For **SSO**, the provider already attests the email (consider marking “email_verified” from provider).
- **Flow**:  
  - **Option A (recommended for clinic signup)**: Step 1 – Choose “Sign up with Google/Microsoft/Email”. If email → enter email → send verification code/link → verify. Step 2 – Collect clinic + admin details (detailed form). Step 3 – Collect admin phone → send 6-digit OTP (WhatsApp or SMS) → verify. Step 4 – Create tenant + user, redirect to login.  
  - **Option B**: Same but move “detailed form” after first login (post-signup onboarding). Easiest to ship: keep current single-page register; add “Verify email” and “Verify phone” steps before or after submit.

### 2. Phone Verification (6-digit OTP)

- **Single OTP pipeline**: Reuse existing Twilio SMS and tenant WhatsApp (from Integrations). Add a small **send OTP** API that:
  - Accepts `phone`, `context` (e.g. `admin_signup`, `staff_invite`, `patient_verify`), and optional `tenantId` (for staff/patient) or no tenant (admin signup).
  - Generates 6-digit code, stores in DB with expiry (e.g. 10 min), sends via **SMS** or **WhatsApp** (tenant preference or fallback: SMS).
- **Admin registration**: Before creating the clinic, ask for phone → send OTP → user enters code → then create tenant + user. Store verified phone on user or tenant.
- **Staff invite**: After accept-invite (password or SSO), require phone → send OTP → verify → set `user.phoneVerifiedAt` (or similar) and allow app access.
- **Patient**: When adding/editing a patient with a phone number, show “Verify phone”. Send OTP (WhatsApp or SMS using tenant config); on success set `patient.phoneVerifiedAt`. Portal 2FA and reminders can prefer verified numbers.

### 3. Database / Schema

- **Users**: Add `phone` (varchar), `phoneVerifiedAt` (timestamp), optionally `emailVerifiedAt` if you track it separately from SSO.
- **Tenants**: Optional `adminPhoneVerifiedAt` or rely on first user’s `phoneVerifiedAt`.
- **Patients**: Add `phoneVerifiedAt` (timestamp). Keep existing `patient_otp_codes` for portal; optionally add a generic `otp_codes` table (entity_type: user / patient, entity_id, phone, code, expires_at, context) for all flows.

### 4. HIPAA-Oriented Security

- **Identity**: SSO + verified email + verified phone gives strong identity and reduces phishing/password reuse.
- **Audit**: Log all verification events (email sent/verified, OTP sent/verified, provider used) in `audit_logs` with action e.g. `auth.email_verification_sent`, `auth.phone_verification_succeeded`.
- **Access**: Keep tenant-scoped sessions and role-based access; add “phone verified” as a gate for sensitive actions or for staff before first app access.
- **BAA**: Ensure Twilio (and any email/SSO provider) is covered under a BAA where required.

---

## Phased Implementation

### Phase 1 – Foundation (recommended first)

1. **OTP service**
   - Create `POST /api/auth/send-otp` (phone, context, tenantId?) and `POST /api/auth/verify-otp` (phone, code, context).
   - Use existing `sendSms` and WhatsApp helpers; add a generic `otp_codes` table or reuse/extend `patient_otp_codes` for non-patient contexts.
2. **Patient phone verification**
   - Add `phone_verified_at` to patients (migration).
   - In patient add/edit UI: “Verify phone” button → send OTP (WhatsApp or SMS) → user enters code → set `phoneVerifiedAt`. Show badge “Verified” when set.
3. **Audit**
   - Log OTP sent/verified and (when added) email verification events.

### Phase 2 – Clinic signup with email + phone verification

1. **Email verification (custom email only)**
   - On register: after user enters email, send 6-digit code (or link) to email; require code before proceeding to clinic details.
   - Add `email_verification_codes` table or use existing pattern; store `emailVerifiedAt` on user when created.
2. **Phone verification on signup**
   - After clinic + admin details (or after email verify), collect admin phone → send OTP → verify → then create tenant + user. Store phone and `phoneVerifiedAt` on user.
3. **UI**
   - Register flow: Step 1 – Sign up with Google/Microsoft or Email. If email: enter email → verify email. Step 2 – Clinic details + admin name. Step 3 – Admin phone → verify OTP. Step 4 – Create account, redirect to login.

### Phase 3 – SSO providers

1. **NextAuth**
   - Add Google and Microsoft OAuth providers; configure in dashboard (Google Cloud, Azure AD).
   - On SSO sign-in for **existing** user: allow login as today. On SSO sign-in for **new** user (e.g. register flow): create account and optionally require “complete profile” (phone verify, clinic details for new tenant).
2. **Linking**
   - Allow “Link Google/Microsoft” in settings for users who signed up with email, so they can later use SSO.
3. **Apple**
   - Add Apple Sign In (Phase 3b) when Apple Developer setup is ready.

### Phase 4 – Staff invite phone verification

1. **After accept-invite**
   - Before redirect to app, show “Verify your phone” → send OTP (WhatsApp or SMS using tenant integrations) → verify → set `user.phoneVerifiedAt`, then redirect.
2. **Optional**
   - Enforce “phone verified” in middleware for first-time staff (redirect to /app/verify-phone until done).

### Phase 5 – Polish and HIPAA

- Prefer WhatsApp for OTP when tenant has it configured (better deliverability and UX in many regions).
- Rate-limit OTP send by phone + context (e.g. max 3 per 15 min per phone).
- Document SSO, email verification, and phone verification in compliance/security docs and update HIPAA checklist.

---

## Technical Notes

- **NextAuth**: For OAuth, use `NextAuth.providers.Google`, `NextAuth.providers.Microsoft` (or Azure AD). Store provider and provider account id on user for linking.
- **Send OTP**: Reuse `lib/sms.ts` and `lib/whatsapp.ts`; add a small wrapper that picks WhatsApp vs SMS by tenant settings (or default SMS for pre-tenant admin signup if you use a system Twilio number).
- **Patient OTP**: Portal already uses `patient_otp_codes` and `sendSms`; extend to support WhatsApp from tenant config and set `patients.phoneVerifiedAt` on success when desired.

---

## Summary

- **SSO**: Add Google and Microsoft (then Apple) for signup and login; keep custom email with optional verification.
- **Email verification**: For email signup, verify before completing registration (code or link).
- **Phone verification**: Single OTP flow (WhatsApp or SMS) for admin signup, staff invite, and patient phone; store verified timestamp; reuse existing Twilio/WhatsApp integration.
- **HIPAA**: Strong identity (SSO + verified email + phone), audit all verification events, BAA with providers, and document in compliance checklist.

Implementing Phase 1 (OTP service + patient phone verification + audit) gives immediate security and UX benefit and unblocks Phase 2 (clinic signup verification) and Phase 4 (staff verify phone).

---

## Compliance checklist (implementation reference)

This section documents what is implemented (or planned) for compliance and security documentation.

### (a) Email verification at clinic registration

- **Table**: `verified_emails` — stores email + context + `verifiedAt` / `usedAt` for one-time use.
- **Context**: `clinic_register` — used during clinic registration to verify the admin’s email before completing signup.
- **Flow**: 6-digit code sent to email via `email_verification_codes`; on success a row is written to `verified_emails` and consumed when the clinic is created.
- **Rate limit**: Max 3 sends per email + context per 15 minutes; user-facing message includes “try again in X minutes”.

### (b) Phone verification (OTP)

- **Use cases**: Admin signup, staff invite, and patient phone verification.
- **Delivery**: 6-digit OTP via WhatsApp (when tenant has it configured) or SMS (Twilio); see `lib/otp.ts`, `lib/sms.ts`, `lib/whatsapp.ts`.
- **Storage**: `otp_codes` table (phone, context, code, expires_at, tenant_id). Contexts: `admin_signup`, `staff_invite`, `patient_verify`.
- **Rate limit**: Max 3 sends per phone + context per 15 minutes; error message: “Too many attempts. Please try again in X minutes.”
- **Expiry**: Codes expire after 10 minutes.

### (c) SSO and account linking

- **Providers**: Google and Microsoft (OAuth via NextAuth). Apple Sign In can be added later.
- **Linking**: `user_accounts` table stores provider (e.g. `google`, `microsoft`) and provider account id per user for SSO sign-in and “Link Google/Microsoft” in settings.
- **Flow**: New users can sign up with SSO or email; existing email users can link a provider for passwordless login.

### HIPAA / security considerations

- **Identity assurance**: Verified email (at clinic registration) and verified phone (admin signup, staff invite, patient) support strong identity and reduce phishing and account takeover risk.
- **Audit trails**: Verification events (email/OTP sent and verified) should be logged in `audit_logs` (e.g. `auth.email_verification_sent`, `auth.phone_verification_succeeded`) for compliance reviews and incident response.
- **Access control**: Phone verification can gate sensitive actions and first-time staff app access; tenant-scoped sessions and RBAC remain in place.
- **BAA**: Ensure email (e.g. SendGrid/Resend), SMS/WhatsApp (e.g. Twilio, Meta), and SSO providers are covered under BAAs where they process PHI or support authentication.
