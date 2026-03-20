# Translation message files (`website/messages/`)

These JSON files are **intentionally plain and public** so agencies, clinicians, and professional translators can work without access to the full app codebase UI.

## Files

| File        | Role |
|------------|------|
| `en.json`  | **Source of truth** for keys and English copy. |
| `es.json`, `ar.json`, … | Locale overrides merged **on top of** `en.json` (partial files are OK). |

## Contributor workflow

1. Copy the structure from `en.json` (same nesting keys).
2. Translate string values only; do not rename keys.
3. Submit changes via **pull request** (or your organization’s translation branch).
4. Maintainers review for **accuracy**, **clinical tone**, and **brand** consistency.
5. **Production:** a locale is shown to end users only when:
   - its code is listed in **`KNOWN_LOCALE_CODES`** in `lib/i18n-config.ts` (and `messages/{code}.json` exists), and  
   - it appears in **`NEXT_PUBLIC_APPROVED_LOCALES`** in the deployed environment (if that env var is set; if omitted, all known codes are shown — so exclude new codes explicitly until QA, e.g. `en,es,ar` without `fr`).

See **`TRANSLATIONS-WORKFLOW.md`** in this folder’s parent (`website/`) for the full policy.

## Tips

- Prefer formal medical/clinic wording where the English source is clinical.
- Keep `{placeholders}` and HTML-like fragments intact if present.
- For RTL languages, layout direction is handled in code (`ar`); you only supply strings.
