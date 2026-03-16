"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlask, faPlus, faUser, faVial } from "@fortawesome/free-solid-svg-icons";

type LabOrder = {
  id: string;
  patientId: string;
  patientName: string | null;
  status: string;
  requestedAt: string | null;
  resultAt: string | null;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  collected: "bg-blue-100 text-blue-800",
  in_progress: "bg-slate-100 text-slate-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export default function LabClient() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/app/lab/orders");
      if (res.ok) setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-600">
        <FontAwesomeIcon icon={faFlask} className="animate-pulse" />
        Loading lab orders…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-slate-600">
          Native Lab Information System — orders, specimens, and results managed in-house. Use{" "}
          <Link href="/app/settings/lab-integration" className="text-blue-600 hover:underline">
            Lab integration
          </Link>{" "}
          to connect external LIS/LIMS.
        </p>
        <Link
          href="/app/lab/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:opacity-95"
        >
          <FontAwesomeIcon icon={faPlus} />
          New order
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Lab orders</h2>
        </div>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FontAwesomeIcon icon={faVial} className="mx-auto mb-2 h-10 w-10 text-slate-300" />
            <p>No lab orders yet.</p>
            <Link
              href="/app/lab/new"
              className="mt-2 inline-block text-blue-600 hover:underline"
            >
              Create your first order
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-4 px-4 py-3 hover:bg-slate-50/50">
                <div className="flex items-center gap-2 min-w-0">
                  <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900 truncate">{o.patientName ?? "Unknown"}</span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusColors[o.status] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {o.status}
                </span>
                <span className="text-sm text-slate-500">Requested: {formatDate(o.requestedAt)}</span>
                {o.resultAt && (
                  <span className="text-sm text-slate-500">Result: {formatDate(o.resultAt)}</span>
                )}
                <Link
                  href={`/app/lab/orders/${o.id}`}
                  className="ml-auto text-sm font-medium text-blue-600 hover:underline"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
