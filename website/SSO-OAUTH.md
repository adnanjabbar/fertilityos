# SSO / OAuth (Google & Microsoft Azure AD)

FertilityOS uses [Auth.js](https://authjs.dev/) with optional **Google** and **Microsoft Azure AD** providers for staff sign-in. This document is for operators and future integrators.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Required. Session encryption secret (`openssl rand -base64 32`). |
| `AUTH_URL` | Production canonical origin (e.g. `https://www.thefertilityos.com`). |
| `AUTH_TRUST_HOST` | Set `true` behind proxies when the host header must be trusted. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client credentials. |
| `AUTH_MICROSOFT_ID` / `AUTH_MICROSOFT_SECRET` | Azure AD app registration client ID and secret. |
| `AUTH_MICROSOFT_TENANT_ID` | Optional. Defaults to multi-tenant `common`; use your tenant ID for single-tenant only. |
| `NEXT_PUBLIC_OAUTH_GOOGLE` | Set to `1` to show **Sign in with Google** on `/login`. |
| `NEXT_PUBLIC_OAUTH_MICROSOFT` | Set to `1` to show **Sign in with Microsoft** on `/login`. |

Never commit real secrets; use `.env.example` placeholders only.

## Redirect URLs (OAuth consoles)

Register these **exact** callback URLs in Google Cloud Console and Azure AD:

- `https://www.thefertilityos.com/api/auth/callback/google`
- `https://www.thefertilityos.com/api/auth/callback/azure-ad`

For local development, add the same path on `http://localhost:3000` (or your dev port).

## How sign-in works

1. User chooses Google or Microsoft on `/login`.
2. IdP returns a verified email (and name).
3. **`getOrCreateOAuthUser`** (`lib/auth-oauth.ts`):
   - If `(provider, providerAccountId)` already exists in `user_accounts` → sign in as that user.
   - Else if a user with the same **email** exists → link the OAuth account to that user and sign in.
   - Else → create a **new** user on a **placeholder tenant** (`name: "OAuth User"`, random slug) with role `staff`.

## Recommended practice (clinics)

- **Primary path:** Complete **clinic registration** (`/register`) or **staff invitation** so users exist in the correct tenant with the right role.
- **OAuth:** Use Google/Microsoft for **day-to-day login** on accounts that already exist; email matching will link the IdP to the invited user.
- **Avoid** relying on the automatic “new OAuth user + placeholder tenant” path for production clinics — it is a safety net for development and edge cases.

## Clinic registration vs SSO

- New clinics today register with **verified email + password** on `/register` (see `POST /api/auth/register-clinic`).
- **SSO-only clinic provisioning** (creating a tenant from an IdP assertion without a separate registration step) is a larger product/API change and is **not** required for secure staff login once invitations + OAuth linking are used.

## Two-factor authentication (2FA)

**Planned after SSO** is stable: add TOTP or WebAuthn as a second factor for sensitive roles (e.g. admin, super_admin). Until then, enforce strong passwords (`validateStaffPassword`) and IdP-level MFA where organizations use Google/Microsoft with MFA enforced.

## References

- `auth.ts` — provider configuration and session callbacks.
- `lib/auth-oauth.ts` — account resolution and linking.
- `app/login/LoginForm.tsx` — OAuth buttons (gated by `NEXT_PUBLIC_*` flags).
