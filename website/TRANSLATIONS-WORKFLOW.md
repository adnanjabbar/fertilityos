# Translation workflow — public files, review, deploy

This matches the product direction: **expose language JSON publicly**, let **professional translators** improve copy, **approve** internally, then **enable** a locale in production.

## 1. Public, diff-friendly source

- All UI strings for the marketing shell and shared `app` nav live under **`website/messages/*.json`**.
- Files are normal JSON — easy to email, attach to a TMS (translation management system), or edit in a fork.
- **Adding a language** (e.g. German after French): see **`ADDING-LOCALES.md`** — register the code in `lib/i18n-config.ts`, add `messages/{code}.json`, update `language-picker-data.ts`, then use `NEXT_PUBLIC_APPROVED_LOCALES` when ready to ship.

## 2. Filling in or fixing a language

- **`en.json`** is the full key set.
- Other locales (`es.json`, `ar.json`, …) are **merged over English** (`i18n/request.ts`). Missing keys fall back to English so you can ship **incremental** improvements.
- Translators can focus on sections that matter first (e.g. hero + pricing) and expand later.

## 3. Review checklist (maintainers)

- [ ] Keys unchanged; only values updated.
- [ ] Placeholders preserved (`{year}`, `{email}`, etc.).
- [ ] Clinical/fertility terminology appropriate for the region.
- [ ] No secrets or PHI in strings.

## 4. Approve → deploy gate

Two layers:

1. **Code support:** `KNOWN_LOCALE_CODES` in `lib/i18n-config.ts` must include the locale code (and a `messages/{code}.json` file should exist).
2. **Runtime toggle:** `NEXT_PUBLIC_APPROVED_LOCALES` (comma-separated, e.g. `en,es`) controls what appears in the **language switcher** and **region picker**.

Example: accept a translator PR for `ar.json` early with `NEXT_PUBLIC_APPROVED_LOCALES=en,es` so Arabic stays **off** until you flip to `en,es,ar`.

## 5. Region & language UX

- The **Region & language** control (continent → country with flag → language) only offers **approved** locales for each country.
- Country lists live in `lib/language-picker-data.ts` and can be expanded.

## 6. Translator-facing page

- **`/translate`** on the site summarizes this process for external collaborators.
- Footer link: **Translate the project** → `/translate`.

## Related docs

- `I18N-LOCALES.md` — RTL, merge behavior, locale cookie.
- `messages/README.md` — short contributor notes next to the JSON files.
