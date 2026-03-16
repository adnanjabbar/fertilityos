"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Copy, Check, Trash2, AlertCircle } from "lucide-react";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export default function DevelopersClient() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newKeyResult, setNewKeyResult] = useState<{
    key: string;
    name: string;
    keyPrefix: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/app/api-keys");
      if (res.ok) setKeys(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreateError(null);
    setNewKeyResult(null);
    setCreateLoading(true);
    try {
      const res = await fetch("/api/app/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          expiresInDays:
            expiresInDays === "" || expiresInDays === "Never"
              ? undefined
              : parseInt(expiresInDays, 10),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data.error || "Failed to create API key.");
        return;
      }
      setNewKeyResult({
        key: data.key,
        name: data.name,
        keyPrefix: data.keyPrefix,
      });
      setName("");
      setExpiresInDays("");
      fetchKeys();
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      const res = await fetch(`/api/app/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) fetchKeys();
    } finally {
      setRevokingId(null);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (s: string | null) =>
    s
      ? new Date(s).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "—";

  const isExpired = (expiresAt: string | null) =>
    expiresAt ? new Date(expiresAt) < new Date() : false;

  if (loading) {
    return <div className="text-slate-600">Loading…</div>;
  }

  return (
    <div className="space-y-10">
      {/* Create key form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-700" />
          Create API key
        </h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="key-name"
              className="block text-sm font-semibold text-slate-700 mb-1"
            >
              Name
            </label>
            <input
              id="key-name"
              type="text"
              placeholder="e.g. Production, CI/CD"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div className="w-[180px]">
            <label
              htmlFor="key-expiry"
              className="block text-sm font-semibold text-slate-700 mb-1"
            >
              Expires (days)
            </label>
            <select
              id="key-expiry"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Never</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={createLoading}
            className="px-6 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors disabled:opacity-60"
          >
            {createLoading ? "Creating…" : "Create key"}
          </button>
        </form>
        {createError && (
          <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {createError}
          </p>
        )}
        {newKeyResult && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-sm font-semibold text-amber-900 mb-2">
              Copy your key now. It won’t be shown again.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <code className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 text-sm font-mono break-all">
                {newKeyResult.key}
              </code>
              <button
                type="button"
                onClick={() => copyKey(newKeyResult.key)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-200 text-amber-900 text-sm font-medium hover:bg-amber-300"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied" : "Copy key"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* List of keys */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-teal-600" />
          Your API keys
        </h2>
        {keys.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No API keys yet. Create one above to get started.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {keys.map((k) => (
              <li
                key={k.id}
                className="py-3 flex items-center justify-between gap-4 flex-wrap"
              >
                <div>
                  <span className="font-medium text-slate-900">{k.name}</span>
                  <span className="text-slate-500 text-sm font-mono ml-2">
                    {k.keyPrefix}…
                  </span>
                  <div className="text-slate-500 text-xs mt-0.5">
                    Last used: {formatDate(k.lastUsedAt)} · Expires:{" "}
                    {k.expiresAt ? formatDate(k.expiresAt) : "Never"}
                    {isExpired(k.expiresAt) && (
                      <span className="text-amber-600 font-medium ml-1">
                        (expired)
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(k.id)}
                  disabled={revokingId === k.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="w-4 h-4" />
                  {revokingId === k.id ? "Revoking…" : "Revoke"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
