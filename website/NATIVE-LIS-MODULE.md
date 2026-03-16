# Native LIS (Lab Information Management System) Module

TheFertilityOS includes a **native Lab Information Management System (LIS)** so clinics can manage lab orders, specimens, test catalog, and results in-house—without requiring an external FHIR/HL7 LIS. Optional **Lab integration** (Settings → Lab integration) remains available to connect external LIS/LIMS and import results.

## Overview

- **Native LIS:** Full lab workflow inside the platform: test catalog, specimens, orders, order line items, result entry.
- **Module slug:** `labManagement`. Enable per tenant via Super Dashboard (tenant modules) or `tenants.enabled_modules`.
- **Roles:** Admin, Lab Tech, Embryologist, and Doctor can access the Lab module (when enabled).
- **Nav:** "Lab" under **Lab & programs** (left sidebar) → `/app/lab`.

## Schema (migration 0030_native_lis.sql)

| Table | Purpose |
|-------|--------|
| **lab_specimens** | Specimen tracking: patient, type, collected/received at, status. |
| **lab_tests** | Test catalog per tenant: code, name, unit, reference ranges, `is_panel`. |
| **lab_panels** | Panel = one test (panel) linking to multiple member tests; `panel_test_id` + `member_test_id`. |
| **lab_order_items** | Line items for an order: test, specimen (optional), status, result value/unit/reference, result_at, performed_by. |
| **lab_orders** | Existing; native orders have `connector_id` = null. Optional `specimen_id` FK to lab_specimens. |

## APIs

- **GET /api/app/lab/orders** — List native lab orders (connector_id is null) with patient name, status, requested/result dates.
- **POST /api/app/lab/orders** — Create native order. Body: `{ patientId, testIds: uuid[] }`. Creates one `lab_orders` row and one `lab_order_items` per test.
- **GET /api/app/lab/orders/[id]** — Order detail with items (test code/name, status, result value).
- **GET /api/app/lab/tests** — List tenant lab tests (catalog) for building orders.

## UI

- **/app/lab** — Lab home: list of native orders, "New order" button, link to Settings → Lab integration.
- **/app/lab/new** — New order: select patient, select tests (from catalog), submit. If no tests exist, message to add tests (catalog UI or API/DB).
- **/app/lab/orders/[id]** — Order detail: patient, status, requested/result dates, list of order items (test + result).

## Relationship to Lab integration (Phase 8.3)

- **Lab integration** (Settings → Lab integration): Configure *external* LIS/LIMS connectors (FHIR, custom API, file import). Orders/results imported from outside go into `lab_orders` with `connector_id` set.
- **Native LIS:** Orders created and managed inside the platform; `connector_id` is null. Use test catalog, specimens, and order items for full in-house workflow.
- Both can coexist: some orders from external LIS, some native.

## Next steps (future work)

- **Test catalog UI:** CRUD for `lab_tests` and `lab_panels` (e.g. Settings → Lab catalog or /app/lab/tests).
- **Specimens UI:** Create/list specimens, link to orders and order items.
- **Result entry:** Form to enter result value/unit per order item, set status, sign off (performed_by).
- **Reporting:** Export results, reference range flags, cumulative reports.
- **Optional:** QC, instruments, batch result entry.
