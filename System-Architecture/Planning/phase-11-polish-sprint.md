# Phase 11 — Polish toward beta / finish line

**Goal:** Ship high-impact improvements without large new subsystems: search, financial visibility, super-admin operations UX, registration clarity.

## Delivered in this sprint

| Item | Notes |
|------|--------|
| **Tenant patient search** | `GET /api/app/patients?q=` now matches MR#, phone; ILIKE sanitization; default limit 100 (max 500). List shows MR# column; hint when capped at 100. |
| **Super cross-clinic patient search** | `GET /api/app/super/patient-search?q=` (super_admin only, min 2 chars, max 40 rows). Audited on system tenant: `super_admin.cross_tenant_patient_search` with query length + count only (no PHI in audit). UI: `/app/super/patient-search`. |
| **Reports financials** | Overview API adds `revenueOutstanding` and `unpaidInvoicesInPeriod` (unpaid invoices *created* in date range). Reports UI: two extra KPI cards. |
| **Super clinic map link** | All clinics table includes **Open** link to Google Maps from address + city + state + country + postal. |
| **Registration UX** | Visual 3-step progress on `/register`. |
| **Shared ILIKE helper** | `lib/ilike-sanitize.ts` used by super queries and patient list API. |
| **Super delete clinic** | `DELETE /api/app/super/tenants/:id` with JSON `{ confirmName }` (must match clinic name). Audited as `tenant_permanently_deleted` on **system** tenant. Stripe subscription canceled when configured. UI: **Delete** on All clinics table. |
| **Patient list API** | Paginated `{ patients, total, page, limit, totalPages }`; dropdowns use `loadAllPatientOptionsForSelect()`. |
| **Super rate limits** | In-memory: patient search (80/15m), delete tenant (15/15m) per super user. |
| **Stripe webhook audit** | `stripe_subscription_sync` rows on system tenant + `audit_logs` mirror (no PHI). |
| **Reports CSV export** | `GET /api/app/reports/export` — same period/location as dashboard; UTF-8 BOM for Excel; `report.csv_export` audit. |
| **Registration geography** | `/register` clinic step: country / state / city via `SearchableGeoSelect` (flags, names, ISO2); public geo APIs `GET /api/public/geo/*` (rate-limited) so unauthenticated registration can load data. |
| **Registration hardening** | `POST /api/auth/register-clinic`: IP rate limit (10 requests/hour per IP at handler entry); audit `clinic_self_registered` on success. |
| **Headers** | `Permissions-Policy` added in `next.config.ts` (camera/microphone for telemedicine; restricted geolocation/payment). |
| **Docs** | `website/SSO-OAUTH.md`, `website/PUBLIC-API.md`; `.env.example` must stay placeholder-only (no real DB URLs). |

## Suggested next (finish line)

- **Done:** Export reports (CSV) — `GET /api/app/reports/export` + **Download CSV** on `/app/reports` (audited as `report.csv_export`).
- Redis-backed rate limits for multi-instance DO.
- **SSO:** Operationalize Google/Azure for all clinics (env + IdP MFA); optional **2FA in-app** after SSO (see `SSO-OAUTH.md`).
- **SSO-only tenant provisioning** (optional, larger scope): create/link clinic from IdP claims instead of password registration only.
