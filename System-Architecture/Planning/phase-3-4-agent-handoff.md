# Phase 3.4 — IVF Lab & Embryology: Agent Handoff

**Goal:** IVF cycles and embryo records per patient. One agent full stack; or Agent 1 (schema + cycles/embryos API), Agent 2 (UI on patient detail + cycle detail).

**Parent plan:** `phase-3-2-to-3-5-multi-agent-plan.md`  
**Repo:** `FertilityOS` · **App:** `website/`

---

## Shared context

- **Auth:** `session.user.tenantId`; all APIs tenant-scoped.
- **Patients:** Cycles and embryos belong to patient; enforce patient.tenantId.
- **DB:** Two tables: `ivf_cycles`, `embryos`. Use **`0006_ivf_cycles.sql`** (include both tables in one migration).

---

## Agent 1 — Schema & IVF/Embryo API

**Deliverables:**

1. **Schema & migrations**
   - **`ivf_cycles`:** id, tenantId, patientId (FK patients), cycleNumber (int), cycleType (varchar: fresh, frozen), status (varchar: planned, stimulation, retrieval, fertilization, transfer, cancelled), startDate (date), endDate (date, optional), notes, createdAt, updatedAt. Index (tenantId, patientId).
   - **`embryos`:** id, tenantId, cycleId (FK ivf_cycles), day (int, e.g. 3, 5), grade (varchar), status (varchar: fresh, frozen, transferred, discarded), notes, createdAt, updatedAt. Index (tenantId, cycleId).
   - Document in digitalocean-database-setup.md.

2. **APIs**
   - `GET /api/app/patients/[patientId]/cycles` — list cycles; tenant + patient check.
   - `POST /api/app/patients/[patientId]/cycles` — create cycle (cycleNumber, cycleType, startDate, endDate?, notes).
   - `GET /api/app/ivf-cycles/[cycleId]` — one cycle + embryos; tenant check.
   - `PATCH /api/app/ivf-cycles/[cycleId]` — update cycle.
   - `POST /api/app/ivf-cycles/[cycleId]/embryos` — add embryo (day, grade, status, notes).
   - `PATCH /api/app/embryos/[id]` — update embryo; tenant check via cycle.

**Acceptance:** Migrations run; all routes tenant-isolated; embryos tied to cycle and patient.

---

## Agent 2 — IVF UI

**Depends on:** Agent 1.

**Deliverables:**

1. **Patient detail:** "IVF cycles" section; list cycles (number, type, status, dates); "Add cycle" form (cycleNumber, cycleType, startDate, notes); POST then refresh.
2. **Cycle detail:** Route `/app/patients/[patientId]/cycles/[cycleId]` (or expand inline). Show cycle fields and list of embryos; add embryo (day, grade, status, notes); edit cycle and embryos.
3. **Nav:** Optional "IVF" or keep under Patients; ensure link from patient to cycles is clear.
4. **Super Dashboard:** Add ivfCyclesCount (and optionally embryosCount) to super stats; set `ivfLab: "active"`.

**Acceptance:** Cycles and embryos manageable from patient; super dashboard shows IVF lab active and counts.
