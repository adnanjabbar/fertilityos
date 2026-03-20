# Audit logging (Phase 6.2)

FertilityOS records key actions in an `audit_logs` table for compliance and debugging. This document describes what is logged and how to use the audit log.

## Schema

- **Table:** `audit_logs`
- **Columns:** `id`, `tenant_id`, `user_id` (nullable), `action`, `entity_type`, `entity_id` (nullable), `details` (text, often JSON), `ip_address` (optional), `created_at`

Migrations: `db/migrations/0017_audit_logs.sql`. Run with `node scripts/run-migrations.js` from `website/`.

## What is logged

The following actions are instrumented:

| Action           | Entity type | When |
|------------------|-------------|------|
| `auth.sign_in`   | user        | User signs in (credentials or portal magic link). |
| `patient.create` | patient     | A new patient is created (POST /api/app/patients). |
| `patient.update` | patient     | A patient is updated (PATCH /api/app/patients/[id]). |
| `invoice.create` | invoice     | A new invoice is created (POST /api/app/invoices). |
| `user.invite`    | invitation  | An invitation is created (POST /api/app/invitations). |
| `report.csv_export` | report   | User downloads the clinic report CSV (GET /api/app/reports/export). Details: date range, optional location filter. |
| `clinic_self_registered` | tenant | Successful self-service clinic + admin creation (POST /api/auth/register-clinic). Details: `slug`, `country` (ISO2). |

- **User:** The acting user’s ID (and name in the UI) when available. Sign-in and invite are always tied to a user; other actions use the session user.
- **Details:** Optional JSON or text (e.g. `{ "firstName", "lastName" }` for patient create/update, `{ "invoiceNumber", "patientId" }` for invoice create, `{ "email", "roleSlug" }` for invite).
- **IP address:** Captured from `x-forwarded-for` or `x-real-ip` when the request is available (not set for sign-in from the auth callback).

## How to use the audit log

### Backend: logging new actions

1. Import the helper and (if you have a request) IP helper:

   ```ts
   import { logAudit, getClientIp } from "@/lib/audit";
   ```

2. After a successful key action, call:

   ```ts
   await logAudit({
     tenantId: session.user.tenantId,
     userId: session.user.id,  // or null if no user
     action: "entity.verb",   // e.g. "appointment.create"
     entityType: "entity",     // e.g. "appointment"
     entityId: created.id,    // optional
     details: { ... },        // optional object or string
     ipAddress: getClientIp(request),  // optional
   });
   ```

3. Use consistent action names (e.g. `entity.create`, `entity.update`, `entity.delete`).

### API: listing logs

- **Endpoint:** `GET /api/app/audit-logs`
- **Access:** Admin only (tenant-scoped).
- **Query parameters:**
  - `action` – filter by action (e.g. `patient.create`).
  - `entityType` – filter by entity type (e.g. `patient`).
  - `dateFrom` – ISO date string (inclusive).
  - `dateTo` – ISO date string (inclusive).
  - `limit` – max number of rows (default 100, max 500).

Response is an array of objects with: `id`, `userId`, `userName`, `action`, `entityType`, `entityId`, `details`, `ipAddress`, `createdAt`.

### UI

- **Page:** `/app/audit-logs` (admin only).
- **Nav:** “Audit log” in the app header (admin users only).
- The page shows a table of recent logs with filters (action, entity type, date range, limit). User name is shown when available.

## Adding more actions

To instrument another route:

1. In the API route, after the mutation succeeds, call `logAudit(...)` with the appropriate `action`, `entityType`, and optional `entityId` and `details`.
2. Optionally pass `getClientIp(request)` for `ipAddress`.
3. Document the new action in this file under “What is logged”.

## Retention and compliance

- Logs are stored per tenant; only admins can list them.
- Retention and archival are not implemented in this phase; consider a cron or external process to archive or purge old logs according to policy.
- For HIPAA/GDPR, ensure access to the audit log and retention are covered in your compliance documentation.
