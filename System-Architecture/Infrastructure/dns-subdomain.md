# DNS & Subdomain Setup — FertilityOS

## Goal

Support clinic subdomains so each clinic can use a URL like `demo-clinic.thefertilityos.com`. The app resolves the tenant from the host and sets `x-tenant-slug` in middleware.

---

## 1. Wildcard CNAME (at your domain registrar)

Where you manage DNS for `thefertilityos.com` (e.g. Cloudflare, Namecheap, GoDaddy, DigitalOcean DNS):

| Field       | Value |
|------------|--------|
| **Type**   | CNAME |
| **Name**   | `*` (wildcard) or `*.thefertilityos.com` (depends on registrar) |
| **Target** | Same as your main app. For DigitalOcean App Platform: use the default app URL shown in the app’s **Domains** tab (e.g. `fertilityos-xxxxx.ondigitalocean.app`). |
| **TTL**    | 300 or default |

Examples:

- **Cloudflare:** Create record Name `*`, Type CNAME, Target `fertilityos-xxxxx.ondigitalocean.app`, Proxy status as you prefer (DNS only or Proxied).
- **DigitalOcean DNS:** Create CNAME, Hostname `*`, Will Direct To: choose your App Platform app or paste the app’s default hostname.
- **Namecheap:** Host Records → Add New Record → CNAME Record, Host `*`, Value = app’s default hostname.

After propagation, `anything.thefertilityos.com` will resolve to the same app.

---

## 2. DigitalOcean App Platform — Domains

- In the app: **Settings** → **Domains**.
- Add **thefertilityos.com** and **www.thefertilityos.com** if not already added.
- For **wildcard** (`*.thefertilityos.com`): If the UI allows adding a wildcard domain, add it so DO can issue a certificate covering all subdomains. If not, you can add individual subdomains (e.g. `demo-clinic.thefertilityos.com`) in the Domains list so each gets a cert; the wildcard CNAME above still routes traffic.

---

## 3. App behavior (already implemented)

- **Middleware** (`website/middleware.ts`): For requests whose host is `slug.thefertilityos.com` (or `slug.localhost` in dev), sets the request header **`x-tenant-slug`** = `slug`.
- **API** `GET /api/tenant-by-slug?slug=xxx`: Returns tenant `{ id, name, slug }` when the slug exists. Use this in the app (e.g. login page or layout) to show clinic name or tenant context when the user arrives via subdomain.

---

## 4. Testing locally

Use a local hostname that mimics a subdomain, e.g.:

- `demo-clinic.localhost:3000` (if your OS supports `*.localhost`), or  
- Add to `C:\Windows\System32\drivers\etc\hosts`:  
  `127.0.0.1 demo-clinic.localhost`  
  then open `http://demo-clinic.localhost:3000/login`.

The middleware will set `x-tenant-slug` = `demo-clinic` for matching hosts.
