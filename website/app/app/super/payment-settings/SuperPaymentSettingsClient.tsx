"use client";

import { useEffect, useState } from "react";
import { CreditCard, Landmark, Save, Trash2 } from "lucide-react";

type CredentialSource = "database" | "environment" | "none";

type PaymentSettingsResponse = {
  providerChoice: "none" | "stripe" | null;
  effectiveProvider: "none" | "stripe";
  stripe: {
    publishableKeyPreview: string;
    publishableKeySource: CredentialSource;
    secretKeyConfigured: boolean;
    secretKeySource: CredentialSource;
    webhookSecretConfigured: boolean;
    webhookSecretSource: CredentialSource;
    priceId: string | null;
    priceIdSource: CredentialSource;
  };
  futureGateways: { id: string; label: string; implemented: boolean }[];
};

function sourceBadge(src: CredentialSource) {
  const styles =
    src === "database"
      ? "bg-violet-100 text-violet-800 border-violet-200"
      : src === "environment"
        ? "bg-slate-100 text-slate-700 border-slate-200"
        : "bg-amber-50 text-amber-900 border-amber-200";
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${styles}`}>
      {src}
    </span>
  );
}

export default function SuperPaymentSettingsClient() {
  const [data, setData] = useState<PaymentSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [provider, setProvider] = useState<"none" | "stripe">("stripe");
  const [priceId, setPriceId] = useState("");
  const [pk, setPk] = useState("");
  const [sk, setSk] = useState("");
  const [wh, setWh] = useState("");

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/app/super/payment-settings")
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Forbidden" : "Failed to load");
        return r.json();
      })
      .then((d: PaymentSettingsResponse) => {
        setData(d);
        setProvider(d.providerChoice ?? (d.effectiveProvider === "stripe" ? "stripe" : "none"));
        setPriceId(d.stripe.priceId ?? "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const patch = async (partial: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/app/super/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Save failed");
        return;
      }
      setMessage("Saved.");
      load();
      setPk("");
      setSk("");
      setWh("");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    const payload: Record<string, unknown> = {
      provider,
      stripePriceId: priceId.trim(),
    };
    if (pk.trim()) payload.stripePublishableKey = pk.trim();
    if (sk.trim()) payload.stripeSecretKey = sk.trim();
    if (wh.trim()) payload.stripeWebhookSecret = wh.trim();
    void patch(payload);
  };

  if (loading) {
    return <div className="text-slate-500 py-12">Loading payment settings…</div>;
  }
  if (error === "Forbidden" || (error && !data)) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Super admin access required.
      </div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">{error || "Error"}</div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-700 text-white shadow-lg">
          <Landmark className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Payment gateways</h1>
          <p className="text-slate-600 mt-1 max-w-3xl text-sm leading-relaxed">
            Choose the platform-wide billing provider and Stripe API keys. Values saved here override{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">STRIPE_*</code> environment variables. Leave secret
            fields blank to keep the current saved or env value. Never commit API keys to git — use this screen or
            hosting env vars only.
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{message}</div>
      )}
      {error && error !== "Forbidden" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-violet-600" />
          Active provider
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-violet-300 has-[:checked]:border-violet-500 has-[:checked]:bg-violet-50/40">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="provider"
                checked={provider === "stripe"}
                onChange={() => setProvider("stripe")}
                className="text-violet-700"
              />
              <span className="font-bold text-slate-900">Stripe</span>
            </div>
            <p className="text-xs text-slate-600">Subscriptions, Checkout, Customer Portal, webhooks.</p>
          </label>
          <label className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-slate-300 has-[:checked]:border-slate-500 has-[:checked]:bg-slate-50">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="provider"
                checked={provider === "none"}
                onChange={() => setProvider("none")}
                className="text-slate-700"
              />
              <span className="font-bold text-slate-900">None</span>
            </div>
            <p className="text-xs text-slate-600">Disable Stripe checkout site-wide (even if env keys exist).</p>
          </label>
        </div>

        <p className="text-xs text-slate-500">
          Effective today: <strong className="text-slate-800">{data.effectiveProvider}</strong>
          {data.providerChoice == null && " (inferred from keys when provider not set in DB)"}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-bold text-slate-900">Stripe credentials</h2>
        <p className="text-sm text-slate-600">
          Publishable key preview:{" "}
          <code className="text-xs bg-slate-100 px-1 rounded">
            {data.stripe.publishableKeyPreview || "—"}
          </code>{" "}
          {sourceBadge(data.stripe.publishableKeySource)}
        </p>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Publishable key (pk_…)</label>
          <input
            type="password"
            autoComplete="off"
            placeholder="Leave blank to keep current"
            value={pk}
            onChange={(e) => setPk(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              disabled={saving}
              onClick={() => patch({ provider, stripePublishableKey: null })}
              className="text-xs font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Clear saved publishable key
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Secret key (sk_…) {data.stripe.secretKeyConfigured ? "✓ configured" : "—"}{" "}
            {sourceBadge(data.stripe.secretKeySource)}
          </label>
          <input
            type="password"
            autoComplete="off"
            placeholder="Leave blank to keep current"
            value={sk}
            onChange={(e) => setSk(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              disabled={saving}
              onClick={() => patch({ provider, stripeSecretKey: null })}
              className="text-xs font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Clear saved secret key
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Webhook signing secret (whsec_…) {data.stripe.webhookSecretConfigured ? "✓" : "—"}{" "}
            {sourceBadge(data.stripe.webhookSecretSource)}
          </label>
          <input
            type="password"
            autoComplete="off"
            placeholder="Leave blank to keep current"
            value={wh}
            onChange={(e) => setWh(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              disabled={saving}
              onClick={() => patch({ provider, stripeWebhookSecret: null })}
              className="text-xs font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Clear saved webhook secret
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Default subscription price id (price_…) {sourceBadge(data.stripe.priceIdSource)}
          </label>
          <input
            type="text"
            value={priceId}
            onChange={(e) => setPriceId(e.target.value)}
            placeholder="price_…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
          />
          <p className="text-xs text-slate-500 mt-1">Required for clinic checkout. Clear field + save removes DB override.</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-700 text-white font-bold hover:bg-violet-800 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {saving ? "Saving…" : "Save payment settings"}
        </button>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Coming later</h2>
        <ul className="mt-3 space-y-2">
          {data.futureGateways.map((g) => (
            <li key={g.id} className="flex items-center justify-between text-sm text-slate-600">
              <span>{g.label}</span>
              <span className="text-xs font-semibold text-slate-400">{g.implemented ? "Live" : "Not implemented"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
