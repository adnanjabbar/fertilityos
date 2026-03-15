# Formulary & Prescriptions (Phase 7.2)

This document describes the clinic formulary (medication database) and prescription workflow in FertilityOS.

## Overview

- **Formulary**: Clinic-owned list of medications. All prescriptions must reference only items from the formulary or from a clinic-created **medication group** (protocol), e.g. "IVF Protocol". There is no free-text medication entry.
- **Prescriptions**: Prescriptions are always tied to a patient and list one or more medications (from formulary) or one protocol (medication group). Each prescription has status (prescribed → dispensed → completed / cancelled) and optional start/end dates and notes.

## Schema

### Medications (formulary)

- **Table**: `medications`
- **Fields**:
  - `id`, `tenant_id`, `brand_name`, `generic_name`, `dosage`, `form` (enum: tablet, capsule, injection, suppository, pessary, syrup, cream, gel, drops, inhaler, other)
  - `frequency_options` (JSONB array): e.g. OD, BD, TDS, QID, at_night, at_morning, once_weekly, twice_weekly, half_monthly, once_monthly, as_needed, other
  - `instructions_checkboxes` (JSONB): pregnancy_safe, lactation_safe, addiction_risk, dependency_risk, drug_interaction_risk, cautions
  - `instructions_extended` (text), `pharmaceutical_company` (optional), `created_at`, `updated_at`

### Medication groups (protocols)

- **Table**: `medication_groups`
  - `id`, `tenant_id`, `name`, `description`, `created_at`, `updated_at`
- **Table**: `medication_group_items`
  - `id`, `medication_group_id`, `medication_id` (FK to medications), `quantity_per_cycle`, `default_duration_days`, `sort_order`, `created_at`

### Prescriptions

- **Table**: `prescriptions`
  - `id`, `tenant_id`, `patient_id`, `prescribed_by_id` (user), `status` (prescribed | dispensed | completed | cancelled), `start_date`, `end_date`, `notes`, `created_at`, `updated_at`
- **Table**: `prescription_lines`
  - Each line is **either** one medication (`medication_id` set) **or** one medication group (`medication_group_id` set).
  - `id`, `prescription_id`, `medication_id` (nullable), `medication_group_id` (nullable), `quantity`, `duration_days`, `frequency`, `instructions_override`, `created_at`

**Rule**: When creating a prescription, the user selects either (a) one or more medications from the formulary, or (b) one medication group (protocol). No typing medication names—only pick from formulary or protocol.

## Migrations

- `0022_formulary_prescriptions.sql`: creates enums `medication_form`, `prescription_status`, and tables `medications`, `medication_groups`, `medication_group_items`, `prescriptions`, `prescription_lines`.
- Run from `website/`: `node scripts/run-migrations.js` (ensure `DATABASE_URL` is set in `website/.env`).

## APIs

All under `website/app/api/app/`, tenant-scoped and auth-required.

### Formulary

- **GET** `/api/app/medications` — list medications for the tenant.
- **POST** `/api/app/medications` — create medication (body: brandName, genericName, dosage, form, frequencyOptions[], instructionsCheckboxes{}, instructionsExtended, pharmaceuticalCompany).
- **GET** `/api/app/medications/[id]` — get one medication.
- **PATCH** `/api/app/medications/[id]` — update medication.
- **DELETE** `/api/app/medications/[id]` — delete medication.

### Medication groups (protocols)

- **GET** `/api/app/medication-groups` — list groups.
- **POST** `/api/app/medication-groups` — create group (name, description).
- **GET** `/api/app/medication-groups/[id]` — get one group.
- **PATCH** `/api/app/medication-groups/[id]` — update group.
- **DELETE** `/api/app/medication-groups/[id]` — delete group.
- **GET** `/api/app/medication-groups/[id]/items` — list items (with medication details).
- **POST** `/api/app/medication-groups/[id]/items` — add medication to group (medicationId, quantityPerCycle?, defaultDurationDays?, sortOrder?).
- **PATCH** `/api/app/medication-groups/[id]/items/[itemId]` — update item (quantityPerCycle, defaultDurationDays, sortOrder).
- **DELETE** `/api/app/medication-groups/[id]/items/[itemId]` — remove item from group.

### Prescriptions

- **GET** `/api/app/patients/[patientId]/prescriptions` — list prescriptions for the patient (with lines expanded: medication or groupName/groupItems).
- **POST** `/api/app/patients/[patientId]/prescriptions` — create prescription. Body:
  - **From formulary**: `lines: [{ medicationId, quantity?, durationDays?, frequency?, instructionsOverride? }, ...]`, plus optional `startDate`, `endDate`, `notes`.
  - **From protocol**: `medicationGroupId`, optional `quantity`, `durationDays`, `frequency`, `instructionsOverride`, `startDate`, `endDate`, `notes`.
- **GET** `/api/app/prescriptions/[id]` — get one prescription with lines (medication or group details).
- **PATCH** `/api/app/prescriptions/[id]` — update prescription (status, startDate, endDate, notes; optional `lines` to replace lines with formulary-only lines).

Validation: `medicationId` and `medicationGroupId` must belong to the tenant’s formulary/groups.

## UI

- **Formulary & protocols** (`/app/medications`): Admin-only nav link under "Lab & programs". Tabs:
  - **Formulary**: List medications; add/edit with brand name, generic name, dosage, form, frequency options (multi-select), instruction checkboxes (pregnancy safe, lactation, addiction risk, etc.), extended instructions, pharmaceutical company. Hint: "Adding instructions helps patients follow their medication plans."
  - **Protocols**: List medication groups; add/edit group; expand to add/remove medications from formulary with optional quantity per cycle and default duration; reorder via sortOrder.
- **Patient detail → Prescriptions**: Section "Prescriptions" with same hint. List prescriptions (date, prescriber, status, lines with med name/dosage/frequency/duration). "Add prescription" → choose "From formulary" (multi-select medications) or "From protocol" (select one group); optional quantity, duration, frequency, start/end date, instructions override, notes.

## Nav

- **Formulary** link appears in the app sidebar under "Lab & programs" for admin users (with Inventory and Surrogacy).
