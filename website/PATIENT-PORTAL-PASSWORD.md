# Patient portal password (Phase 10.1)

Patients can sign in to the portal in two ways:

1. **Magic link** — Enter email on `/portal/login`, receive a one-time link by email (24h expiry). No password required.
2. **Email + password** — If the patient has set a password, they can sign in with email and password on the same login page (toggle "Password" tab).

## Setting a password

- **From the portal (when already signed in):** Go to **Profile**. Use "Email me a link to set my password". The email contains a link to `/portal/set-password?token=...` (24h expiry). After setting a password, they can use "Password" sign-in next time.
- **Forgot password:** On the login page, choose the "Password" tab, enter email, and click "Forgot password?". They receive a link to `/portal/reset-password?token=...` (1h expiry).

## Technical details

- **Schema:** `patients.password_hash` (nullable). Table `patient_password_tokens` stores one-time tokens (type `set` | `reset`, expiry, `used_at`).
- **Auth:** NextAuth Credentials provider `portal-password` looks up patient by email, verifies `bcrypt` hash, returns same session shape as magic-link sign-in. Rate limiting uses the same auth rate limiter (10 attempts per 15 min per IP:email).
- **APIs:**
  - `POST /api/portal/forgot-password` — body `{ email }` — creates reset token, sends email. Always returns same message (no email enumeration).
  - `POST /api/portal/set-password` — body `{ token, password }` — validates token, updates `patients.password_hash`, marks token used.
  - `POST /api/portal/send-set-password-link` — requires patient session — creates set token, sends email.

## Multi-tenant note

Patient lookup by email does not currently filter by tenant (same as magic-link flow). If you need tenant-scoped login (e.g. subdomain or tenant slug), extend the login form and APIs to pass tenant context and filter by it.
