"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Lock, Shield, UserCheck } from "lucide-react";

type SecurityReport = {
  failedLogins7d: number;
  failedLogins30d: number;
  successfulLogins7d: number;
  successfulLogins30d: number;
  otpSend7d: number;
  otpSend30d: number;
  otpFail7d: number;
  otpFail30d: number;
  lockouts7d: number;
  lockouts30d: number;
};

export default function SecurityReportClient() {
  const [data, setData] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/app/security-report");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || "Failed to load security report");
          setData(null);
          return;
        }
        const body: SecurityReport = await res.json();
        setData(body);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load security report");
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <div className="py-10 text-slate-500 text-sm">Loading security metrics…</div>
      ) : !data ? (
        <div className="py-10 text-slate-500 text-sm">No data available.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Failed logins
                  </p>
                  <p className="text-sm text-slate-500">
                    Credential mismatches recorded in the audit log.
                  </p>
                </div>
                <AlertTriangle className="w-7 h-7 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <p className="text-xs text-slate-500">Last 7 days</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {data.failedLogins7d}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last 30 days</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {data.failedLogins30d}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Successful logins
                  </p>
                  <p className="text-sm text-slate-500">
                    Authenticated sign-ins for this tenant.
                  </p>
                </div>
                <UserCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <p className="text-xs text-slate-500">Last 7 days</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {data.successfulLogins7d}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last 30 days</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {data.successfulLogins30d}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    OTP send attempts
                  </p>
                  <p className="text-sm text-slate-500">
                    Phone verification codes sent to patients.
                  </p>
                </div>
                <Shield className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <p className="text-xs text-slate-500">Last 7 days</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {data.otpSend7d}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last 30 days</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {data.otpSend30d}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    OTP verification failures
                  </p>
                  <p className="text-sm text-slate-500">
                    Invalid codes entered during phone verification.
                  </p>
                </div>
                <AlertTriangle className="w-7 h-7 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <p className="text-xs text-slate-500">Last 7 days</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {data.otpFail7d}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last 30 days</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {data.otpFail30d}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Account lockouts
                  </p>
                  <p className="text-sm text-slate-500">
                    Lockouts due to repeated failed authentication (if configured).
                  </p>
                </div>
                <Lock className="w-7 h-7 text-slate-600" />
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <p className="text-xs text-slate-500">Last 7 days</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {data.lockouts7d}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last 30 days</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {data.lockouts30d}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Metrics are derived from audit log events for this tenant only. Use the full audit log for
            detailed, per-event investigation.
          </p>
        </>
      )}
    </div>
  );
}

