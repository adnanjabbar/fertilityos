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

Without `AUTH_TRUST_HOST=true` and `AUTH_URL`, the site can return **503** when calling `/api/auth/session` or signing in.

**If you see 503 or "UntrustedHost" in logs:**  
Add `AUTH_TRUST_HOST=true` and `AUTH_URL=https://www.thefertilityos.com` (or your live URL) to the app’s environment variables, then trigger a new deploy (e.g. redeploy from the DO dashboard or push a small commit).

## Database (PostgreSQL)

- **Create/attach:** Use App Platform **Add Resource → Database → Create and attach**. Prefer PostgreSQL 18; set **database name** (e.g. `fertilityos`).
- **Connection:** Ensure the web service has **`DATABASE_URL`** set to the DB connection string (DO often injects it under a component name; alias or copy it to `DATABASE_URL`).
- **Migrations:** Run the SQL files in `website/db/migrations/` **once** (in order). See **`Infrastructure/digitalocean-database-setup.md`** for step-by-step instructions.
- **Demo account (optional):**  
  - **CLI:** From `website/` run `npm run db:seed-demo` (with `DATABASE_URL` set).  
  - **API (e.g. production):** Set `SEED_DEMO_SECRET` in env, then `POST /api/admin/seed-demo?secret=YOUR_SEED_DEMO_SECRET` (or header `x-seed-secret`).  
  **Login:** `demo` / `demo`.

## For development and agents

- **Local:** Run `website/` with `npm run dev` (Next.js default port 3000).
- **Production:** No need to configure port in code; App Platform runs the built app (e.g. `next start` or equivalent) on port 3000.
- **Iteration:** Pull from GitHub before changes; push after changes to keep production in sync.

## Networking (reference)

- Public static ingress IPs (App Platform): e.g. `162.159.140.98`, `172.66.0.96` (may vary; use the live domain for access).

---

*Last updated from DigitalOcean App Platform overview. Update this file if platform, domain, or port changes.*
