# Multi-currency display & conversion (roadmap)

## Current behavior (shipping)

- **Tenant** `default_currency` is set at registration / admin settings (ISO 4217).
- **Region & language** picker shows **language | default currency code** per country (from `country-state-city`), for UX context only — **no FX conversion** in app totals yet.
- **Super admin** can enable **which UI locales** are live via **Platform → Languages** (stored in `platform_settings.approved_locales`), overriding `NEXT_PUBLIC_APPROVED_LOCALES` when configured.

## Target behavior (phased)

### Phase A — Display preference (no rate engine)

- Visitor selects **display currency** (e.g. USD while clinic is PKR).
- Show **approximate** amounts next to native currency **using a cached daily rate** table (admin or provider).
- Clear label: “Estimated in USD” / “For display only; invoices in PKR.”

### Phase B — Authoritative billing currency

- Stripe and invoices stay in **tenant billing currency**.
- Patient-facing quotes may show converted estimates with **disclaimer** and **rounding rules**.

### Phase C — Super admin country rollout

- Per-country rows: enabled languages + default currency.
- Optional: disable signup from certain countries until compliance review.

## Implementation notes

- **Rates**: ECB, Open Exchange Rates, or Stripe balance FX — pick one source of truth; store `base`, `quote`, `rate`, `as_of`.
- **Rounding**: Per currency minor units; never mix precision in DB — store **minor units integer** + currency code.
- **Audit**: Log display currency changes for support.

## References (industry patterns)

- Booking.com / Airbnb: **display currency** toggle with disclaimer.  
- Shopify: **store currency** vs **customer display** with market pricing.  
- Stripe: **charge currency** vs **settlement** — keep charges aligned with legal entity and tax.
