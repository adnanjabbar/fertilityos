"use client";

import { useState, useEffect } from "react";
import { Link2, Copy, Check, Plus } from "lucide-react";

type ReferralCode = {
  id: string;
  code: string;
  note: string | null;
  usedCount: string;
  createdAt: string;
};

function getRegisterBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXTAUTH_URL || "";
}

export default function ReferralsClient() {
  const [list, setList] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchList = async () => {
    try {
      const res = await fetch("/api/app/referrals");
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setCreateError(null);
    setCreateLoading(true);
    try {
      const res = await fetch("/api/app/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), note: note.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data.error || "Failed to create referral code.");
        return;
      }
      setCode("");
      setNote("");
      fetchList();
    } finally {
      setCreateLoading(false);
    }
  };

  const copyLink = (referralCode: ReferralCode) => {
    const base = getRegisterBaseUrl();
    const url = `${base}/register?ref=${encodeURIComponent(referralCode.code)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(referralCode.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });

  if (loading) {
    return <div className="text-slate-600">Loading…</div>;
  }

  return (
    <div className="space-y-10">
      {/* Create new code */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-700" />
          Create new referral code
        </h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="w-[200px]">
            <label htmlFor="ref-code" className="block text-sm font-semibold text-slate-700 mb-1">
              Code
            </label>
            <input
              id="ref-code"
              type="text"
              placeholder="e.g. CLINIC2025"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Za-z0-9_-]/g, ""))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              maxLength={64}
            />
            <p className="text-xs text-slate-500 mt-1">Letters, numbers, hyphens, underscores</p>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="ref-note" className="block text-sm font-semibold text-slate-700 mb-1">
              Note (optional)
            </label>
            <input
              id="ref-note"
              type="text"
              placeholder="e.g. Partner campaign"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              maxLength={500}
            />
          </div>
          <button
            type="submit"
            disabled={createLoading}
            className="px-6 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors disabled:opacity-60"
          >
            {createLoading ? "Creating…" : "Create code"}
          </button>
        </form>
        {createError && <p className="mt-3 text-sm text-red-600">{createError}</p>}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-teal-600" />
          Your referral codes
        </h2>
        {list.length === 0 ? (
          <p className="text-slate-500 text-sm">No referral codes yet. Create one above to share a link with new clinics.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((ref) => {
              const shareUrl = `${getRegisterBaseUrl()}/register?ref=${encodeURIComponent(ref.code)}`;
              return (
                <li key={ref.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="font-mono font-semibold text-slate-900">{ref.code}</span>
                    {ref.note && (
                      <span className="text-slate-500 text-sm ml-2">— {ref.note}</span>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      Used {ref.usedCount} time{ref.usedCount !== "1" ? "s" : ""} · created {formatDate(ref.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="w-[280px] px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => copyLink(ref)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-300"
                    >
                      {copiedId === ref.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedId === ref.id ? "Copied" : "Copy link"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
