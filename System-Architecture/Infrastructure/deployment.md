# Deployment — FertilityOS

## Live production

| Item | Value |
|------|--------|
| **Platform** | DigitalOcean App Platform |
| **App name** | `fertilityos` |
| **Region** | NYC1 |
| **Public URL** | https://thefertilityos.com |
| **WWW** | https://www.thefertilityos.com (domain added) |
| **Component** | Web Service: `fertilityos-website` (1 instance) |
| **Runtime** | Next.js on **port 3000** |
| **Buildpack** | Node.js (Ubuntu 22.04 stack); Custom Build Command; Procfile |
| **Source** | GitHub repo; pushes to connected branch trigger deploy |
| **Estimated cost** | ~$5/month (as of initial setup) |

## Flow

- **Code:** GitHub repo (`adnanjabbar/FertilityOS`) → DigitalOcean App Platform.
- **Deploy:** Changes pushed to the connected branch (e.g. `main`) trigger build and deploy; Next.js app runs on port 3000.
- **Domain:** `thefertilityos.com` / `www.thefertilityos.com` point to the App Platform app.

## Required environment variables (App Platform)

Set these in the App’s **Settings → App-Level Environment Variables** (or component env):

| Variable | Value | Notes |
|----------|--------|--------|
| `DATABASE_URL` | `postgresql://...` | From the attached database (or copy from component) |
| `AUTH_SECRET` | 32+ char secret | e.g. `openssl rand -hex 16` |
| `NEXTAUTH_URL` | `https://www.thefertilityos.com` | Canonical app URL |
| **`AUTH_URL`** | `https://www.thefertilityos.com` | Same as NEXTAUTH_URL; required for Auth.js v5 |
| **`AUTH_TRUST_HOST`** | `true` | **Required** to avoid 503 UntrustedHost on non-Vercel hosts |
| **`RESEND_API_KEY`** | `re_...` | **Required for email:** confirmation links, password reset, reminders. From [Resend](https://resend.com); add domain and DNS (SPF/DKIM). See **`Infrastructure/email-and-domain.md`**. |
| **`NPM_CONFIG_LEGACY_PEER_DEPS`** | `true` | Optional: set if the build fails with npm peer dependency conflict (repo also has `.npmrc` with `legacy-peer-deps=true`) |
| **`DISABLE_TENANT_SUBDOMAIN_REDIRECT`** | `1` or `true` | **Optional stopgap:** if wildcard DNS for `*.thefertilityos.com` is not live yet, set this so clinic users stay on **www** after login (avoids **`ERR_NAME_NOT_RESOLVED`** on `{slug}.thefertilityos.com`). Remove when wildcard DNS + app domain config are correct. |
| **`AUTH_COOKIE_DOMAIN`** | `.thefertilityos.com` | **Required for tenant subdomains:** Auth session must be shared across `www` and `{slug}.thefertilityos.com`. Set to your **registrable domain with a leading dot** (see `website/auth.ts`). Without this, DNS can be correct but `/app/dashboard` on a subdomain still bounces to login or looks “not logged in”. After enabling, users sign in once to refresh the cookie scope. |

Without `AUTH_TRUST_HOST=true` and `AUTH_URL`, the site can return **503** when calling `/api/auth/session` or signing in. If the **build** fails with "upstream dependency conflict" or "eresolve", add `NPM_CONFIG_LEGACY_PEER_DEPS=true` and redeploy.

**If you see 503 or "UntrustedHost" in logs:**  
Add `AUTH_TRUST_HOST=true` and `AUTH_URL=https://www.thefertilityos.com` (or your live URL) to the app’s environment variables, then trigger a new deploy (e.g. redeploy from the DO dashboard or push a small commit).

**If login shows 504 (Gateway Timeout) or stays on the login screen:**  
The server or database is not responding in time (e.g. cold start, DB connection slow). Check: (1) App Platform app is running and not sleeping; (2) `DATABASE_URL` is correct and the DB is in the same region; (3) In DO app Settings → Resources, ensure the web service has enough memory/CPU. After changing env or scaling, redeploy. Users can retry after a few seconds.

### Chunk 404 / ChunkLoadError (e.g. `fa6ccc9066ff7830.js` Not Found)

If the site shows login or other errors and the browser console reports **404** on `/_next/static/chunks/XXXXX.js` or **ChunkLoadError**, the server is serving HTML that references a JS chunk from a different or incomplete build than the files actually deployed.

**Fix: force a full clean rebuild on DigitalOcean**

1. In [DigitalOcean](https://cloud.digitalocean.com) → your app → **fertilityos-website** (or the web component).
2. Open the **Deployments** tab (or **Settings** if the option is there).
3. Use **"Clear build cache and deploy"** or **"Redeploy"** so the next build does not reuse old cache. If you only see **Redeploy**, use it; that still triggers a fresh build from the current branch.
4. Wait for the new deployment to finish (build + deploy).
5. In the browser, do a **hard refresh** (Ctrl+Shift+R) or open the site in an **incognito window** so you don’t use cached HTML that points to old chunk hashes.

After a successful clean deploy, all `_next/static/chunks/*.js` files from that build will be present and login should work (assuming the demo user is seeded).

## Database (PostgreSQL)

- **Create/attach:** Use App Platform **Add Resource → Database → Create and attach**. Prefer PostgreSQL 18; set **database name** (e.g. `fertilityos`).
- **Connection:** Ensure the web service has **`DATABASE_URL`** set to the DB connection string (DO often injects it under a component name; alias or copy it to `DATABASE_URL`).
- **Migrations (required):** The app expects **all** migrations in `website/db/migrations/` through the latest (e.g. **`0046_platform_subscription_audit.sql`**: `tenant_subscriptions.billing_plan`, `platform_admin_audit_log` for super-admin subscription/module changes). If you see **`relation "inventory_items" does not exist`** (or any other "relation does not exist") at runtime, the production database has not had migrations run or is missing later migrations. Run them **once** in order from your machine against the production `DATABASE_URL`:
  ```bash
  cd website
  # Set DATABASE_URL in .env to your production DB URL (from DO dashboard)
  npm run db:run-sql-migrations
  # or: node scripts/run-migrations.js
  ```
  The script applies any pending files in `db/migrations/` in order (including **0046**). Confirm in DB: column `tenant_subscriptions.billing_plan` and table `platform_admin_audit_log` exist.
  See **`Infrastructure/digitalocean-database-setup.md`** for full step-by-step instructions (Option A or B).
- **Demo account (optional):**  
  - **CLI:** From `website/` run `npm run db:seed-demo` (with `DATABASE_URL` set).  
  - **API (e.g. production):** Set `SEED_DEMO_SECRET` in env, then open **GET** `https://www.thefertilityos.com/api/admin/seed-demo?secret=YOUR_SEED_DEMO_SECRET` in the browser (or `POST` with the same query or header `x-seed-secret`). This creates the demo user in the **production** database so login at www.thefertilityos.com works.  
  **Login:** `thefertilityos@gmail.com` / `demo`.

- **Super Admin (platform owner dashboard):** There is no API to create the super-admin; use the script from your machine:
  1. Ensure migrations have run (including `0003_super_admin.sql`), which creates the `system` tenant and `super_admin` role.
  2. In `website/.env`, set **`DATABASE_URL`** to your **production** PostgreSQL URL (same as in DigitalOcean).
  3. From the repo root run: `cd website && node scripts/seed-super-admin.js` (or `npm run db:seed-super-admin`).
  4. Log in at **https://www.thefertilityos.com/login** with **dradnanjabbar@gmail.com** / **@AdnanJabbar007** (or the password you set in `SUPER_ADMIN_PASSWORD` in .env). Then open **Super Dashboard** at **https://www.thefertilityos.com/app/super**.

- **Super Admin Phase 1 (platform data):** The app exposes `GET /api/app/super/stats` (includes `platformKpis`: countries, admins, subscriptions, invoice rollups by currency), `GET /api/app/super/tenants?page=&limit=&q=` (paginated clinic list), and `GET /api/app/super/tenants/:tenantId` (clinic snapshot: counts, subscription, IVF by status, invoice rollups — no patient PII). UI: **All clinics** at `/app/super/clinics`, clinic detail at `/app/super/tenants/[tenantId]`. Optional App Platform env: **`SUPER_ADMIN_ESTIMATED_MRR_USD_PER_ACTIVE_SUB`** (e.g. `99`) for a rough MRR line on the super overview until Stripe amounts are stored in DB.

- **Super Admin subscription & compliance audit (after migration 0046):** Super admins can set each clinic’s **billing plan** (`free` / `basic` / `pro` / `enterprise`) and **Stripe subscription status** via `PATCH /api/app/super/tenants/:tenantId/subscription`, and toggle **enabled modules** via `PATCH /api/app/super/tenants/:tenantId/modules`. Changes are written to **`platform_admin_audit_log`** (and mirrored to tenant audit as `platform.*` events) for GDPR accountability, HIPAA security/configuration trails, and HL7 interoperability governance — **no patient PHI** in these payloads. UI: controls and per-tenant history on `/app/super/tenants/[tenantId]`; platform-wide log at **`/app/super/audit`** (`GET /api/app/super/audit-log`).

- **Super Admin delete clinic:** From **All clinics** (`/app/super/clinics`), super admin can **Delete** a clinic after typing its exact name. API: `DELETE /api/app/super/tenants/:tenantId` with body `{ "confirmName": "…" }`. The `system` tenant cannot be removed. Dependent data is removed via DB **ON DELETE CASCADE**; an audit row is stored under the **system** tenant (`tenant_permanently_deleted`). If Stripe is configured, the clinic’s subscription is canceled before the tenant row is deleted.

- **Full reset (delete all users and tenants, recreate only Super Admin):** From `website/` run `npm run db:reset-users-and-tenants` (or `node scripts/reset-users-and-tenants.js`) with `DATABASE_URL` set. This removes all tenants except `system`, deletes all users, and creates only the Super Admin above. Admin/clinic accounts are then created via **Register** at `/register`; Super Admin approves them (when the approval flow is in place).

- **Remove seeded accounts to register fresh:** Open **GET** `https://www.thefertilityos.com/api/admin/reset-seeded-accounts?secret=YOUR_SEED_DEMO_SECRET`. This deletes the demo user (thefertilityos@gmail.com) and super-admin user (dradnanjabbar@gmail.com) and their sessions. Then use **Register** at `/register` with your email. Requires **RESEND_API_KEY** (and domain verification in Resend) for the 6-digit email verification code to be sent.

## For development and agents

- **Local:** Run `website/` with `npm run dev` (Next.js default port 3000).
- **Production:** No need to configure port in code; App Platform runs the built app (e.g. `next start` or equivalent) on port 3000.
- **Iteration:** Pull from GitHub before changes; push after changes to keep production in sync.

## Subdomain (clinic URLs)

After login on **www**, non–super-admin users are redirected to **`https://{clinic-slug}.thefertilityos.com`**. If **`ERR_NAME_NOT_RESOLVED`** appears, DNS for that hostname is missing — configure wildcard DNS below, or temporarily set **`DISABLE_TENANT_SUBDOMAIN_REDIRECT=1`** (see env table).

To support clinic subdomains (e.g. `demo-clinic.thefertilityos.com`):

1. **DNS:** At your domain registrar, add a **wildcard CNAME** record:
   - **Type:** CNAME  
   - **Name/Host:** `*` (or `*.thefertilityos.com` depending on registrar)  
   - **Value/Target:** Your DO App Platform default ingress (e.g. `fertilityos-xxxxx.ondigitalocean.app` from the DO app’s Domains tab), or the same target as `www.thefertilityos.com`.
2. **App Platform:** In the app’s **Settings → Domains**, add the root domain so DO issues a cert that covers `*.thefertilityos.com` (wildcard). If DO doesn’t support wildcard in the UI, you may need to add each subdomain (e.g. `demo-clinic.thefertilityos.com`) manually, or use a single cert for the root and rely on DNS wildcard for routing.
3. **App behavior:** Middleware already reads the host and sets the `x-tenant-slug` request header when the host is `slug.thefertilityos.com`. The app can call `GET /api/tenant-by-slug?slug=...` to resolve the tenant.

See **`Infrastructure/dns-subdomain.md`** for step-by-step DNS and DO configuration.

## Networking (reference)

- Public static ingress IPs (App Platform): e.g. `162.159.140.98`, `172.66.0.96` (may vary; use the live domain for access).

---

*Last updated from DigitalOcean App Platform overview. Update this file if platform, domain, or port changes.*
