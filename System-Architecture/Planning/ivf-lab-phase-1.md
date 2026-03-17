# IVF Lab / Embryology Phase 1 – Design & phasing

## Current schema (existing)

- **ivf_cycles**: tenantId, patientId, cycleNumber, cycleType (fresh/default), status (planned/default), startDate, endDate, notes.
- **embryos**: tenantId, cycleId, day, grade, status (fresh/default), notes.
- **embryo_genetic_results**: embryoId, testType (PGT-A/M/SR/HLA/other), result (euploid/aneuploid/mosaic/inconclusive), resultDate, labReference, notes.

UI today: patient detail shows IVF cycles and embryos; genetic results can be added per embryo. No dedicated embryology workflow for OPU → fertilization → day-by-day tracking → transfer/cryo.

---

## Phase 1 scope: embryology workflow

### 1. Schema changes (additive)

**1.1 Oocyte retrieval (OPU)**

- **oocyte_retrievals** (or **ivf_opu**):
  - id, tenant_id, cycle_id (FK ivf_cycles), retrieval_date (timestamptz), performed_by_id (FK users, optional).
  - oocytes_total (int), oocytes_mature (int), oocytes_immature (int), oocytes_mii (int), oocytes_gv (int), notes.
  - created_at, updated_at.
- One retrieval per cycle (1:1 or 1:many; start with 1:1 per cycle for simplicity).

**1.2 Fertilization**

- **fertilization_events** (or **ivf_fertilization**):
  - id, tenant_id, cycle_id, opu_id (FK oocyte_retrievals, optional).
  - fertilization_type: enum or varchar ('ivf', 'icsi', 'half_icsi').
  - oocytes_inseminated (int), oocytes_fertilized (int), zygotes_normal (int), zygotes_abnormal (int), notes.
  - performed_at (timestamptz), performed_by_id (FK users), created_at, updated_at.
- Embryos are created after fertilization (manually or auto-derived count). Link embryo to cycle; optional FK to fertilization_event later.

**1.3 Embryos (extend existing)**

- Add to **embryos**: fertilization_event_id (FK, optional), day_created (int or date), source ('fresh'|'frozen'|'donor'), disposition ('culture'|'transferred'|'frozen'|'discarded'|'biopsied').
- Keep day, grade, status; add grade_detail (e.g. Gardner 4AA) if needed in Phase 1.

**1.4 Embryo transfers**

- **embryo_transfers**:
  - id, tenant_id, cycle_id, patient_id, transfer_date (timestamptz), transfer_type ('fresh'|'frozen').
  - embryos_transferred (int or JSON array of embryo_ids), number_implanted (optional), performed_by_id, notes, created_at, updated_at.
- Link to embryos via embryo_ids or a join table (embryo_transfer_embryos: transfer_id, embryo_id).

**1.5 Cryopreservation**

- **cryo_straws** (or **embryo_cryo**):
  - id, tenant_id, embryo_id (FK), cycle_id, straw_label (varchar), storage_location (varchar, e.g. tank/cane/canister), frozen_at (timestamptz), thawed_at (timestamptz, null), notes, created_at, updated_at.
- Optional: thaw_events table (thaw_at, embryo_id, outcome).

---

### 2. API endpoints (REST, tenant-scoped)

- **OPU**: `GET/POST /api/app/ivf/cycles/[cycleId]/opu` (list one or create), `PATCH/DELETE .../opu/[opuId]` if 1:many.
- **Fertilization**: `GET/POST /api/app/ivf/cycles/[cycleId]/fertilization`, `PATCH .../fertilization/[id]`.
- **Embryos**: existing or extend `GET/POST/PATCH /api/app/ivf/cycles/[cycleId]/embryos` (include new fields, filter by disposition).
- **Transfers**: `GET/POST /api/app/ivf/cycles/[cycleId]/transfers`, `PATCH .../transfers/[id]`.
- **Cryo**: `GET/POST /api/app/ivf/embryos/[embryoId]/cryo` or `/api/app/ivf/cycles/[cycleId]/cryo`, `PATCH` thaw.

---

### 3. UI screens (embryology workflow)

- **Cycle detail (embryology view)**  
  Tab or section: Timeline or steps:
  1. OPU (date, counts: total, mature, MII, GV) – form to add/edit.
  2. Fertilization (type, inseminated, fertilized, zygotes) – form to add/edit.
  3. Embryos list (day, grade, status, disposition) – table with add/edit; link from fertilization counts.
  4. Transfers – list + add transfer (date, type, embryos selected, optional outcome).
  5. Cryo – list straws by cycle or embryo; add straw (label, location, date); record thaw.

- **Patient-level**: From patient detail → IVF cycles → open cycle → embryology view (same as above).

- **Permissions**: Embryologist, lab_tech, admin, doctor (read/write as per current lab access).

---

### 4. Phasing (implementable chunks)

- **Phase 1A – OPU + Fertilization**
  - Migration: oocyte_retrievals, fertilization_events.
  - APIs: create/read/update OPU and fertilization per cycle.
  - UI: Cycle embryology section with “OPU” and “Fertilization” cards/forms; show counts.

- **Phase 1B – Embryos extension + Transfers**
  - Migration: embryos new columns; embryo_transfers (+ optional embryo_transfer_embryos).
  - APIs: embryos CRUD with new fields; transfers CRUD; link embryos to transfer.
  - UI: Embryos table (day, grade, disposition); Add transfer (date, type, select embryos).

- **Phase 1C – Cryo + Thaw**
  - Migration: cryo_straws (and optional thaw_events).
  - APIs: CRUD cryo straws, PATCH thaw.
  - UI: Cryo list per cycle/embryo, add straw, record thaw.

---

## Implementation order

1. **Phase 1A**: Migrations → schema.ts → OPU + Fertilization APIs → Cycle detail embryology UI (OPU + Fertilization).
2. **Phase 1B**: Migrations → embryos + transfers APIs → Embryos table + Transfers UI.
3. **Phase 1C**: Migrations → cryo APIs → Cryo + Thaw UI.

Patient portal password setup/reset can be done in parallel or after Phase 1 (requires patients.password_hash or separate patient_credentials table and portal sign-in flow).
