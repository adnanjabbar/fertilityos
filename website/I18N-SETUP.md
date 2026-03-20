# i18n Setup (next-intl)

FertilityOS uses [next-intl](https://next-intl.dev/) for internationalization with the Next.js App Router. Locale is stored in a cookie (no locale prefix in the URL).

## Overview

- **Default locale:** `en` (English)
- **Additional locales:** `es` (Spanish)
- **Locale storage:** Cookie `NEXT_LOCALE` (persisted, 1 year)
- **Detection:** Cookie takes precedence; if missing, default locale is used.

## Project structure

```
website/
├── i18n/
│   └── request.ts       # Request config: reads locale from cookie, loads messages
├── messages/
│   ├── en.json          # English messages
│   └── es.json          # Spanish messages
├── app/
│   ├── layout.tsx       # Wraps app with NextIntlClientProvider
│   ├── components/
│   │   ├── LanguageSwitcher.tsx
│   │   └── ...
│   └── app/
│       └── layout.tsx   # App shell (uses app.nav, includes LanguageSwitcher)
└── next.config.ts       # Uses createNextIntlPlugin()
```

## Configuration

### 1. `i18n/request.ts`

- Exports `locales`, `defaultLocale`, and `Locale` type.
- Uses cookie name `NEXT_LOCALE`.
- Loads messages from `messages/{locale}.json`.
- Called on every request; no middleware required for locale.

### 2. `next.config.ts`

- Wraps config with `createNextIntlPlugin()` (uses default path `./i18n/request.ts`).

### 3. Root layout (`app/layout.tsx`)

- Uses `getLocale()` and `getMessages()` from `next-intl/server`.
- Wraps `children` in `NextIntlClientProvider` with `locale` and `messages`.
- Sets `<html lang={locale}>` for accessibility and SEO.

## Usage in components

### Server components

```ts
import { getTranslations } from "next-intl/server";

export default async function MyPage() {
  const t = await getTranslations("landing.hero");
  return <h1>{t("title")}</h1>;
}
```

### Client components

```ts
"use client";
import { useTranslations } from "next-intl";

export default function MyComponent() {
  const t = useTranslations("landing.nav");
  return <button>{t("signIn")}</button>;
}
```

### With variables

In messages: `"copyright": "© {year} FertilityOS. All rights reserved."`  
In code: `t("copyright", { year: 2026 })`.

### Arrays in messages

Use `t.raw("key")` to get the raw value (e.g. an array) for mapping.

## Adding a new locale

See **`ADDING-LOCALES.md`** for the full checklist. Summary:

1. Add **`messages/{code}.json`** (can start as `{}` or partial overrides; English fills the rest).
2. Register the code in **`lib/i18n-config.ts`**: `KNOWN_LOCALE_CODES` + **`LOCALE_DISPLAY`** (native label). `i18n/request.ts` picks this up via `locales` export.
3. Update **`lib/language-picker-data.ts`** for countries that should offer the new language.
4. Optionally add **`locale.{code}`** in other JSON files for consistency; the switcher reads **`LOCALE_DISPLAY`**, not `locale.*`.
5. Control rollout with **`NEXT_PUBLIC_APPROVED_LOCALES`**.

## Adding or editing messages

- **Landing:** keys live under `landing.*` (e.g. `landing.hero`, `landing.nav`, `landing.footer`, `landing.features`, `landing.modules`, `landing.howItWorks`, `landing.pricing`, `landing.faq`, `landing.waitlist`).
- **App shell:** keys under `app.nav` and `app.common` (e.g. Save, Cancel).
- **Locale names:** switcher uses **`LOCALE_DISPLAY`** in `lib/i18n-config.ts`; optional `locale.*` keys in JSON for other UI.

Add or update the key in **all** locale files (`en.json`, `es.json`, etc.) to avoid missing translation warnings.

## Language switcher

- **Component:** `app/components/LanguageSwitcher.tsx`
- **Behavior:** Sets cookie `NEXT_LOCALE` to the selected locale and calls `router.refresh()` so the next render uses the new messages.
- **Variants:** `variant="buttons"` (EN | ES style) or `variant="dropdown"` (select).
- **Used in:** Landing navbar (desktop and mobile) and app header.

## Cookie behavior

- **Name:** `NEXT_LOCALE`
- **Path:** `/`
- **Max-Age:** 1 year
- **SameSite:** Lax

The first request has no cookie, so the app uses the default locale (`en`). After the user selects a language, the cookie is set and all subsequent requests use that locale until the cookie is changed or expires.

## Notes

- No middleware is used for i18n; locale is resolved in `getRequestConfig` from the cookie.
- For future “locale in path” (e.g. `/es/app/...`), you would add next-intl middleware and a `[locale]` segment; see [next-intl routing](https://next-intl.dev/docs/routing).
- Optional: store user locale preference in the database (e.g. profile or session) and set the cookie on login so returning users get their preferred language without clicking the switcher.
