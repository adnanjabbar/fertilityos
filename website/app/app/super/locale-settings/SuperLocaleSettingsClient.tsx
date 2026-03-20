"use client";

import { useEffect, useState } from "react";
import { Globe2, Save } from "lucide-react";
import { KNOWN_LOCALE_CODES, LOCALE_DISPLAY, type AppLocale } from "@/lib/i18n-config";

type ApiPayload = {
  approvedLocales: AppLocale[];
  storedInDatabase: boolean;
  knownLocales: string[];
};

export default function SuperLocaleSettingsClient() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [selected, setSelected] = useState<Set<AppLocale>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/app/super/platform-settings")
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Forbidden" : "Failed to load");
        return r.json();
      })
      .then((d: ApiPayload) => {
        setData(d);
        setSelected(new Set(d.approvedLocales));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (code: AppLocale) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        if (next.size <= 1) return prev;
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      setMessage("Select at least one language.");
      return;
    }
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/app/super/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedLocales: [...selected] }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Save failed");
        return;
      }
      setMessage("Saved. Public site language picker will use these locales (overrides env when set).");
      setData((d) =>
        d
          ? {
              ...d,
              approvedLocales: body.approvedLocales ?? [...selected],
              storedInDatabase: true,
            }
          : d
      );
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500 py-12">Loading language settings…</div>;
  }
  if (error === "Forbidden") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Super admin access required.
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        {error || "Could not load settings."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg">
          <Globe2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Languages &amp; public locale</h1>
          <p className="text-slate-600 mt-1 max-w-2xl text-sm leading-relaxed">
            Choose which <strong>known</strong> interface languages appear on the marketing site and login
            flows. This is stored in the database and overrides <code className="text-xs bg-slate-100 px-1 rounded">NEXT_PUBLIC_APPROVED_LOCALES</code> once saved. Adding a <em>new</em> language still requires a{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">messages/{"{code}"}.json</code> file and a code in{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">KNOWN_LOCALE_CODES</code> (deploy).
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Stored in DB: {data.storedInDatabase ? "yes (active override)" : "no (using env / defaults)"}
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{message}</div>
      )}
      {error && error !== "Forbidden" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Enabled locales</h2>
        <ul className="space-y-3">
          {KNOWN_LOCALE_CODES.map((code) => (
            <li key={code} className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="font-semibold text-slate-900">
                  {LOCALE_DISPLAY[code]} <span className="text-slate-400 font-mono text-sm">({code})</span>
                </p>
                <p className="text-xs text-slate-500">Messages file: messages/{code}.json</p>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-slate-600">Live on site</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  checked={selected.has(code)}
                  onChange={() => toggle(code)}
                />
              </label>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || selected.size === 0}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {saving ? "Saving…" : "Save to platform"}
        </button>
      </div>
    </div>
  );
}
