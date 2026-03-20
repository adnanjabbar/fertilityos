# Adding a new UI language (e.g. French → German, Portuguese, …)

Follow these steps whenever you introduce **`messages/de.json`**, **`messages/pt.json`**, etc.

## 1. Message file

- Add **`website/messages/{code}.json`** (ISO 639-1 code, lowercase).
- Start with `{}` or a small override file: anything missing falls back to **`en.json`** (deep merge in `i18n/request.ts`).

## 2. Register the code in code

Edit **`lib/i18n-config.ts`**:

1. Append the code to **`KNOWN_LOCALE_CODES`** (e.g. `"de"`).
2. Add a row to **`LOCALE_DISPLAY`** (native end-user label, e.g. `de: "Deutsch"`).

TypeScript will propagate **`AppLocale`** to the region picker and cookie logic.

## 3. Optional: `locale` labels in JSON

Other message files (`en.json`, `es.json`, …) can include **`locale.{code}`** for consistency (e.g. footer or future UI). The **language switcher** uses **`LOCALE_DISPLAY`** from `i18n-config.ts`, so this step is optional.

## 4. Region & language picker

Edit **`lib/language-picker-data.ts`**: for each country where the new language is relevant, add the code to that country’s **`languages`** array (with **`en` / `es` / `ar` / `fr` / …** as appropriate). Only **approved** locales are shown at runtime.

## 5. Production toggle

- **Super admin (recommended):** **Platform → Languages (public site)** (`/app/super/locale-settings`) saves **`platform_settings.approved_locales`** and overrides the env list for visitors once set.
- **Or** set **`NEXT_PUBLIC_APPROVED_LOCALES`** in the deployed env (e.g. `en,es,ar,fr,de`).
- Omit the code until translation QA is done.

## 6. Docs

- Update **`TRANSLATIONS-WORKFLOW.md`** / **`I18N-LOCALES.md`** if the process changes.
- Translators: **`messages/README.md`**.

## French (`fr`) today

**`fr`** is already registered and **`messages/fr.json`** exists (minimal content). Until you expand `fr.json` and add **`fr`** to **`NEXT_PUBLIC_APPROVED_LOCALES`**, you can keep French **off** in production while translators fill the file.
