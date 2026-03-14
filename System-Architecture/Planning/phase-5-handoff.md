# Phase 5 — Growth & scale: Agent handoff

**Prerequisite:** Phase 4 done (patient portal, reporting, telemedicine, inventory).  
**Goal:** Implement Phase 5 growth/scale features in parallel. Each item can be assigned to a separate agent.

**Repo:** `FertilityOS` · **App:** `website/` (Next.js, React, Tailwind, Drizzle, Auth.js).  
**Conventions:** Tenant-scoped APIs, `website/db/schema.ts`, migrations in `website/db/migrations/`, add to `run-migrations.js`.

---

## 5.1 API keys / developer foundation

**Scope:** Allow tenants (admins) to create API keys for programmatic access. Foundation for future API marketplace.

- **Schema:** `api_keys` table: id, tenantId, name (e.g. "Production"), keyHash (hashed key, not plaintext), keyPrefix (e.g. "fo_xxxx" for display), lastUsedAt, expiresAt, createdAt. Generate secret with crypto; store hash (e.g. SHA-256); show prefix only after create.
- **APIs:** `GET /api/app/api-keys` (list for tenant), `POST /api/app/api-keys` (body: name, optional expiresInDays; return plain key once), `DELETE /api/app/api-keys/[id]`. All require session + tenantId.
- **UI:** `/app/developers` or Settings → API keys: list keys (name, prefix, last used, expiry), "Create key" → show secret once with copy; revoke. Nav: "Developers" or under Settings for admin.
- **Deliverables:** Schema + migration, CRUD APIs, API keys page. Document in `API-KEYS.md` (how to create, store, use; no auth middleware for external API yet—just key management).

---

## 5.2 Multi-language (i18n) foundation

**Scope:** Add i18n so the app and landing can support multiple locales. Start with EN (default) and one other (e.g. ES or AR).

- **Approach:** Use `next-intl` or Next.js i18n (App Router): locale in path (e.g. `/en/app/...`, `/es/app/...`) or middleware + cookie. Follow existing Next.js 14+ i18n patterns.
- **Scope for v1:** Landing page (hero, CTA, footer) + app shell (nav labels, dashboard titles, common buttons like "Save", "Cancel"). Store messages in JSON or TS under `messages/` or `locales/`.
- **APIs:** None required for v1 (all static messages). Optional: user preference `locale` on profile/session later.
- **UI:** Language switcher on landing and/or in app header (dropdown or toggle). Default locale from browser or cookie; persist choice in cookie.
- **Deliverables:** next-intl (or chosen lib) setup, EN + one locale, translated landing + app shell, language switcher. Document in `I18N-SETUP.md`.

---

## 5.3 Referral program

**Scope:** Let clinics share a referral link/code; track referrals (who signed up via link). No payout or rewards logic in v1.

- **Schema:** `referral_codes` table: id, tenantId, code (unique per tenant, e.g. "CLINIC2025"), createdById (FK users), note (optional), usedCount (default 0), createdAt. Optional: `referral_signups` (id, referralCodeId, email, signedUpAt) to track who used the code.
- **APIs:** `GET /api/app/referrals` (list codes for tenant), `POST /api/app/referrals` (create code; body: code, note?), `PATCH /api/app/referrals/[id]` (optional: update note). On clinic registration, accept optional `?ref=CODE` and increment usedCount (and optionally insert referral_signups). Document public registration flow with ref param.
- **UI:** `/app/referrals` or under Settings: list referral codes with shareable link (e.g. `https://app.thefertilityos.com/register?ref=CLINIC2025`), used count, "Copy link". Create new code form. Nav: "Referrals" for admin.
- **Deliverables:** Schema + migration, APIs, referrals page, registration page reads `ref` and records use. Document in `REFERRAL-PROGRAM.md`.

---

## 5.4 Compliance checklist (HIPAA-style)

**Scope:** Document and optionally surface in-app compliance controls for admins. No backend storage for v1—static checklist and doc.

- **Docs:** Create `System-Architecture/Compliance/hipaa-checklist.md` (or `COMPLIANCE.md` in repo root) with sections: Access control, Encryption (data at rest/transit), Audit logs, BAA, Risk assessment, etc. Each item: short description + checkbox-style "FertilityOS implements: …" so clinics can map to HIPAA (or similar). Link from main README or docs.
- **Optional UI:** `/app/compliance` or under Settings: "Compliance checklist" page for admin—read-only list of controls (from markdown or static JSON) with status "Implemented" / "Planned" / "N/A". No DB required for v1; can be hardcoded list that matches the doc.
- **Deliverables:** Compliance doc (hipaa-checklist.md or COMPLIANCE.md), optional in-app checklist page. No migration.

---

## Execution

- One agent per item (5.1–5.4). Agents can run in parallel.
- Follow existing patterns: tenant-scoped APIs, Drizzle schema, migrations in `website/db/migrations/`, add filenames to `run-migrations.js`.
- After each item: merge, run new migrations if any, update `next-steps-development.md` and `product-roadmap.md` as needed.
