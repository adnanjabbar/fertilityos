"use client";

import { useCallback, useEffect, useState } from "react";
import { MODULE_SLUGS, type ModuleSlug } from "@/db/schema";
import { parseEnabledModules } from "@/lib/modules";
import { Shield, Save, Loader2 } from "lucide-react";

const BILLING_PLANS = ["free", "basic", "pro", "enterprise"] as const;
const STATUS_OPTIONS = [
  "incomplete",
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
] as const;

const MODULE_LABELS: Record<ModuleSlug, string> = {
  patientManagement: "Patient management",
  scheduling: "Scheduling",
  emr: "EMR",
  ivfLab: "IVF lab",
  billing: "Billing",
  labManagement: "Lab management",
};

type AuditEntry = {
  id: string;
  eventType: string;
  previousState: unknown;
  newState: unknown;
  complianceTags: string;
  notes: string | null;
  ipAddress: string | null;
  createdAt: string;
  actorEmail: string | null;
  actorName: string | null;
};

function initModuleSelection(enabledModules: string | null): {
  allEnabled: boolean;
  selected: Set<ModuleSlug>;
} {
  const parsed = parseEnabledModules(enabledModules);
  if (parsed === "all") {
    return { allEnabled: true, selected: new Set(MODULE_SLUGS) };
  }
  return { allEnabled: false, selected: new Set(parsed) };
}

export default function SuperTenantControls({
  tenantId,
  initialBillingPlan,
  initialStatus,
  initialEnabledModules,
  onRefresh,
}: {
  tenantId: string;
  initialBillingPlan: string;
  initialStatus: string;
  initialEnabledModules: string | null;
  onRefresh: () => void;
}) {
  const [plan, setPlan] = useState(initialBillingPlan);
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState("");
  const [{ allEnabled, selected }, setModState] = useState(() =>
    initModuleSelection(initialEnabledModules)
  );
  const [savingSub, setSavingSub] = useState(false);
  const [savingMod, setSavingMod] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(true);

  useEffect(() => {
    setPlan(initialBillingPlan);
    setStatus(initialStatus);
    setModState(initModuleSelection(initialEnabledModules));
  }, [initialBillingPlan, initialStatus, initialEnabledModules]);

  const loadAudit = useCallback(async (page: number) => {
    setAuditLoading(true);
    try {
      const res = await fetch(
        `/api/app/super/tenants/${tenantId}/audit-log?page=${page}&limit=20`
      );
      if (!res.ok) throw new Error("Failed to load audit log");
      const j = await res.json();
      setAudit(j.entries ?? []);
      setAuditTotalPages(j.totalPages ?? 1);
      setAuditPage(j.page ?? 1);
    } catch {
      setAudit([]);
    } finally {
      setAuditLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadAudit(1);
  }, [loadAudit]);

  const toggleAllModules = (on: boolean) => {
    if (on) {
      setModState({ allEnabled: true, selected: new Set(MODULE_SLUGS) });
    } else {
      setModState({ allEnabled: false, selected: new Set() });
    }
  };

  const toggleModule = (slug: ModuleSlug) => {
    setModState((prev) => {
      const next = new Set(prev.selected);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return { allEnabled: false, selected: next };
    });
  };

  const saveSubscription = async () => {
    setSavingSub(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch(`/api/app/super/tenants/${tenantId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingPlan: plan,
          status,
          notes: notes.trim() || null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      setMsg("Subscription saved. Compliance log updated.");
      setNotes("");
      onRefresh();
      void loadAudit(1);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingSub(false);
    }
  };

  const saveModules = async () => {
    setSavingMod(true);
    setMsg(null);
    setErr(null);
    try {
      const payload =
        allEnabled || selected.size === MODULE_SLUGS.length
          ? { enabledModules: null as null }
          : { enabledModules: Array.from(selected) };

      const res = await fetch(`/api/app/super/tenants/${tenantId}/modules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      setMsg("Modules saved. Compliance log updated.");
      onRefresh();
      void loadAudit(1);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingMod(false);
    }
  };

  return (
    <div className="space-y-8">
      {(msg || err) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            err
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-teal-200 bg-teal-50 text-teal-900"
          }`}
        >
          {err ?? msg}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-700" />
          Subscription &amp; billing tier
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Super-admin override. Changes are logged for GDPR / HIPAA accountability and HL7 governance
          (configuration control). Does not include patient data.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              {BILLING_PLANS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Notes (optional, stored in audit log)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Reason for change (internal)"
          />
        </div>
        <button
          type="button"
          onClick={() => void saveSubscription()}
          disabled={savingSub}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 disabled:opacity-60"
        >
          {savingSub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save subscription
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Feature modules</h2>
        <p className="text-xs text-slate-500 mb-4">
          Disable modules to restrict this clinic&apos;s product surface. &quot;All modules&quot; matches
          an empty restriction (full product).
        </p>
        <label className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-800">
          <input
            type="checkbox"
            checked={allEnabled}
            onChange={(e) => toggleAllModules(e.target.checked)}
          />
          All modules enabled (recommended default)
        </label>
        <div className="grid sm:grid-cols-2 gap-2 mb-4">
          {MODULE_SLUGS.map((slug) => (
            <label
              key={slug}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                allEnabled ? "opacity-50 pointer-events-none" : "border-slate-200"
              }`}
            >
              <input
                type="checkbox"
                disabled={allEnabled}
                checked={selected.has(slug)}
                onChange={() => toggleModule(slug)}
              />
              {MODULE_LABELS[slug]}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void saveModules()}
          disabled={savingMod}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60"
        >
          {savingMod ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save modules
        </button>
        {allEnabled && (
          <p className="text-xs text-slate-500 mt-2">
            With &quot;All modules&quot;, saving applies full access (clears restriction).
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Compliance &amp; change history</h2>
        <p className="text-xs text-slate-500 mb-4">
          Immutable log entries tagged <span className="font-mono">GDPR,HIPAA,HL7</span>. Also mirrored to
          the clinic&apos;s audit log for transparency.
        </p>
        {auditLoading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : audit.length === 0 ? (
          <p className="text-slate-500 text-sm">No platform changes recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="pb-2 pr-3">When</th>
                  <th className="pb-2 pr-3">Event</th>
                  <th className="pb-2 pr-3">Actor</th>
                  <th className="pb-2 pr-3">Change</th>
                  <th className="pb-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{a.eventType}</td>
                    <td className="py-2 pr-3 text-xs">
                      {a.actorEmail ?? "—"}
                      {a.actorName ? <span className="block text-slate-500">{a.actorName}</span> : null}
                    </td>
                    <td className="py-2 pr-3 text-xs font-mono max-w-xs break-all">
                      <pre className="whitespace-pre-wrap text-[11px]">
                        {JSON.stringify({ from: a.previousState, to: a.newState }, null, 0)}
                      </pre>
                    </td>
                    <td className="py-2 text-xs text-slate-600 max-w-[140px]">{a.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {auditTotalPages > 1 && (
          <div className="flex justify-between mt-4">
            <button
              type="button"
              disabled={auditPage <= 1 || auditLoading}
              onClick={() => void loadAudit(auditPage - 1)}
              className="text-sm font-semibold text-blue-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={auditPage >= auditTotalPages || auditLoading}
              onClick={() => void loadAudit(auditPage + 1)}
              className="text-sm font-semibold text-blue-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
