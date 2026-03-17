# Enterprise and White-Label (Phase 9.3)

FertilityOS supports white-label branding so clinics can present their own logo and colors in the app.

## Tenant Branding (Settings → Letterhead & printing)

Admins can configure:

- **Logo URL** — Used in the app sidebar (and letterhead when set). Must be a full URL to an image (e.g. PNG or SVG). Leave empty to show the default FertilityOS icon.
- **Primary color (hex)** — Used for active nav state in the sidebar (e.g. `#2563eb`). Leave empty for default blue.
- **Show “Powered by FertilityOS” in the app** — When checked, a small “Powered by FertilityOS” link appears in the sidebar footer. Uncheck for a fully white-labeled look.

Configuration is stored in `tenant_branding` (columns `logo_url`, `primary_color`, `show_powered_by`). The app layout loads branding and passes it to the sidebar.

## Custom Domain

Tenants can use a subdomain (e.g. `clinic.thefertilityos.com`) or connect a custom domain. Subdomain is derived from the tenant slug. Custom domain wiring (CNAME, SSL) is handled at the infrastructure level; the app does not store a custom domain field by default.

## Optional: Login Screen Branding

Phase 9.3 does not change the login page. To add tenant-specific login branding:

1. Resolve tenant from hostname (subdomain or custom domain) or a query parameter.
2. Load that tenant’s branding (logo, primary color).
3. Render the login page with tenant logo and optional primary color.

## Optional: SAML / OIDC SSO

Enterprise SSO (SAML or OIDC) for staff sign-in is not implemented in Phase 9.3. To add it:

1. Configure NextAuth with a SAML or OIDC provider (e.g. `next-auth` SAML provider or OIDC).
2. Store IdP metadata or issuer per tenant (e.g. `tenant_sso_config` table).
3. On login, redirect to the tenant’s IdP when SSO is enabled; otherwise use credentials or social providers.

## References

- [Phase 9 handoff](../System-Architecture/Planning/phase-9-handoff.md)
- [Branding API](./app/api/app/branding/route.ts)
- [Letterhead & printing settings](./app/app/settings/letterhead/)
