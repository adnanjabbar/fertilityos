"use client";

import { useState, useEffect } from "react";

type IntegrationStatus = {
  twilioConfigured: boolean;
  twilioPhoneNumber: string | null;
  dailyConfigured: boolean;
};

export default function IntegrationsClient() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("");
  const [dailyApiKey, setDailyApiKey] = useState("");

  useEffect(() => {
    fetch("/api/app/integrations")
      .then((res) => (res.ok ? res.json() : { twilioConfigured: false, dailyConfigured: false }))
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/app/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twilioAccountSid: twilioAccountSid.trim() || undefined,
          twilioAuthToken: twilioAuthToken.trim() || undefined,
          twilioPhoneNumber: twilioPhoneNumber.trim() || undefined,
          dailyApiKey: dailyApiKey.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage({ type: "success", text: "Integrations saved. SMS and video will use your credentials." });
      setTwilioAuthToken(""); // Don't keep token in state after save
      const data = await fetch("/api/app/integrations").then((r) => r.json());
      setStatus(data);
    } catch {
      setMessage({ type: "error", text: "Failed to save. Try again." });
    } finally {
      setSaving(false);
    }
  };

  const labelClass = "block text-sm font-semibold text-slate-700 mb-1";
  const inputClass =
    "w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

  if (loading) {
    return (
      <div className="max-w-2xl">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-600 mt-1">
          Connect your own accounts for SMS and video. FertilityOS does not provide or pay for these services — you add your credentials and use your own payment plans.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success" ? "bg-teal-50 text-teal-800 border border-teal-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Twilio (SMS) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">SMS (Twilio)</h2>
          <p className="text-sm text-slate-500 mb-4">
            Used for appointment reminders and portal verification. Add your Twilio Account SID, Auth Token, and “From” phone number.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="twilioAccountSid" className={labelClass}>
                Account SID
              </label>
              <input
                id="twilioAccountSid"
                type="text"
                placeholder={status?.twilioConfigured ? "••••••••" : "AC…"}
                value={twilioAccountSid}
                onChange={(e) => setTwilioAccountSid(e.target.value)}
                className={inputClass}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="twilioAuthToken" className={labelClass}>
                Auth Token
              </label>
              <input
                id="twilioAuthToken"
                type="password"
                placeholder={status?.twilioConfigured ? "••••••••" : "Leave blank to keep existing"}
                value={twilioAuthToken}
                onChange={(e) => setTwilioAuthToken(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="twilioPhoneNumber" className={labelClass}>
                From phone (E.164)
              </label>
              <input
                id="twilioPhoneNumber"
                type="text"
                placeholder={status?.twilioPhoneNumber ?? "+1234567890"}
                value={twilioPhoneNumber}
                onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Daily.co (Video) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Video (Daily.co)</h2>
          <p className="text-sm text-slate-500 mb-4">
            Used for telemedicine appointments. Add your Daily.co API key from the Daily dashboard.
          </p>
          <div>
            <label htmlFor="dailyApiKey" className={labelClass}>
              Daily.co API key
            </label>
            <input
              id="dailyApiKey"
              type="password"
              placeholder={status?.dailyConfigured ? "••••••••" : "Paste your API key"}
              value={dailyApiKey}
              onChange={(e) => setDailyApiKey(e.target.value)}
              className={inputClass}
              autoComplete="off"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
