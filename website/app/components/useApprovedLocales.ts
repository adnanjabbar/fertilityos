"use client";

import { useEffect, useState } from "react";
import { getApprovedLocales, type AppLocale } from "@/lib/i18n-config";

/**
 * Hydrates approved locales from `/api/public/site-config` so they match super-admin DB settings.
 * Falls back to env (`getApprovedLocales`) until fetch completes.
 */
export function useApprovedLocales(): AppLocale[] {
  const [locales, setLocales] = useState<AppLocale[]>(() => getApprovedLocales());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/site-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { approvedLocales?: AppLocale[] } | null) => {
        if (cancelled || !d?.approvedLocales?.length) return;
        setLocales(d.approvedLocales);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return locales;
}
