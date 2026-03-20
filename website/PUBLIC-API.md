# Public & integration-facing HTTP API (catalog)

This catalog lists routes that are useful for **integrations**, **automation**, or **public** clients. Tenant-scoped app APIs under `/api/app/*` require an authenticated staff session unless noted; many also accept **API keys** where implemented (see `/app/developers` and `API-MARKETPLACE.md`).

> **Versioning:** APIs are currently unversioned (`/api/...`). For external partners, prefer documenting stable subsets here and adding `/api/v1/...` aliases when breaking changes are introduced.

## Public (no session)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tenant-by-slug?slug=` | Resolve a tenant by subdomain slug; returns safe metadata (e.g. id, name, slug, default currency). |
| `GET` | `/api/public/geo/countries` | Country list with ISO2, name, flag emoji, dial code (rate-limited per IP). Used by `/register` and can be reused by marketing forms. |
| `GET` | `/api/public/geo/states?country=XX` | Subdivisions for ISO2 country (rate-limited). |
| `GET` | `/api/public/geo/cities?country=XX&state=STATE_ISO` | Cities for country + state (capped list; rate-limited). |
| `POST` | `/api/landing/trial-request` | Marketing trial / contact capture (validate body in route). |
| `POST` | `/api/auth/register-clinic` | Self-service clinic + admin creation after email verification (rate-limited per IP; see `SECURITY-AND-COMPLIANCE.md`). |

## Webhooks (signed / secret)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/webhooks/stripe` | Stripe events; requires Stripe signature verification (`STRIPE_WEBHOOK_SECRET`). |

## Internal / scheduled (secret header or query)

These are **not** for third-party callers unless you expose them deliberately:

| Method | Path | Auth |
|--------|------|------|
| `GET`/`POST` | `/api/cron/send-appointment-reminders` | `CRON_SECRET` via query `?secret=` or header (see route implementation). |

## Super admin (staff session, `super_admin` role)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/app/super/promotion-codes` | List platform checkout promotion codes (Stripe ids + metadata). |
| `POST` | `/api/app/super/promotion-codes` | Create coupon + promotion code in Stripe and DB. |
| `PATCH` | `/api/app/super/promotion-codes/[id]` | Body `{ "active": false }` to deactivate. |

## Authenticated staff (`/api/app/*`)

Typical patterns:

- **Session cookie** after login at `www.thefertilityos.com` (tenant routing via subdomain).
- **API keys** (where enabled): created in **App → Developers**; send as agreed in your integration (see in-app docs).

Notable integration surfaces:

- **API keys:** `GET/POST /api/app/api-keys`, `DELETE /api/app/api-keys/[id]`
- **Patients, appointments, billing, lab, reports:** under `/api/app/...` — audit logging applies to sensitive operations.

## Portal (patient)

Patient portal routes live under `/api/portal/*`; most require patient session or magic-link flows. See `PATIENT-PORTAL-PASSWORD.md` and `SECURITY-AND-COMPLIANCE.md`.

## Security expectations for integrators

- Use **HTTPS** only in production.
- Store **API keys and webhook secrets** in a vault; rotate on compromise.
- Respect **rate limits** on public endpoints (geo, registration, auth).
- Do not log **PHI** in client or proxy logs.

## Related docs

- `API-MARKETPLACE.md` — product integrations catalog (`/integrations`).
- `SSO-OAUTH.md` — Google / Microsoft sign-in for staff.
- `SECURITY-AND-COMPLIANCE.md` — headers, rate limits, audit, data handling.
- `STRIPE-SETUP.md` — billing webhooks and Checkout.
