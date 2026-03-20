"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Entry = {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
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

export default function SuperAuditLogClient() {
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/app/super/audit-log?page=${p}&limit=40`);
      if (!res.ok) throw new Error("Failed");
      const j = await res.json();
      setEntries(j.entries ?? []);
      setTotalPages(j.totalPages ?? 1);
      setPage(j.page ?? 1);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/super" className="text-sm font-semibold text-blue-700 hover:underline">
          ← Platform overview
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Platform compliance log</h1>
        <p className="text-slate-600 mt-1 text-sm max-w-3xl">
          Super-admin configuration changes across all clinics. Tagged for GDPR accountability, HIPAA
          security/configuration audit trails, and HL7 interoperability governance. No patient PHI in
          these events.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-600">
                <th className="px-3 py-3">When</th>
                <th className="px-3 py-3">Clinic</th>
                <th className="px-3 py-3">Event</th>
                <th className="px-3 py-3">Actor</th>
                <th className="px-3 py-3">Tags</th>
                <th className="px-3 py-3">Delta</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    No entries yet.
                  </td>
                </tr>
              ) : (
                entries.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/app/super/tenants/${a.tenantId}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {a.tenantName}
                      </Link>
                      <div className="text-xs text-slate-500 font-mono">{a.tenantSlug}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{a.eventType}</td>
                    <td className="px-3 py-2 text-xs">
                      {a.actorEmail ?? "—"}
                      {a.ipAddress ? (
                        <div className="text-slate-400 font-mono">{a.ipAddress}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-slate-600">{a.complianceTags}</td>
                    <td className="px-3 py-2 text-[11px] font-mono max-w-md break-all">
                      {JSON.stringify({ from: a.previousState, to: a.newState })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => void load(page - 1)}
            className="text-sm font-semibold text-blue-700 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => void load(page + 1)}
            className="text-sm font-semibold text-blue-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
