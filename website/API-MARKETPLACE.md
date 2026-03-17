# API Marketplace and Integrations Catalog (Phase 9.2)

FertilityOS exposes a **public Integrations catalog** so prospects and partners can see available connectors and where to configure them.

## Public Page

- **URL:** `/integrations`
- **Content:** List of integrations with name, short description, and links to:
  - **Configure in Dashboard** — for logged-in users, links to the relevant app settings (e.g. `/app/settings/integrations`, `/app/settings/lab-integration`, `/app/billing`, `/app/developers`).
  - **Docs** — external provider documentation when applicable.

## Catalog Entries (Current)

| Integration | Category   | Configure path                    | Docs |
|-------------|------------|------------------------------------|------|
| Twilio      | Messaging  | /app/settings/integrations         | Yes  |
| Daily.co    | Telemedicine| /app/settings/integrations         | Yes  |
| WhatsApp    | Messaging  | /app/settings/integrations         | Yes  |
| Stripe      | Billing    | /app/billing                       | Yes  |
| Resend      | Email      | /app/settings/integrations         | Yes  |
| LIS / Lab   | Lab        | /app/settings/lab-integration      | —    |
| Google Sign-In | Auth    | /app/settings/integrations         | Yes  |
| API Keys    | Developers | /app/developers                    | —    |

Data is defined in `app/integrations/page.tsx` (static list). For a future v2 you could move entries to a database table or JSON and optionally support “Enable/disable per tenant” from Super Admin.

## Footer

The site footer (Product column) includes an **Integrations** link to `/integrations`.

## Optional: Admin Enable/Disable per Tenant

Phase 9.2 does not implement per-tenant enable/disable for each integration. To add it:

1. Add a table or JSON column (e.g. `tenant_integration_flags` or `tenants.enabled_integrations`) listing which integration IDs are enabled per tenant.
2. In app settings pages, check the flag before showing the form or allow Super Admin to toggle flags per tenant.
3. Optionally show only “enabled” integrations on the public catalog for a given tenant (e.g. when logged in and viewing from a tenant context).

## References

- [Phase 9 handoff](../System-Architecture/Planning/phase-9-handoff.md)
- [Platform integrations](./PLATFORM-INTEGRATIONS.md)
