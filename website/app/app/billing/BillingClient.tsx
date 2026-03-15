"use client";

import { useState, useEffect } from "react";
import { Calendar, CreditCard, ExternalLink, Loader2, Settings2 } from "lucide-react";

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "CHF", label: "CHF — Swiss Franc" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "INR", label: "INR — Indian Rupee" },
] as const;

type SubscriptionState = {
  status: string;
  hasCustomer: boolean;
  currentPeriodEnd: string | null;
};

type SettingsState = {
  defaultCurrency: string;
  reminderChannel: "email" | "sms" | "both";
};

export default function BillingClient({ isAdmin = false }: { isAdmin?: boolean }) {
  const [sub, setSub] = useState<SubscriptionState | null>(null);
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"checkout" | "portal" | "settings" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [settingsCurrency, setSettingsCurrency] = useState<string>("USD");
  const [reminderChannel, setReminderChannel] = useState<"email" | "sms" | "both">("email");
  const [reminderSaveLoading, setReminderSaveLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/app/billing/subscription").then((res) =>
        res.ok ? res.json() : { status: "incomplete", hasCustomer: false, currentPeriodEnd: null }
      ),
      fetch("/api/app/settings").then((res) => (res.ok ? res.json() : { defaultCurrency: "USD", reminderChannel: "email" })),
    ])
      .then(([subData, settingsData]) => {
        setSub(subData);
        setSettings(settingsData);
        setSettingsCurrency(settingsData.defaultCurrency ?? "USD");
        setReminderChannel(settingsData.reminderChannel ?? "email");
      })
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

  const handleSaveCurrency = async () => {
    if (!isAdmin) return;
    setActionLoading("settings");
    setMessage(null);
    try {
      const res = await fetch("/api/app/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultCurrency: settingsCurrency }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? (res.status === 403 ? "Only admins can change this." : "Failed to save.") });
        return;
      }
      setSettings((prev) => ({ defaultCurrency: data.defaultCurrency ?? settingsCurrency, reminderChannel: prev?.reminderChannel ?? "email" }));
      setMessage({ type: "success", text: "Default currency updated." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveReminderChannel = async () => {
    if (!isAdmin) return;
    setReminderSaveLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/app/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderChannel }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? (res.status === 403 ? "Only admins can change this." : "Failed to save.") });
        return;
      }
      setSettings((prev) => ({ defaultCurrency: prev?.defaultCurrency ?? "USD", reminderChannel: data.reminderChannel ?? reminderChannel }));
      setMessage({ type: "success", text: "Reminder channel updated." });
    } finally {
      setReminderSaveLoading(false);
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Default currency</h2>
            <p className="text-sm text-slate-500">Used for new invoices and amount display.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label htmlFor="default-currency" className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
            <select
              id="default-currency"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50"
              value={settingsCurrency}
              onChange={(e) => setSettingsCurrency(e.target.value)}
              disabled={!isAdmin}
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={handleSaveCurrency}
              disabled={actionLoading === "settings" || settingsCurrency === (settings?.defaultCurrency ?? "USD")}
              className="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {actionLoading === "settings" ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving…</span>
              ) : (
                "Save"
              )}
            </button>
          )}
        </div>
        {!isAdmin && settings && (
          <p className="text-xs text-slate-500 mt-2">Only admins can change the default currency.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Appointment reminders</h2>
            <p className="text-sm text-slate-500">How to send reminders: email, SMS, or both.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label htmlFor="reminder-channel" className="block text-sm font-medium text-slate-700 mb-1">Reminder channel</label>
            <select
              id="reminder-channel"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50"
              value={reminderChannel}
              onChange={(e) => setReminderChannel(e.target.value as "email" | "sms" | "both")}
              disabled={!isAdmin}
            >
              <option value="email">Email only</option>
              <option value="sms">SMS only</option>
              <option value="both">Email and SMS</option>
            </select>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={handleSaveReminderChannel}
              disabled={reminderSaveLoading || reminderChannel === (settings?.reminderChannel ?? "email")}
              className="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {reminderSaveLoading ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving…</span>
              ) : (
                "Save"
              )}
            </button>
          )}
        </div>
        {!isAdmin && settings && (
          <p className="text-xs text-slate-500 mt-2">Only admins can change the reminder channel.</p>
        )}
      </div>
    </div>
  );
}
