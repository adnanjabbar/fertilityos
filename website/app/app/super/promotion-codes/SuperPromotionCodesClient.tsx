"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Tag, Ban } from "lucide-react";

type PromoRow = {
  id: string;
  code: string;
  active: boolean;
  percentOff: number | null;
  amountOffCents: number | null;
  currency: string | null;
  duration: string;
  durationInMonths: number | null;
  maxRedemptions: number | null;
  expiresAt: string | null;
  internalNote: string | null;
  stripePromotionCodeId: string;
  createdAt: string;
};

export default function SuperPromotionCodesClient() {
  const [list, setList] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [percentOff, setPercentOff] = useState("20");
  const [amountOffCents, setAmountOffCents] = useState("1000");
  const [currency, setCurrency] = useState("usd");
  const [duration, setDuration] = useState<"once" | "repeating" | "forever">("once");
  const [durationInMonths, setDurationInMonths] = useState("3");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/app/super/promotion-codes");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to load");
        return;
      }
      setList(data.codes ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        code: code.trim(),
        duration,
        internalNote: internalNote.trim() || undefined,
      };
      if (discountType === "percent") {
        body.percentOff = parseInt(percentOff, 10);
      } else {
        body.amountOffCents = parseInt(amountOffCents, 10);
        body.currency = currency.toLowerCase();
      }
      if (duration === "repeating") {
        body.durationInMonths = parseInt(durationInMonths, 10) || 3;
      }
      if (maxRedemptions.trim()) {
        body.maxRedemptions = parseInt(maxRedemptions, 10);
      }
      if (expiresAt.trim()) {
        body.expiresAt = new Date(expiresAt).toISOString();
      }

      const res = await fetch("/api/app/super/promotion-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Create failed");
        return;
      }
      setCode("");
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this code? New checkouts cannot use it.")) return;
    setError(null);
    const res = await fetch(`/api/app/super/promotion-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Deactivate failed");
      return;
    }
    await load();
  };

  const discountLabel = (r: PromoRow) => {
    if (r.percentOff != null) return `${r.percentOff}% off`;
    if (r.amountOffCents != null) {
      const cur = (r.currency ?? "usd").toUpperCase();
      return `${(r.amountOffCents / 100).toFixed(2)} ${cur} off`;
    }
    return "—";
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl space-y-4"
      >
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Tag className="w-5 h-5 text-blue-600" />
          New promotion code
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Code (shown to clinics)</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 uppercase"
              placeholder="e.g. EARLY2026"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              maxLength={40}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Discount type</label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "percent" | "amount")}
            >
              <option value="percent">Percent off</option>
              <option value="amount">Fixed amount (cents)</option>
            </select>
          </div>
          {discountType === "percent" ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Percent off (1–100)</label>
              <input
                type="number"
                min={1}
                max={100}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
                value={percentOff}
                onChange={(e) => setPercentOff(e.target.value)}
                required
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount off (cents)</label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
                  value={amountOffCents}
                  onChange={(e) => setAmountOffCents(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  maxLength={3}
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
              value={duration}
              onChange={(e) => setDuration(e.target.value as typeof duration)}
            >
              <option value="once">Once (first invoice / period per Stripe rules)</option>
              <option value="repeating">Repeating (months)</option>
              <option value="forever">Forever</option>
            </select>
          </div>
          {duration === "repeating" ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Months (default 3)</label>
              <input
                type="number"
                min={1}
                max={36}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
                value={durationInMonths}
                onChange={(e) => setDurationInMonths(e.target.value)}
              />
            </div>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max redemptions (optional)</label>
            <input
              type="number"
              min={1}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="Unlimited"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expires (optional, local)</label>
            <input
              type="datetime-local"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Internal note</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Campaign / partner name"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          Create in Stripe
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900">Existing codes</div>
        {loading ? (
          <div className="p-8 flex justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm">No codes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Code</th>
                  <th className="text-left px-4 py-3 font-semibold">Discount</th>
                  <th className="text-left px-4 py-3 font-semibold">Duration</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Stripe promo id</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-mono font-semibold">{r.code}</td>
                    <td className="px-4 py-3">{discountLabel(r)}</td>
                    <td className="px-4 py-3">
                      {r.duration}
                      {r.duration === "repeating" && r.durationInMonths
                        ? ` (${r.durationInMonths} mo)`
                        : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.active ? "text-green-700 font-medium" : "text-slate-400 font-medium"
                        }
                      >
                        {r.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 break-all max-w-[140px]">
                      {r.stripePromotionCodeId}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.active ? (
                        <button
                          type="button"
                          onClick={() => void deactivate(r.id)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium"
                        >
                          <Ban className="w-4 h-4" />
                          Deactivate
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
