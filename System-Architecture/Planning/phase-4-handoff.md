# Phase 4 — First items: Agent handoff

**Prerequisite:** MVP polish done (reminders, Stripe, module toggles).  
**Goal:** Implement one or more Phase 4 features. Each item can be assigned to a separate agent.

---

## 4.1 Patient portal (read-only)

**Scope:** Patient-facing login; view own profile, appointments, invoices. No edit.

- **Auth:** Separate auth flow for patients (e.g. magic link to email, or patient password per record). Option: reuse Auth.js with a "patient" role and tenantId = clinic, or dedicated patient_credentials table linked to patients.
- **Routes:** `/portal` or subdomain `portal.thefertilityos.com`. Middleware: allow unauthenticated access to `/portal/login`, require patient session for `/portal/*`.
- **Pages:** Portal login → Dashboard (summary) → My profile (read-only patient demographics) → My appointments (list) → My invoices (list, no pay).
- **APIs:** `GET /api/portal/me`, `GET /api/portal/appointments`, `GET /api/portal/invoices`. All scoped by patient id from session.

**Deliverables:** Patient auth (magic link or password), portal layout, dashboard + profile + appointments + invoices pages, APIs. Document in `PORTAL-SETUP.md`.

---

## 4.2 Reporting / analytics dashboard

**Scope:** Simple reports for clinic: appointments per period, revenue per period, patients added, IVF cycles.

- **Data:** Aggregate from existing tables (appointments, invoices, patients, ivf_cycles) filtered by tenantId and date range.
- **APIs:** `GET /api/app/reports/overview?from=&to=` returning counts and optional time-series (e.g. appointments per day).
- **UI:** `/app/reports` or extend `/app/dashboard` with charts. Use Recharts or similar. Cards: total appointments (period), revenue (period), new patients, IVF cycles. Optional: line/bar chart for appointments over time.

**Deliverables:** Reports API, reports page with summary cards and at least one chart. Nav link "Reports" (admin or all roles).

---

## 4.3 Telemedicine (video)

**Scope:** Start a video call from an appointment (e.g. type = "video" or "consultation" with video flag).

- **Provider:** Daily.co, Twilio Video, or Zoom SDK. Create a room/session when "Start call" is clicked; link room to appointment; open in new tab or embed.
- **Schema:** Optional `appointments.videoRoomId` or separate `video_sessions` table (appointmentId, provider, roomId, startedAt, endedAt).
- **UI:** On appointment detail, if type supports video: "Start video call" → create room, store id, redirect to provider’s meet URL or embed iframe.

**Deliverables:** Video provider integration, create room API, "Start call" on appointment detail. Document env vars and setup.

---

## 4.4 Inventory (consumables)

**Scope:** Per-tenant list of lab consumables; quantity and reorder level; low-stock alert on dashboard.

- **Schema:** `inventory_items` (tenantId, name, quantity, unit, reorderLevel, notes, createdAt, updatedAt). Optional `inventory_log` for history.
- **APIs:** CRUD `/api/app/inventory` (list, create, update). Dashboard or reports: count of items where quantity <= reorderLevel.
- **UI:** `/app/inventory` — list items, add/edit, show low-stock badge. Dashboard card: "X items below reorder level" with link.

**Deliverables:** Schema + migration, CRUD API, inventory list page, dashboard alert. Nav "Inventory" (e.g. admin or lab role).

---

## Execution

- Pick one or more items; one agent per item.
- Follow existing patterns: tenant-scoped APIs, Drizzle schema, migrations in `website/db/migrations/`, document new env or setup in repo.
- After each item: merge, run new migrations, update `next-steps-development.md` and roadmap.
