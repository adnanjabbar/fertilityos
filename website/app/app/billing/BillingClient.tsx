"use client";

import { useState, useEffect } from "react";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";

type SubscriptionState = {
  status: string;
  hasCustomer: boolean;
  currentPeriodEnd: string | null;
};

export default function BillingClient() {
  const [sub, setSub] = useState<SubscriptionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"checkout" | "portal" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/app/billing/subscription")
      .then((res) => (res.ok ? res.json() : { status: "incomplete", hasCustomer: false, currentPeriodEnd: null }))
      .then(setSub)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (params.get("success") === "true") {
      setMessage({ type: "success", text: "Subscription updated successfully." });
      setSub((prev) => (prev ? { ...prev, status: "active", hasCustomer: true } : prev));
      window.history.replaceState({}, "", "/app/billing");
    } else if (params.get("canceled") === "true") {
      setMessage({ type: "error", text: "Checkout was canceled." });
      window.history.replaceState({}, "", "/app/billing");
    }
  }, []);

  const handleSubscribe = async () => {
    setActionLoading("checkout");
    setMessage(null);
    try {
      const res = await fetch("/api/app/billing/checkout", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Could not start checkout." });
        return;
      }
      if (data.url) window.location.href = data.url;
    } finally {
      setActionLoading(null);
    }
  };

  const handleManage = async () => {
    setActionLoading("portal");
    setMessage(null);
    try {
      const res = await fetch("/api/app/billing/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Could not open billing portal." });
        return;
      }
      if (data.url) window.location.href = data.url;
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading…
      </div>
    );
  }

  const statusLabel =
    sub?.status === "active"
      ? "Active"
      : sub?.status === "past_due"
        ? "Past due"
        : sub?.status === "canceled"
          ? "Canceled"
          : sub?.status === "trialing"
            ? "Trial"
            : "No active subscription";

  const isActive = sub?.status === "active" || sub?.status === "trialing";
  const periodEnd = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, { dateStyle: "long" })
    : null;

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Subscription</h2>
            <p className="text-sm text-slate-500">{statusLabel}</p>
          </div>
        </div>

        {periodEnd && isActive && (
          <p className="text-sm text-slate-600 mb-4">
            Current period ends on <strong>{periodEnd}</strong>.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          {!sub?.hasCustomer || !isActive ? (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-60"
            >
              {actionLoading === "checkout" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
              Subscribe
            </button>
          ) : null}
          {sub?.hasCustomer && (
            <button
              type="button"
              onClick={handleManage}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-60"
            >
              {actionLoading === "portal" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ExternalLink className="w-5 h-5" />
              )}
              Manage subscription
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Subscription and payment details are managed securely by Stripe. You can update your plan or payment method at any time.
        </p>
      </div>
    </div>
  );
}
