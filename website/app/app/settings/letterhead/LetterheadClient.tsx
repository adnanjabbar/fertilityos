"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

type BrandingState = {
  letterheadImageUrl: string | null;
  useLetterheadTemplate: boolean;
  templateSlug: string | null;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  footerAddress: string | null;
  footerPhone: string | null;
  footerEmail: string | null;
  footerWebsite: string | null;
  footerText: string | null;
  logoUrl: string | null;
};

const TEMPLATE_SLUGS = [
  { value: "default_modern", label: "Default modern" },
  { value: "minimal", label: "Minimal" },
  { value: "clinical", label: "Clinical" },
];

const defaultState: BrandingState = {
  letterheadImageUrl: null,
  useLetterheadTemplate: true,
  templateSlug: "default_modern",
  marginTopMm: 20,
  marginBottomMm: 20,
  marginLeftMm: 20,
  marginRightMm: 20,
  footerAddress: null,
  footerPhone: null,
  footerEmail: null,
  footerWebsite: null,
  footerText: null,
  logoUrl: null,
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export default function LetterheadClient() {
  const [branding, setBranding] = useState<BrandingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState<BrandingState>(defaultState);

  useEffect(() => {
    fetch("/api/app/branding")
      .then((res) => (res.ok ? res.json() : defaultState))
      .then((data) => {
        setBranding(data);
        setForm({
          letterheadImageUrl: data.letterheadImageUrl ?? null,
          useLetterheadTemplate: data.useLetterheadTemplate ?? true,
          templateSlug: data.templateSlug ?? "default_modern",
          marginTopMm: data.marginTopMm ?? 20,
          marginBottomMm: data.marginBottomMm ?? 20,
          marginLeftMm: data.marginLeftMm ?? 20,
          marginRightMm: data.marginRightMm ?? 20,
          footerAddress: data.footerAddress ?? null,
          footerPhone: data.footerPhone ?? null,
          footerEmail: data.footerEmail ?? null,
          footerWebsite: data.footerWebsite ?? null,
          footerText: data.footerText ?? null,
          logoUrl: data.logoUrl ?? null,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/app/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letterheadImageUrl: form.letterheadImageUrl && form.letterheadImageUrl.trim() ? form.letterheadImageUrl.trim() : null,
          useLetterheadTemplate: form.useLetterheadTemplate,
          templateSlug: form.templateSlug && form.templateSlug.trim() ? form.templateSlug.trim() : null,
          marginTopMm: form.marginTopMm,
          marginBottomMm: form.marginBottomMm,
          marginLeftMm: form.marginLeftMm,
          marginRightMm: form.marginRightMm,
          footerAddress: form.footerAddress && form.footerAddress.trim() ? form.footerAddress.trim() : null,
          footerPhone: form.footerPhone && form.footerPhone.trim() ? form.footerPhone.trim() : null,
          footerEmail: form.footerEmail && form.footerEmail.trim() ? form.footerEmail.trim() : null,
          footerWebsite: form.footerWebsite && form.footerWebsite.trim() ? form.footerWebsite.trim() : null,
          footerText: form.footerText && form.footerText.trim() ? form.footerText.trim() : null,
          logoUrl: form.logoUrl && form.logoUrl.trim() ? form.logoUrl.trim() : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to save." });
        return;
      }
      setBranding(data);
      setMessage({ type: "success", text: "Letterhead & printing settings saved." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Letterhead & printing</h1>
      <p className="text-slate-600 mb-6">
        Configure clinic letterhead, logo, footer, and print margins. Multi-page prescriptions use the same margins.
      </p>

      {message && (
        <p
          className={`mb-4 p-3 rounded-xl text-sm ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
        >
          {message.text}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Letterhead</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Use template</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.useLetterheadTemplate}
                  onChange={(e) => setForm((f) => ({ ...f, useLetterheadTemplate: e.target.checked }))}
                  className="rounded border-slate-300 w-5 h-5"
                />
                <span className="text-slate-700">Use a built-in letterhead template</span>
              </label>
            </div>
            {form.useLetterheadTemplate && (
              <div>
                <label htmlFor="templateSlug" className={labelClass}>
                  Template
                </label>
                <select
                  id="templateSlug"
                  value={form.templateSlug ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, templateSlug: e.target.value || null }))}
                  className={inputClass}
                >
                  {TEMPLATE_SLUGS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="letterheadImageUrl" className={labelClass}>
                Letterhead image URL (optional)
              </label>
              <input
                id="letterheadImageUrl"
                type="url"
                value={form.letterheadImageUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, letterheadImageUrl: e.target.value || null }))}
                placeholder="https://…"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1">Upload your letterhead elsewhere and paste the image URL here.</p>
            </div>
            <div>
              <label htmlFor="logoUrl" className={labelClass}>
                Logo URL (optional)
              </label>
              <input
                id="logoUrl"
                type="url"
                value={form.logoUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value || null }))}
                placeholder="https://…"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Print margins (mm)</h2>
          <p className="text-sm text-slate-600 mb-4">Content will render within these margins. Same for all printed pages.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="marginTopMm" className={labelClass}>
                Top
              </label>
              <input
                id="marginTopMm"
                type="number"
                min={0}
                max={100}
                value={form.marginTopMm}
                onChange={(e) => setForm((f) => ({ ...f, marginTopMm: parseInt(e.target.value, 10) || 0 }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="marginBottomMm" className={labelClass}>
                Bottom
              </label>
              <input
                id="marginBottomMm"
                type="number"
                min={0}
                max={100}
                value={form.marginBottomMm}
                onChange={(e) => setForm((f) => ({ ...f, marginBottomMm: parseInt(e.target.value, 10) || 0 }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="marginLeftMm" className={labelClass}>
                Left
              </label>
              <input
                id="marginLeftMm"
                type="number"
                min={0}
                max={100}
                value={form.marginLeftMm}
                onChange={(e) => setForm((f) => ({ ...f, marginLeftMm: parseInt(e.target.value, 10) || 0 }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="marginRightMm" className={labelClass}>
                Right
              </label>
              <input
                id="marginRightMm"
                type="number"
                min={0}
                max={100}
                value={form.marginRightMm}
                onChange={(e) => setForm((f) => ({ ...f, marginRightMm: parseInt(e.target.value, 10) || 0 }))}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Footer</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="footerAddress" className={labelClass}>
                Address
              </label>
              <textarea
                id="footerAddress"
                rows={2}
                value={form.footerAddress ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, footerAddress: e.target.value || null }))}
                placeholder="Clinic address"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="footerPhone" className={labelClass}>
                Phone
              </label>
              <input
                id="footerPhone"
                type="text"
                value={form.footerPhone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, footerPhone: e.target.value || null }))}
                placeholder="+1 234 567 8900"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="footerEmail" className={labelClass}>
                Email
              </label>
              <input
                id="footerEmail"
                type="email"
                value={form.footerEmail ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, footerEmail: e.target.value || null }))}
                placeholder="contact@clinic.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="footerWebsite" className={labelClass}>
                Website
              </label>
              <input
                id="footerWebsite"
                type="url"
                value={form.footerWebsite ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, footerWebsite: e.target.value || null }))}
                placeholder="https://www.clinic.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="footerText" className={labelClass}>
                Footer text (optional)
              </label>
              <textarea
                id="footerText"
                rows={2}
                value={form.footerText ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, footerText: e.target.value || null }))}
                placeholder="e.g. License number, disclaimer"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60 min-h-[44px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save settings"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
