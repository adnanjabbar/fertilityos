# Email and domain — sending and (optional) inbox

DigitalOcean App Platform **does not** provide email hosting. Connecting your domain (thefertilityos.com) to the app is for **web traffic only** (HTTPS, routing). You cannot create mailboxes or an inbox on App Platform itself.

## FertilityOS production setup (summary)

- **Sending:** All app email (confirmation links, password reset, reminders, campaigns) is sent via **Resend**. Set **`RESEND_API_KEY`** in DigitalOcean App Platform environment variables (never commit the key to the repo). From address can be `FertilityOS <noreply@thefertilityos.com>` (default) or override with `REMINDER_FROM_EMAIL`.
- **Receiving:** Forward incoming mail for your domain to a single inbox (e.g. **Cloudflare Email Routing**). Recommended: forward `support@thefertilityos.com`, `hello@thefertilityos.com`, `noreply@thefertilityos.com` (and any other addresses you use) to **thefertilityos@gmail.com** so all mail lands in one Gmail inbox. See “Recommended: receive for free” below.

For **sending** emails to customers (confirmation links, password reset, reminders), the app uses a **transactional email API**. You do **not** need a real mailbox for that — only domain verification and an API key.

---

## Why not Postfix on “our app server”?

**App Platform is not a server you can log into.** It runs your app (Next.js) in a managed container. There is no SSH, no root access, and no way to install Postfix or any other system service. So “install Postfix on the app server” is **not possible** on DigitalOcean App Platform.

If you moved the app to a **Droplet** (VPS), you could in theory install Postfix there, but:

- **DigitalOcean blocks SMTP ports (25, 465, 587) by default** on Droplets to limit spam and abuse. You can request an unblock from support, but it is not guaranteed and is often denied.
- DO **discourages** self-hosted mail due to deliverability (IP reputation, spam filters), security, and maintenance. Many receiving providers will treat mail from small/unknown IPs as spam.
- Running a full mail stack (Postfix + Dovecot for IMAP, spam filtering, DKIM/SPF/DMARC) is non-trivial and ongoing work.

**Recommendation:** Keep the app on App Platform and **do not** self-host mail on a Droplet. Use a dedicated receive solution (free or low-cost) and keep Resend for sending.

---

## Recommended: receive for free (Cloudflare) + Resend for send

To have **many addresses** at your domain (support@, hello@, noreply@, etc.) and **receive** mail without paying per mailbox:

| Role | Solution | Cost |
|------|----------|------|
| **Sending** (app emails, confirmation links) | **Resend** (already in the app) | Resend’s pricing (generous free tier) |
| **Receiving** (incoming mail to your addresses) | **Cloudflare Email Routing** | **Free** |

**Cloudflare Email Routing** lets you create **unlimited** addresses at your domain (e.g. `support@thefertilityos.com`, `hello@thefertilityos.com`). Incoming mail is **forwarded** to any existing inbox you choose (e.g. your Gmail). You don’t get a separate “inbox UI” for each address — you receive everything in the destination mailbox you set. There is no per-address fee.

**Setup (high level):**

1. Use **Cloudflare** for DNS for thefertilityos.com (or add the domain to Cloudflare).
2. In Cloudflare: **Email → Email Routing → Get started**. Enable routing; Cloudflare will add the needed MX (and optionally SPF) records.
3. Create **custom addresses**: e.g. `support@thefertilityos.com` → forward to `your-personal@gmail.com`. Add as many as you need.
4. **Sending** stays on **Resend** (your app already uses it). Resend only needs SPF/DKIM for the domain; that works alongside Cloudflare’s MX for receiving (see Resend + Cloudflare docs if you use both).

Result: you can give out support@, hello@, etc., **receive** all mail (forwarded to you), and **send** from the app via Resend — without running Postfix or paying for Google Workspace.

**If you want a real inbox** (log into support@thefertilityos.com in a webmail UI) at low cost: **Migadu** offers unlimited domains and mailboxes for a flat fee (much cheaper than Google/Microsoft as you add addresses). **Zoho Mail** has a free tier for a few users. Both work alongside Resend for sending.

---

## 1. Sending emails (confirmation links, password reset, reminders)

