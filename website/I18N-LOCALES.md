# Locales (English, Español, العربية)

Public marketing pages and shared `app` nav strings use **next-intl** with a **cookie** (`NEXT_LOCALE`), not URL prefixes.

## Supported locales

| Code | Language | Notes |
|------|----------|--------|
| `en` | English | Default. |
| `es` | Español | Full `messages/es.json`. |
| `ar` | Arabic | `messages/ar.json` merged on top of English; untranslated keys fall back to English. **RTL** + **Noto Sans Arabic** apply when `ar` is selected. |
| `fr` | French | `messages/fr.json` (expand over time); same merge rules. Shown to users only if included in `NEXT_PUBLIC_APPROVED_LOCALES`. |

**More languages:** follow **`ADDING-LOCALES.md`** (register code, JSON file, picker data, env toggle).

## Production approval (`NEXT_PUBLIC_APPROVED_LOCALES`)

- **Known message files** are listed in `lib/i18n-config.ts` as `KNOWN_LOCALE_CODES` (must match files under `messages/`).
- **Shown to users** (switcher, region picker, cookie acceptance): only codes in **`NEXT_PUBLIC_APPROVED_LOCALES`** (comma-separated). If unset, all known locales are shown.
- Use this to **merge translator PRs early** but keep a locale **off** until copy is approved (e.g. `en,es` while `ar.json` is reviewed).

## Behavior

- **Merge:** `i18n/request.ts` loads `messages/en.json` then deep-merges `messages/{locale}.json` for `es` and `ar`, so partial Arabic files are safe.
- **Switcher:** `LanguageSwitcher` sets the cookie and refreshes the page (only **approved** locales).
- **Region picker:** `RegionalLanguagePicker` — continent → country (flag + name) → language; languages are filtered by **approved** locales. Data: `lib/language-picker-data.ts`.
- **RTL:** Root `app/layout.tsx` sets `dir="rtl"` and Arabic body font when locale is `ar`.

## Public translation workflow

- **Contributor guide:** `messages/README.md` (next to JSON files) and **`TRANSLATIONS-WORKFLOW.md`** (policy + review + deploy gate).
- **Marketing page:** `/translate` explains the process; footer **Translate the project** links there.

## Extending Arabic (or any locale)

Edit `messages/ar.json` and add or override nested keys to match `messages/en.json`. Long-form sections (e.g. every module card description) can be translated incrementally without breaking the site.
