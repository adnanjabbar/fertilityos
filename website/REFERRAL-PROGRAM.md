# Referral Program

FertilityOS lets clinics share referral links so that when another clinic registers via the link, the signup is attributed to the referring clinic’s code. No payout or rewards logic is included in v1—this is tracking only.

## How it works

1. **Create a referral code**  
   An admin goes to **Referrals** in the app, creates a code (e.g. `CLINIC2025`) and can add an optional note.

2. **Share the link**  
   Each code has a shareable registration link, e.g.  
   `https://your-domain.com/register?ref=CLINIC2025`  
   Use **Copy link** on the Referrals page to copy it.

3. **Someone registers**  
   When a new clinic completes registration after opening that link (or any URL that includes `?ref=CLINIC2025`), the system:
   - Finds the referral code (by `ref`; optionally by tenant if you use `&tenant=slug`)
   - Increments that code’s **used count**
   - Optionally records the signup in `referral_signups` (email + time)

4. **View usage**  
   On the Referrals page, admins see each code’s **used** count and when it was created.

## Sharing the link

- **Simple link:**  
  `https://your-domain.com/register?ref=YOUR_CODE`  
  Use this when the code is unique or you only have one code.

- **With tenant (optional):**  
  `https://your-domain.com/register?ref=YOUR_CODE&tenant=your-clinic-slug`  
  Use this in multi-tenant setups when the same code might exist for more than one clinic. The `tenant` query param is the clinic’s slug so the system can attribute the signup to the correct referral code.

Share the link by email, messaging, or any channel. The new clinic’s admin just opens the link and completes the normal registration form; the `ref` (and optional `tenant`) are sent with the request and recorded automatically.

## APIs

- **GET /api/app/referrals**  
  List referral codes for the current tenant. Requires auth and admin role.

- **POST /api/app/referrals**  
  Create a code. Body: `{ "code": "CLINIC2025", "note": "Optional note" }`. Requires auth and admin role.

- **PATCH /api/app/referrals/[id]**  
  Update a code (e.g. `note`). Body: `{ "note": "New note" }`. Requires auth and admin role.

## Registration flow with `ref`

The clinic registration API accepts optional body fields:

- **ref** – referral code (e.g. from `?ref=CLINIC2025`).
- **tenantSlug** – optional tenant slug (e.g. from `?tenant=my-clinic`) to disambiguate when the same code exists for multiple tenants.

The register page reads `ref` and `tenant` from the URL and sends them in the POST body. If a matching referral code is found, its `usedCount` is incremented and a row is added to `referral_signups` with the new admin’s email and timestamp.

## Data model

- **referral_codes**  
  `id`, `tenantId`, `code` (unique per tenant), `createdById`, `note`, `usedCount`, `createdAt`.

- **referral_signups**  
  `id`, `referralCodeId`, `email`, `signedUpAt`.

Migrations: see `db/migrations/0014_referral_codes.sql`. Add new migrations to `scripts/run-migrations.js` and run with `node scripts/run-migrations.js` from `website/`.