The app already uses **[Resend](https://resend.com)**. To send from `noreply@thefertilityos.com` (or similar):

### Steps

1. **Sign up** at [resend.com](https://resend.com) and create an API key (e.g. under **API Keys**).
2. **Add your domain** in Resend: open the **[Resend Dashboard](https://resend.com/domains)** → in the left sidebar click **Domains** → click **Add Domain** → enter `thefertilityos.com` (or your root domain) → click **Add**.
3. **Where to find SPF and DKIM:** After adding the domain, Resend shows the domain in the list. **Click the domain name** (e.g. `thefertilityos.com`) to open its detail page. There you will see:
   - **DKIM:** a **TXT** record — Resend shows the **Name** (e.g. `resend._domainkey.thefertilityos.com` or a similar subdomain) and the **Value** (a long string starting with something like `p=MIGfMA0GCS...`). Copy both.
   - **SPF:** a **TXT** record — usually for `send.thefertilityos.com` or your domain, with a value like `v=spf1 include:amazonses.com ~all`.
   - **Return-path (optional):** sometimes an **MX** record for the `send` subdomain for bounces.
   If you don’t see a “Verify” or “DNS records” section, click the domain row or the **Verify** / **View DNS records** button on that domain’s card. The exact label can be “DNS records”, “Records to add”, or “Verify domain”.
4. **Add those records** at your DNS provider (Cloudflare, Namecheap, DigitalOcean DNS, etc.): create **TXT** (and MX if shown) with the **exact** Name and Value Resend gives you.
5. Back in Resend, click **Verify** (or “Verify DNS records”) once DNS has propagated (often 5–15 minutes). The domain status should change to **Verified**.
5. In **DigitalOcean** → your app → **Settings → Environment variables**, add:
   - **`RESEND_API_KEY`** = your Resend API key (e.g. `re_...`).
   - Optional: **`REMINDER_FROM_EMAIL`** = `FertilityOS <noreply@thefertilityos.com>` (this is the default in code).
6. **Redeploy** the app so the new env var is picked up.

After that, all app emails (magic links, password reset, set-password, appointment reminders, campaign emails) will be sent via Resend from your domain. No inbox or mailbox is required for sending.

---

## 2. Optional: real mailboxes (inbox) for your team

If you want **real email addresses** at your domain (e.g. `support@thefertilityos.com`, `hello@thefertilityos.com`) with an **inbox** you can log into:

- Use a separate **email hosting** provider. DigitalOcean does not offer this.
- **Options** (examples; not endorsed):
  - **Google Workspace** — familiar inbox, calendar; paid per user.
  - **Microsoft 365** — Outlook, Exchange; paid per user.
  - **Zoho Mail** — lower cost; free tier for a few users; good for small teams.
  - **Migadu** — flat fee for unlimited domains/mailboxes; good for small teams.

**How it works:** You add **MX records** for `thefertilityos.com` (and optionally subdomains) at your DNS provider, pointing to the email host’s servers. That host then receives and stores mail for addresses you create (support@, etc.). Your app’s **sending** can stay on Resend; receiving is entirely handled by the email host.

**Conflict with Resend:** Resend is for **sending only**; it does not receive mail. So you can use Resend for transactional mail and a separate provider for mailboxes. If you use the same domain for both, ensure:
- MX records point to the **inbox** provider (so incoming mail goes to support@, etc.).
- Resend only needs **SPF/DKIM** for sending; Resend’s docs explain how that coexists with your MX.

---

## Summary

| Need | Solution | Cost |
|------|----------|------|
| Send (confirmation links, reset, reminders) | Resend + domain verify + `RESEND_API_KEY` in DO | Resend (free tier available) |
| Receive at many addresses (support@, hello@, …) | **Cloudflare Email Routing** — forward to your existing inbox | **Free** |
| Real inbox UI (log into support@) | Migadu (flat fee) or Zoho Mail (free tier) | Low / free |

**Postfix on “our server”:** Not possible on App Platform (no OS access). On a Droplet, DO blocks SMTP by default and discourages self-hosted mail; use Resend + Cloudflare or a small email host instead.

For the “email confirmation link” flow in the app, **only the Resend setup in §1 is required**. For receiving at your domain, use **Cloudflare Email Routing** (free) or a provider like Migadu/Zoho.

**Registration 6-digit code:** Clinic registration sends a 6-digit verification code by email. If you don’t receive it, the app cannot send email: set **RESEND_API_KEY** in DigitalOcean, add and verify your domain in [Resend](https://resend.com) (Domains → add thefertilityos.com → add the DNS records they show). Until then, the “Send verification code” step will return an error instead of silently failing.
