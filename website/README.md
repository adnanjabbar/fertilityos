This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Documentation (ops & integrations)

- [Security & compliance](./SECURITY-AND-COMPLIANCE.md) — rate limits, headers, audit, data handling.
- [Public / integration API catalog](./PUBLIC-API.md) — public routes, webhooks, cron patterns.
- [Locales (EN / ES / AR)](./I18N-LOCALES.md) — Arabic RTL, Spanish, merge behavior.
- [Translation workflow](./TRANSLATIONS-WORKFLOW.md) — public JSON files, review, `NEXT_PUBLIC_APPROVED_LOCALES`.
- [Adding locales](./ADDING-LOCALES.md) — French, German, Portuguese, … (config + JSON + picker).
- [messages/README.md](./messages/README.md) — translator notes next to JSON files.
- [SSO / OAuth (Google & Microsoft)](./SSO-OAUTH.md) — env vars, callbacks, account linking.
- [API marketplace / integrations](./API-MARKETPLACE.md) — product catalog at `/integrations`.

### Clinic subdomains (`ERR_NAME_NOT_RESOLVED`)

After sign-in or registration on **www**, staff are redirected to **`https://{clinic-slug}.thefertilityos.com/app/...`**. If you see **`ERR_NAME_NOT_RESOLVED`**, the subdomain does not exist in public DNS yet.

1. **Proper fix:** Add a **wildcard** record so `*.thefertilityos.com` resolves to the same place as your app (e.g. Vercel “wildcard domain” + DNS `CNAME` / ALIAS as your host documents).
2. **Until DNS is ready:** Set environment variable **`DISABLE_TENANT_SUBDOMAIN_REDIRECT=1`** (or `true`) in production. Users then stay on **www**; the session still carries the correct tenant (see `middleware.ts`).
3. **DNS works but subdomain still fails (login loop / not signed in):** Set **`AUTH_COOKIE_DOMAIN=.thefertilityos.com`** in production so the session cookie is shared between **www** and **`{slug}.thefertilityos.com`** (see `auth.ts`). Redeploy and sign in once on www.

The Chrome message *“Unsafe attempt to load URL … from frame with URL chrome-error://chromewebdata/”* appears because the browser is on an **internal network error page** after DNS failed; it is not a separate app bug.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
