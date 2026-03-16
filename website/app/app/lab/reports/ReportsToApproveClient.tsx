"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Check } from "lucide-react";

type ReportRow = {
  id: string;
  patientId: string;
  patientName: string | null;
  status: string;
  requestedAt: string | null;
  resultAt: string | null;
};

function formatDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export default function ReportsToApproveClient() {
  const [list, setList] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchList = () => {
    fetch("/api/app/lab/reports")
      .then((r) => (r.ok ? r.json() : []))
      .then(setList)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleApprove = async (orderId: string) => {
    setApprovingId(orderId);
    try {
      const res = await fetch(`/api/app/lab/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) fetchList();
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) return <p className="text-slate-600">Loading…</p>;

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>No reports awaiting approval.</p>
        <Link href="/app/lab" className="mt-4 inline-block text-blue-600 font-medium hover:underline">
          View all lab orders
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Patient</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Requested</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Result at</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((row) => (
            <tr key={row.id} className="border-b border-slate-100">
              <td className="px-4 py-3">
                <Link
                  href={`/app/lab/orders/${row.id}`}
                  className="font-medium text-blue-700 hover:underline"
                >
                  {row.patientName ?? "—"}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDate(row.requestedAt)}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(row.resultAt)}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/app/lab/orders/${row.id}`}
                  className="mr-2 text-blue-600 font-medium hover:underline"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => handleApprove(row.id)}
                  disabled={approvingId === row.id}
                  className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-white font-medium hover:bg-green-700 disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  {approvingId === row.id ? "Approving…" : "Approve"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
