# Migrations — FertilityOS

Run these **in order** against your PostgreSQL database (e.g. DigitalOcean PostgreSQL 18).

## Order

1. **0000_phase2_tenants_users_roles.sql** — Creates `role_slug` enum, `tenants`, `users`, `roles` tables and seeds roles.
2. **0001_invitations.sql** — Creates `invitations` table (Phase 2.2).

## One-time run (from project root)

```bash
cd website
psql "YOUR_DATABASE_URL" -f db/migrations/0000_phase2_tenants_users_roles.sql
psql "YOUR_DATABASE_URL" -f db/migrations/0001_invitations.sql
```

Replace `YOUR_DATABASE_URL` with your full connection string (e.g. from DigitalOcean App Platform database component). Use quotes so the shell doesn’t break on `?` or `&`.

## DigitalOcean

See **System-Architecture/Infrastructure/digitalocean-database-setup.md** for creating the database in App Platform and running these files.
