# Pricing and communications strategy

## Pricing (website and product)

### Plan pricing (live on landing)

| Plan    | Monthly | Quarterly (~5% off) | Yearly (~20% off) |
|---------|---------|----------------------|-------------------|
| Starter | $29.99  | $85                  | $287              |
| Growth  | $49.99  | $142                 | $479              |
| Scale   | $79.99  | $228                 | $767              |

- **14-day free trial** on all plans. Trial signup (email + optional phone) is stored in `trial_signups` so the same contact cannot request multiple trials.
- Stripe Checkout is created with `trial_period_days: 14` when the tenant subscribes from the app.

### Module add-ons

- **Smaller modules:** $4.99/month (e.g. Patient Portal, Inventory, Compliance & Audit).
- **Larger / complex modules:** $6.99/month (e.g. Telemedicine, Donor Management, Analytics & Reporting).
- Exact mapping and Stripe price IDs to be decided; landing page shows the above add-on bands.

### Future pricing

- Further pricing strategy (e.g. per-provider, per-location, enterprise) to be decided and documented here.

---

## Communications: platform vs tenant-owned

### Principle

We provide the **platform**. Tenants use **their own** accounts and payment for:

- SMS (Twilio) — configured in Settings → Integrations.
- Video (Daily.co) — configured in Settings → Integrations.
- WhatsApp (future) — tenants will add their WhatsApp Business API / provider credentials; we only integrate.
- Email delivery (future) — two options:
  - **Default:** Our server, our branding (e.g. “Sent via FertilityOS” in footer). No extra cost to tenant beyond plan.
  - **Premium:** Tenant’s own domain and SMTP/sending; no FertilityOS branding in footer; premium feature.

### WhatsApp (upcoming)

- **Patient updates / messaging:** Integrate so tenants can use their own WhatsApp Business (or provider) account for reminders, updates, and automation.
- **Automation:** Same model — tenant credentials, we provide flows and embedding (e.g. templates, triggers, logging).

### Newsletter / automated emails (upcoming)

- Automatic email processing for clinics:
  - Emails to patients sent from clinic name and/or their domain when attached.
  - Our server option: FertilityOS branding in footer.
  - Premium: custom domain, no FertilityOS in footer.

---

## Trial and abuse prevention

- **Table:** `trial_signups` (email unique, optional phone, clinic name).
- **API:** POST `/api/landing/trial-request` — if email already exists, returns `allowed: false, reason: "already_requested"`.
- **Waitlist / trial form:** Submits to the API; shows “Already registered” when the email was used before. Encourages one 14-day trial per clinic.
