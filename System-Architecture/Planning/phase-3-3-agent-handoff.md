# Phase 3.3 — Clinical Notes (EMR): Agent Handoff

**Goal:** SOAP-format clinical notes per patient. One agent full stack; or Agent 1 (schema + API), Agent 2 (UI on patient detail).

**Parent plan:** `phase-3-2-to-3-5-multi-agent-plan.md`  
**Repo:** `FertilityOS` · **App:** `website/`

---

## Shared context

- **Auth:** `session.user.tenantId`; all APIs tenant-scoped.
- **Patients:** Existing; notes belong to `patientId`. Ensure patient.tenantId === session.user.tenantId.
- **DB:** Drizzle; migrations in `website/db/migrations/`. Use **`0005_clinical_notes.sql`** for this phase.

---

## Agent 1 — Schema & Clinical Notes API

**Deliverables:**

1. **Schema & migration**
   - Table `clinical_notes`: id, tenantId, patientId (FK patients), authorId (FK users), noteType (varchar, default 'soap'), subjective (text), objective (text), assessment (text), plan (text), diagnosisCode (varchar, optional), createdAt, updatedAt.
   - Index (tenantId, patientId). Document migration in digitalocean-database-setup.md.

2. **APIs**
   - `GET /api/app/patients/[patientId]/notes` — list notes for patient; verify patient.tenantId === tenantId.
   - `POST /api/app/patients/[patientId]/notes` — body: subjective, objective, assessment, plan, diagnosisCode?; authorId = session.user.id; tenant + patient check.
   - `GET /api/app/clinical-notes/[noteId]` — one note; tenant check.
   - `PATCH /api/app/clinical-notes/[noteId]` — update; tenant check.

**Acceptance:** Migration runs; APIs tenant-isolated; notes scoped to patient.

---

## Agent 2 — Clinical Notes UI

**Depends on:** Agent 1.

**Deliverables:**

1. **Patient detail integration:** On `/app/patients/[patientId]`, add "Clinical notes" section (or tab). List notes (date, author, short snippet); "Add note" button.
2. **Add note:** Form with Subjective, Objective, Assessment, Plan (textareas), optional Diagnosis code; POST to `/api/app/patients/[patientId]/notes`.
3. **View/edit note:** Expand inline or modal; PATCH for edit.
4. **Super Dashboard:** Set `emr: "active"` in modules in super stats API.

**Acceptance:** Notes visible and editable from patient page; EMR module active in super dashboard.
