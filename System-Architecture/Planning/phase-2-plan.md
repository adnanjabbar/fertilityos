# Phase 2 — Account Creation & Multi-Tenancy (Implementation Plan)

## Goal

Allow clinics to register, create an admin account, and (in Phase 2.2) onboard staff with role-based access. Foundation for multi-tenant SaaS.

---

## Scope (This Phase)

| Item | Status | Notes |
|------|--------|--------|
| Clinic registration flow (name, address, specialty, license) | In scope | Multi-step form |
| Admin account creation (first user per clinic) | In scope | Part of registration |
| FertilityOS subdomain option (`clinic.fertilityo.com`) | In scope | Slug + tenant resolution; wildcard DNS later |
| RBAC: roles and module permissions | In scope | Seed roles; admin assigns role to invited users |
| Sub-account creation (invite by email, assign role) | In scope | Phase 2.2 |
| Email verification | In scope | Optional for MVP; can be link or code |
| 2FA | Defer | Phase 2.3 or post-MVP |
| Custom domain (BYO) | Defer | Phase 3 (see MVP scope) |
| Domain masking / reverse-proxy | Defer | After subdomain works |

---

## Tech Choices (Phase 2)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| API | Next.js Route Handlers (`app/api/*`) | Single app on DO App Platform; no extra service |
| Auth | Auth.js (NextAuth v5) | Session-based, fits Next.js; tenant in session |
| DB | PostgreSQL + Drizzle ORM | Type-safe, SQL-first; use Neon or DO Managed DB |
| Forms | React Hook Form + Zod | Per tech stack; validation and DX |
| Tenant resolution | Session + optional subdomain | Session stores `tenantId`; middleware can read host later |

---

## Data Model (Minimal for Phase 2)

- **tenants** — Clinics: id, name, slug (subdomain), address, city, state, country, postal_code, specialty, license_info, created_at, updated_at
- **users** — id, tenant_id, email, password_hash, full_name, role_slug, email_verified_at, created_at, updated_at
- **roles** — slug, name, description (seed: admin, doctor, nurse, embryologist, lab_tech, reception, radiologist, staff)
- **invitations** (Phase 2.2) — id, tenant_id, email, role_slug, token, expires_at, accepted_at

Tenant isolation: all queries filter by `tenant_id` from session.

---

## Implementation Order

### 2.1 — Foundation
- [x] Phase 2 plan doc (this file)
- [x] Drizzle schema + migrations
- [x] `.env.example` (DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL)
- [x] DB connection helper

### 2.2 — Auth & Registration API
- [x] Auth.js config (Credentials provider, session with tenantId)
- [x] POST `/api/auth/register-clinic` — create tenant + admin user
- [x] GET/POST `/api/auth/[...nextauth]` — login, session
- [x] Middleware: protect `/app/*`, redirect unauthenticated to `/login`

### 2.3 — Registration & Login UI
- [x] `/register` — multi-step: (1) Clinic details, (2) Admin account (email, password, name)
- [x] `/login` — email + password, redirect to `/app/dashboard`
- [x] `/app/dashboard` — placeholder with clinic name and logout
- [x] Navbar: show “Dashboard” / “Log out” when logged in; “Get Early Access” / “Sign In” when not

### 2.4 — RBAC & Sub-accounts (Phase 2.2)
- [x] Seed roles and default permissions
- [x] Invite user: admin enters email + role; invite link generated (email sending can be added later)
- [x] Accept invite: set password, join tenant at `/invite/[token]`
- [x] List users (admin only) at `/api/app/users`; list pending invites at `/api/app/invitations`
- [ ] Edit user role (optional follow-up)

### 2.5 — Subdomain (Optional in Phase 2)
- [ ] Middleware: resolve tenant from host (e.g. `slug.thefertilityos.com`)
- [ ] Document DNS: wildcard CNAME for `*.thefertilityos.com` to DO

---

## Routes Summary

| Route | Purpose |
|------|---------|
| `/` | Marketing homepage (existing) |
| `/register` | Clinic + admin registration |
| `/login` | Sign in |
| `/app/dashboard` | Protected dashboard; Team card for admins |
| `/app/team` | Team management (admin only): invite, list invites, list users |
| `/invite/[token]` | Accept invitation: set name + password, create account |
| `/api/auth/[...nextauth]` | Auth.js |
| `/api/auth/register-clinic` | Clinic + admin signup |
| `/api/auth/invite/[token]` | GET invite details by token (public) |
| `/api/auth/accept-invite` | POST accept invite with password (public) |
| `/api/app/invitations` | GET list pending, POST create (admin) |
| `/api/app/users` | GET list users (admin) |

---

## Success Criteria (Phase 2)

- [ ] A clinic can register (name, address, specialty, admin email/password) and see success.
- [ ] Admin can log in and land on `/app/dashboard` with clinic context.
- [ ] Session contains tenantId and userId; logout works.
- [ ] (Phase 2.2) Admin can invite a user by email with a role; invited user can set password and log in.
