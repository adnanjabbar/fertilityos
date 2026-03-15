# ICD-11 diagnosis and custom diagnosis (Phase 7.3)

This document describes the ICD-11 (WHO) diagnosis feature and role-based custom diagnosis in FertilityOS.

## Overview

- **ICD-11 only** — The app uses WHO ICD-11 (not ICD-10). Full entity detail (code, title, description, chapter/section) is stored locally for search and for displaying "ICD-11 Disease Detail" per code.
- **Patient diagnoses** — Each diagnosis is either an ICD-11 code reference and/or a custom (free-text) diagnosis. Custom diagnosis is allowed only for roles permitted by the clinic (RBAC).
- **APIs** — Search ICD-11; full CRUD for patient diagnoses with validation and role checks. Responses include full ICD-11 detail when an `icd11Code` is present.

## Schema

### `icd11_entities`

Reference table for ICD-11 codes and full text used for search and "ICD-11 Disease Detail" display.

| Column           | Type         | Description |
|------------------|--------------|-------------|
| id               | uuid         | Primary key |
| code             | varchar(32)  | ICD-11 code (unique) |
| title            | varchar(512) | Short title |
| description      | text         | Full disease detail text |
| parent_code      | varchar(32)  | Parent code in hierarchy |
| chapter_code     | varchar(32)  | Chapter code |
| chapter_title    | varchar(512) | Chapter title |
| section_code     | varchar(32)  | Section code |
| section_title    | varchar(512) | Section title |
| created_at       | timestamptz  | |
| updated_at       | timestamptz  | |

Indexes: unique on `code`; index on `parent_code`; index on `title` for search.

### `patient_diagnoses`

One row per diagnosis per patient (tenant-scoped).

| Column             | Type         | Description |
|--------------------|--------------|-------------|
| id                 | uuid         | Primary key |
| tenant_id          | uuid         | FK tenants |
| patient_id         | uuid         | FK patients |
| icd11_code         | varchar(32)  | Optional; references icd11_entities.code |
| custom_diagnosis   | text         | Optional; free-text when not in ICD-11 |
| recorded_by_id     | uuid         | FK users |
| recorded_at        | timestamptz  | When recorded |
| role_slug_at_record| varchar(32)  | Role of recorder (optional) |
| created_at         | timestamptz  | |
| updated_at         | timestamptz  | |

At least one of `icd11_code` or `custom_diagnosis` must be set. Custom diagnosis may only be set or edited by roles permitted by the clinic (see RBAC below).

Indexes: `(tenant_id, patient_id)`; `icd11_code`.

## Migration

- **File:** `db/migrations/0021_icd11_and_patient_diagnoses.sql`
- **Run:** From `website/`: `node scripts/run-migrations.js` (includes 0021).

## ICD-11 data (seed / import)

- **Subset seed:** `db/seed-data/icd11-subset.json` contains a fertility/reproductive-health subset of ICD-11 codes (e.g. female/male infertility, endometriosis, PCOS, recurrent pregnancy loss) with full title and description so "ICD-11 Disease Detail" can show complete text per code.
- **Script:** From `website/` run:
  - `node scripts/seed-icd11.js` — loads the subset JSON.
  - `node scripts/seed-icd11.js path/to/icd11-full.json` — loads a custom file with the same JSON shape (e.g. export from WHO ICD-11).
- Rows are upserted by `code`, so re-running is safe.

## APIs

### GET `/api/app/icd11?q=...`

- **Auth:** Session required; tenant scoped (any app user).
- **Query:** `q` — search string (code or title); optional `limit` (default 30, max 100).
- **Response:** Array of ICD-11 entities with `id`, `code`, `title`, `description`, `parentCode`, `chapterCode`, `chapterTitle`, `sectionCode`, `sectionTitle`.
- **Behaviour:** Matches `q` against `code` and `title` (case-insensitive); returns up to `limit` results ordered by code.

### GET `/api/app/patients/[patientId]/diagnoses`

- **Auth:** Session required; tenant scoped.
- **Response:** Array of diagnoses. Each item includes `id`, `icd11Code`, `customDiagnosis`, `recordedById`, `recordedAt`, `recordedByName`, and when `icd11Code` is set an `icd11` object with full detail: `code`, `title`, `description`, `chapterCode`, `chapterTitle`, `sectionCode`, `sectionTitle`.

### POST `/api/app/patients/[patientId]/diagnoses`

- **Body:** `{ "icd11Code": "GA31.Z" }` or `{ "customDiagnosis": "Free text" }` or both. At least one must be provided.
- **Validation:** If `icd11Code` is provided, it must exist in `icd11_entities`. If `customDiagnosis` is provided (non-empty), the user’s role must be in the allowed list (see RBAC).
- **Response:** Created diagnosis with full `icd11` detail when applicable.

### GET `/api/app/patients/[patientId]/diagnoses/[diagnosisId]`

- **Response:** Single diagnosis with full ICD-11 detail when `icd11Code` is set.

### PATCH `/api/app/patients/[patientId]/diagnoses/[diagnosisId]`

- **Body:** `{ "icd11Code": "..." }` and/or `{ "customDiagnosis": "..." }`. Setting a non-empty `customDiagnosis` requires an allowed role.
- **Validation:** Same as POST for `icd11Code` existence and custom-diagnosis role.

### DELETE `/api/app/patients/[patientId]/diagnoses/[diagnosisId]`

- **Response:** 204 on success; 404 if not found or not in tenant/patient scope.

## RBAC: custom diagnosis

- **Allowed roles:** `admin`, `doctor`, `nurse` (defined in API and in the patient detail page for showing the "Add custom diagnosis" option).
- Only these roles may add or edit a non-empty `custom_diagnosis`. Other roles receive 403 when attempting to POST or PATCH with `customDiagnosis` set.
- ICD-11-only diagnoses can be added by any authenticated app user with access to the patient.

## UI (patient form / detail)

- **Section:** "Diagnosis (ICD-11)" on the patient detail page (`/app/patients/[patientId]`).
- **Search ICD-11:** "Search ICD-11" opens a form: type to search by code or title (calls `GET /api/app/icd11?q=...`). Select a result; the UI shows **ICD-11 Disease Detail** (full description and chapter) for the selected code. Submit to add that ICD-11 diagnosis for the patient.
- **Custom diagnosis:** "Add custom diagnosis" is shown only when the user’s role is in the allowed list (`canAddCustomDiagnosis`). Opens a text area; submit to add a custom diagnosis (stored in `custom_diagnosis`).
- **List:** All diagnoses for the patient are listed. Expand a row to see:
  - For ICD-11: **ICD-11 Disease Detail** (full text) and chapter.
  - For custom: the free-text text.
  - Recorded date and user; Delete button.

## Summary

- Schema: `icd11_entities` + `patient_diagnoses`; migration `0021_icd11_and_patient_diagnoses.sql`.
- Seed: `db/seed-data/icd11-subset.json` + `node scripts/seed-icd11.js` (optional path for full WHO export).
- APIs: `GET /api/app/icd11`, CRUD under `/api/app/patients/[patientId]/diagnoses` with role check for custom diagnosis and full ICD-11 detail in responses.
- UI: Patient detail → Diagnosis (ICD-11) with search/select, Disease Detail display, and role-based "Add custom diagnosis".
