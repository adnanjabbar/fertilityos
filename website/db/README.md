# Database — FertilityOS

Phase 2 uses **PostgreSQL** with **Drizzle ORM**. The schema is in `schema.ts`; migrations are in `migrations/`.

## Setup

1. Create a PostgreSQL database (e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com), or **DigitalOcean App Platform**: see **`System-Architecture/Infrastructure/digitalocean-database-setup.md`** for creating PostgreSQL 18 and running migrations).
2. Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` — your PostgreSQL connection string (with `?sslmode=require` if needed).
   - `AUTH_SECRET` or `NEXTAUTH_SECRET` — for Auth.js (e.g. `openssl rand -base64 32`).
   - `NEXTAUTH_URL` — `http://localhost:3000` locally; `https://www.thefertilityos.com` in production.
3. Run the migrations (in order):

   ```bash
   psql $DATABASE_URL -f db/migrations/0000_phase2_tenants_users_roles.sql
   psql $DATABASE_URL -f db/migrations/0001_invitations.sql
   ```

4. Start the app: `npm run dev`. Register a clinic at `/register`, then sign in at `/login`.

## Tables

- **tenants** — Clinics (name, slug, address, country, etc.).
- **users** — Users per tenant (email, password hash, full name, role). Unique on `(tenant_id, email)`.
- **roles** — Seed data (admin, doctor, nurse, embryologist, lab_tech, reception, radiologist, staff).
- **invitations** — Pending invites (tenant_id, email, role_slug, token, expires_at, accepted_at). Phase 2.2.

## Scripts

- `npm run db:generate` — Generate migrations from schema changes.
- `npm run db:migrate` — Run pending migrations.
- `npm run db:studio` — Open Drizzle Studio (optional).
