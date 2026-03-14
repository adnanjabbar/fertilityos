# DigitalOcean App Platform — Database Setup (PostgreSQL 18)

This guide covers **creating a PostgreSQL 18 database** in DigitalOcean App Platform and running the FertilityOS migration SQL files so the app can use it.

---

## Step 1: Create or attach a database in App Platform

1. Open your **fertilityos** app in [DigitalOcean App Platform](https://cloud.digitalocean.com/apps).
2. Go to your **app’s overview** (or **Components** / **Resources**).
3. Click **Add Resource** (or **Create or Attach a Database** / **Add Database**).
4. Choose **Database** → **Create and attach a new database**.
5. Configure:
   - **Engine:** PostgreSQL
   - **Version:** 18 (or latest 18.x)
   - **Name:** e.g. `fertilityos-db` (friendly name in the dashboard).
   - **Database name:** e.g. `fertilityos` — this is the **actual database name** inside the cluster (the one you connect to). You can set it to `fertilityos` or any name you like; our SQL runs inside this database.
   - **Region:** Same as your app (e.g. NYC1) for lower latency.
   - **Size:** Small/Basic is enough to start.
6. Create the database. DigitalOcean will add it as a **component** to your app and will **inject a connection URL** into your app’s environment.

---

## Step 2: How the app gets the connection string

When you attach a database to an App Platform app:

- DigitalOcean sets an **environment variable** for your **web service** (e.g. `fertilityos-website`) with the connection string.
- The variable name is usually something like:
  - `DATABASE_URL`, or  
  - A component-specific name such as `FERTILITYOS_DB_DATABASE_URL` (if the DB component is named `fertilityos-db`).

Check your **app → your Web Service → Settings → App-Level Environment Variables** (or **Component → Environment Variables**). You should see a variable that contains a `postgresql://...` URL. If it’s not named `DATABASE_URL`, add an **app-level** or **component-level** env var:

- **Key:** `DATABASE_URL`  
- **Value:** either the same value as the injected DB URL, or a reference like `%fertilityos_db.DATABASE_URL%` if your platform supports component references (see DO docs for “component env” or “reference other component”).

Our app expects **exactly** the variable **`DATABASE_URL`**. So ensure your web service has:

- `DATABASE_URL` = the PostgreSQL connection string for the database you created (with the database name you chose, e.g. `fertilityos`).

---

## Step 3: Run the migration SQL files

The database starts **empty**. You must run the FertilityOS schema and seed data **once** using our SQL files. You have two options.

### Option A: Run from your computer (one-click script)

We provide a script that runs both migration files. From the repo:

1. Ensure **`website/.env`** contains your database URL:
   ```bash
   DATABASE_URL=postgresql://doadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require
   ```
2. From the `website` folder, run (on Windows PowerShell, if you get an SSL certificate error, run the second line first):
   ```powershell
   cd website
   # If you see "self-signed certificate" error, run this first:
   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"
   node scripts/run-migrations.js
   ```
   You should see: `Ran: 0000_phase2_tenants_users_roles.sql`, `Ran: 0001_invitations.sql`, `Ran: 0002_patients.sql`, `Ran: 0003_super_admin.sql`, `Ran: 0004_appointments.sql`, then `Migrations finished successfully.` (and any later migrations as we add them).

### Option B: Run from your computer with psql

1. Get the **connection string** from DigitalOcean:
   - App → your **database component** → **Connection details** / **Connection string**.
   - Or: **Databases** in the left sidebar → your cluster → **Connection parameters**.
   - Use the **connection string** (URI) that includes the database name you set (e.g. `fertilityos`). It will look like:
     ```text
     postgresql://user:password@host:port/fertilityos?sslmode=require
     ```
2. From your machine (with [psql](https://www.postgresql.org/docs/current/app-psql.html) installed), run the migrations **in order**:

   ```bash
   cd FertilityOS/website

   # Replace YOUR_DATABASE_URL with the actual connection string (in quotes if it has special chars)
   psql "YOUR_DATABASE_URL" -f db/migrations/0000_phase2_tenants_users_roles.sql
   psql "YOUR_DATABASE_URL" -f db/migrations/0001_invitations.sql
   psql "YOUR_DATABASE_URL" -f db/migrations/0002_patients.sql
   psql "YOUR_DATABASE_URL" -f db/migrations/0003_super_admin.sql
   psql "YOUR_DATABASE_URL" -f db/migrations/0004_appointments.sql
   psql "YOUR_DATABASE_URL" -f db/migrations/0005_clinical_notes.sql
   psql "YOUR_DATABASE_URL" -f db/migrations/0006_ivf_cycles.sql
   psql "YOUR_DATABASE_URL" -f db/migrations/0007_invoices.sql
   ```

   On Windows (PowerShell), use the same URLs in quotes; if the password has special characters, use the URI as given by DigitalOcean (often URL-encoded).

   Example (replace with your real URL):

   ```powershell
   psql "postgresql://doadmin:xxxx@.../fertilityos?sslmode=require" -f db/migrations/0000_phase2_tenants_users_roles.sql
   psql "postgresql://doadmin:xxxx@.../fertilityos?sslmode=require" -f db/migrations/0001_invitations.sql
   psql "postgresql://..." -f db/migrations/0002_patients.sql
   psql "postgresql://..." -f db/migrations/0003_super_admin.sql
   ```

3. If all commands finish without errors, the database is ready. You only need to run these once (or again only when we add new migration files).

### Option B: Run from DigitalOcean (one-off job or console)

If you prefer not to use your local machine:

1. **One-off job (recommended):**
   - Add a **Job** component that runs once at deploy (or trigger manually).
   - Use an image that has `psql` (e.g. `postgres:18-alpine`).
   - Command: run the two SQL files (e.g. by copying their contents into a script or mounting the repo and running `psql $DATABASE_URL -f ...`). The job must have access to `DATABASE_URL` (same app, so it’s usually injected).
2. **Database console:**
   - Some plans offer a **web-based SQL console** for the database. If available, open it, select the database (e.g. `fertilityos`), then paste and run the contents of `0000_phase2_tenants_users_roles.sql`, then `0001_invitations.sql`, then `0002_patients.sql`, then `0003_super_admin.sql`.

Use **Option A** (Node script) for the simplest one-click run; use **Option B** if you prefer `psql`.

---

## Step 4: Set app environment variables (required for auth)

In **App Platform → your app → Web Service (e.g. fertilityos-website) → Settings → Environment Variables**, ensure:

| Variable         | Description |
|------------------|-------------|
| `DATABASE_URL`  | PostgreSQL connection string (see Step 2). |
| `AUTH_SECRET`   | Secret for Auth.js sessions. Generate with: `openssl rand -base64 32`. |
| `NEXTAUTH_URL`  | Your app’s public URL, e.g. `https://www.thefertilityos.com`. |

- If the platform auto-injects the DB URL under another name, add `DATABASE_URL` and set it to that value (or use the reference syntax your UI shows).
- After adding or changing env vars, **redeploy** the app so the new values are used.

---

## Step 5: Deploy and verify

1. Push your code to the connected GitHub branch so the app rebuilds (or trigger a deploy from the dashboard).
2. Ensure the database component is **running** and the web service has **restarted** after env changes.
3. Open `https://www.thefertilityos.com/register` and create a clinic + admin account. If registration succeeds and you can sign in, the database and migrations are working.

---

## Summary checklist

- [ ] Create PostgreSQL 18 database in App Platform (database name e.g. `fertilityos`).
- [ ] Ensure web service has `DATABASE_URL` pointing to that database.
- [ ] Run all migration files in order (0000 through 0004 and any later ones) once (Option A or B).
- [ ] Set `AUTH_SECRET` and `NEXTAUTH_URL`; redeploy.
- [ ] Test registration and login at `/register` and `/login`.

---

## If you already have a database (attach existing)

If you **attach an existing** PostgreSQL database instead of creating a new one:

1. Use the **same** connection string format; ensure the URL includes the **database name** you want to use (e.g. `.../fertilityos?sslmode=require`).
2. Set that as `DATABASE_URL` for the web service.
3. Run the two migration files **once** against that database (Option A or B above). If the database name is different, use it in the connection string when running `psql`.

---

*Doc lives in `System-Architecture/Infrastructure/digitalocean-database-setup.md`. Update this file if DigitalOcean’s UI or naming changes.*
