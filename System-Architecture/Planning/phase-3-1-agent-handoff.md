# Phase 3.1 — Patient Management: Agent Handoff

**Goal:** Implement the first core module so clinics can register and manage patients (list, add, view/edit). This work is split across **three agents**; complete in order or in parallel with clear handoff at boundaries.

**Repo:** `FertilityOS` · **App:** `website/` (Next.js 16, React 19, Tailwind, Drizzle, Auth.js)  
**Conventions:** See `System-Architecture/Skills/skills.md` and `System-Architecture/Design/design-system.md`.

---

## Shared context (all agents)

- **Auth:** Session from `auth()` in server components; `session.user.tenantId`, `session.user.roleSlug` (admin, doctor, nurse, etc.). All app APIs must restrict by `tenantId`.
- **API pattern:** Route Handlers in `app/api/app/*`; check `session?.user?.tenantId` and role if needed; return JSON.
- **UI pattern:** Server component page + optional client component for forms/lists; use existing app layout (`app/app/layout.tsx`), add "Patients" to nav when done.
- **DB:** PostgreSQL via Drizzle; schema in `website/db/schema.ts`; migrations in `website/db/migrations/` (add new migration for `patients` table).

---

## Agent 1 — Data model & Patient API

**Deliverables:**

1. **Schema & migration**
   - Add `patients` table to `website/db/schema.ts`:
     - `id` (uuid, PK), `tenantId` (uuid, FK to tenants, notNull), `firstName`, `lastName`, `dateOfBirth` (date), `email`, `phone`, `address` (text), `city`, `state`, `country` (varchar 2), `postalCode`, `gender` (optional), `notes` (text), `createdAt`, `updatedAt`.
   - Add migration file `0002_patients.sql` in `website/db/migrations/` with `CREATE TABLE` and any indexes (e.g. `tenant_id` for list queries).
   - Run migration locally and document in `digitalocean-database-setup.md` that production must run the new migration.

2. **APIs**
   - `GET /api/app/patients` — list patients for `session.user.tenantId`; optional query `q` (search by name/email); return array of `{ id, firstName, lastName, dateOfBirth, email, phone, createdAt }`.
   - `POST /api/app/patients` — create patient (body: firstName, lastName, dateOfBirth, email, phone, address, city, state, country, postalCode, gender, notes); validate with Zod; restrict to tenant.
   - `GET /api/app/patients/[patientId]` — get one patient by id; ensure `patient.tenantId === session.user.tenantId`; return 404 if not found.
   - `PATCH /api/app/patients/[patientId]` — update patient (same fields as POST); tenant check.

**Acceptance:** Migrations run cleanly; all four routes work with tenant isolation; invalid payloads return 400.

---

## Agent 2 — Patients list & Add patient UI

**Depends on:** Agent 1 (schema + APIs in place).

**Deliverables:**

1. **Patients list page**
   - Route: `website/app/app/patients/page.tsx` (server component); require auth; optional: pass initial list from server or fetch in client.
   - Client component (e.g. `PatientsClient.tsx`): table or card list of patients (name, email, phone, DOB); search box that calls `GET /api/app/patients?q=...`; link each row to `/app/patients/[id]`.
   - Empty state: "No patients yet. Add your first patient."

2. **Add patient**
   - "Add patient" button on the list page opening a form (modal or separate page `/app/patients/new`).
   - Form fields: First name, Last name, Date of birth, Email, Phone, Address, City, State, Country, Postal code, Gender (optional), Notes (textarea). Use React Hook Form + Zod if already in project, or controlled inputs.
   - Submit → `POST /api/app/patients`; on success redirect to list or to new patient detail page; show validation errors.

**Acceptance:** List loads and shows patients; search filters list; add form creates a patient and redirects; validation errors displayed.

---

## Agent 3 — Patient detail page & app nav

**Depends on:** Agent 1 (APIs in place).

**Deliverables:**

1. **Patient detail page**
   - Route: `website/app/app/patients/[patientId]/page.tsx` (server component); require auth; load patient via `GET /api/app/patients/[patientId]` (from server or client). If 404, show "Patient not found".
   - Display: full name, DOB, contact (email, phone), address block, gender, notes. Match design system (cards, typography).

2. **Edit patient**
   - On detail page, "Edit" button that toggles inline edit or separate form. Use `PATCH /api/app/patients/[patientId]` to save; stay on detail page and refresh data.

3. **App navigation**
   - In `website/app/app/layout.tsx`, add a "Patients" link in the nav (next to Dashboard and Team) so all logged-in users can reach `/app/patients`. Optionally show "Patients" only for roles that should have access (e.g. admin, doctor, nurse, reception) per MVP roles.

**Acceptance:** Detail page shows all patient fields; edit saves and updates view; Patients is visible in app nav and works for appropriate roles.

---

## Handoff & order

| Order | Agent | Focus | Blocked by |
|-------|--------|--------|-------------|
| 1 | Agent 1 | Schema, migration, CRUD API | — |
| 2 | Agent 2 | List page + Add patient form | Agent 1 |
| 3 | Agent 3 | Detail page + Edit + Nav | Agent 1 |

Agents 2 and 3 can run in parallel after Agent 1 is merged. Ensure migration `0002_patients.sql` is run in production (DigitalOcean) after Agent 1 is deployed; document in `Infrastructure/digitalocean-database-setup.md` or `deployment.md`.

---

## Done criteria (Phase 3.1)

- [ ] Patients table exists; migration run in dev and documented for prod.
- [ ] GET/POST/GET-one/PATCH patients APIs work with tenant isolation.
- [ ] `/app/patients` lists patients with search; "Add patient" creates a patient.
- [ ] `/app/patients/[id]` shows patient and allows edit.
- [ ] "Patients" link in app layout; appropriate roles can access.
