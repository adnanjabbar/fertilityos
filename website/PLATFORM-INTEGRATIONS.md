# Platform integrations — tenant-owned credentials

FertilityOS is an **end-to-end platform**. We do **not** provide or pay for third-party services (SMS, video, WhatsApp, email delivery). Tenants (clinics) add their **own credentials** and use their **own accounts and payment plans**. We only provide the integration surface.

## Current integrations

### SMS (Twilio)

- **Where:** Settings → Integrations (admin only).
- **Storage:** `tenant_integrations.twilio_account_sid`, `twilio_auth_token`, `twilio_phone_number`.
- **Used for:** Appointment reminders (when tenant sets reminder channel to SMS or Both), portal 2FA OTP.
- **No platform key:** There is no `TWILIO_*` env var at the app level. Each clinic configures Twilio in the app.

### Video (Daily.co)

- **Where:** Settings → Integrations (admin only).
- **Storage:** `tenant_integrations.daily_api_key`.
- **Used for:** Telemedicine appointment rooms (Start/Join video call).
- **No platform key:** There is no `DAILY_API_KEY` env var. Each clinic adds their Daily.co API key.

## Future integrations (same model)

- **WhatsApp:** Tenants will connect their own WhatsApp Business API (or provider) credentials. We will only embed/integrate; no platform WhatsApp account or cost.
- **Newsletter / patient emails:** Automatic email processing for clinics:
  - **Default (our server):** Emails sent via our infrastructure with **FertilityOS branding** in the footer.
  - **Premium (custom domain):** Clinic attaches their domain; emails sent from their name/domain with **no FertilityOS branding** in the footer (premium option).
- **Other:** Any future third-party service (e.g. LIS, accounting) will follow the same pattern: tenant-owned credentials, no platform keys or recurring cost for us.

## API and schema

- **GET /api/app/integrations** — Returns `twilioConfigured`, `dailyConfigured`, masked phone (no secrets).
- **PATCH /api/app/integrations** — Body: `twilioAccountSid`, `twilioAuthToken`, `twilioPhoneNumber`, `dailyApiKey`. Admin only.
- **Schema:** `tenant_integrations` (one row per tenant). Migration: `0025_tenant_integrations_and_trial_signups.sql`.

## Security

- Tokens and API keys are stored per tenant and used only in server-side code (cron, API routes). Never exposed to the client.
- Admin-only UI for editing. Consider encrypting `twilio_auth_token` and `daily_api_key` at rest in a future iteration if required by compliance.
