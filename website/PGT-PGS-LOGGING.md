# PGT/PGS Results Logging (Phase 7.1)

This document describes the embryo genetic testing (PGT/PGS) results logging feature in the IVF module.

## Overview

Clinics can record preimplantation genetic testing results per embryo for compliance and reporting. Results are stored in a dedicated table and scoped by tenant and embryo.

## Schema

- **Table:** `embryo_genetic_results`
- **Enums:**
  - `embryo_genetic_result_test_type`: `PGT-A`, `PGT-M`, `PGT-SR`, `PGT-HLA`, `other`
  - `embryo_genetic_result_result`: `euploid`, `aneuploid`, `mosaic`, `inconclusive`

**Columns:**

| Column        | Type      | Description                                      |
|---------------|-----------|--------------------------------------------------|
| id            | uuid      | Primary key                                      |
| tenant_id     | uuid      | FK → tenants (tenant-scoped)                     |
| embryo_id     | uuid      | FK → embryos (cascade delete)                    |
| test_type     | enum      | PGT-A, PGT-M, PGT-SR, PGT-HLA, other            |
| result        | enum      | euploid, aneuploid, mosaic, inconclusive         |
| result_date   | timestamptz | When the result was reported                    |
| lab_reference | varchar(255) | Optional lab reference number/specimen id      |
| notes         | text      | Optional free-text notes                         |
| created_at    | timestamptz | Set on insert                                  |
| updated_at    | timestamptz | Set on update                                  |

**Migration:** `db/migrations/0019_embryo_genetic_results.sql`. Run with `node scripts/run-migrations.js` from `website/`.

## APIs

All endpoints require an authenticated session with `tenantId`. Access is scoped by embryo and tenant (embryo must belong to the tenant).

- **GET** `/api/app/embryos/[id]/genetic-results`  
  Returns the list of genetic results for the embryo, ordered by result date descending.

- **POST** `/api/app/embryos/[id]/genetic-results`  
  Creates a new genetic result for the embryo.  
  Body: `{ testType, result, resultDate, labReference?, notes? }`.

- **PATCH** `/api/app/embryos/[id]/genetic-results/[resultId]`  
  Updates an existing genetic result.  
  Body: partial `{ testType?, result?, resultDate?, labReference?, notes? }`.

## UI

- **Location:** Patient detail → IVF cycles → expand a cycle → **Embryos** table.
- **Behavior:** Each embryo row has a “Genetic testing” link. Clicking it expands a **Genetic testing** section for that embryo:
  - List of existing results (test type, result, date, lab reference, notes).
  - “Add genetic result” opens a form (test type, result, result date, optional lab reference and notes).
  - Each result has an “Edit” action to change fields and save via PATCH.

Navigation follows the existing IVF/Patients flow (left sidebar → Patients → select patient → IVF tab).

## Compliance and reporting

- Data is tenant-scoped and tied to an embryo (and thus to a cycle and patient).
- Result date and optional lab reference support audit and external lab reconciliation.
- Use notes for clinic-specific comments or follow-up.
