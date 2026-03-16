"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type OrderDetail = {
  id: string;
  patientId: string;
  patientName: string | null;
  status: string;
  requestedAt: string | null;
  resultAt: string | null;
  items: { id: string; testCode: string; testName: string; status: string; resultValue: string | null }[];
};

function formatDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export default function LabOrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/app/lab/orders/${orderId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <p className="text-slate-600">Loading…</p>;
  if (!order) return <p className="text-slate-600">Order not found.</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-500">Patient</dt>
            <dd className="font-medium text-slate-900">{order.patientName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Status</dt>
            <dd className="font-medium text-slate-900">{order.status}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Requested</dt>
            <dd>{formatDate(order.requestedAt)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Result at</dt>
            <dd>{formatDate(order.resultAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Order items</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {order.items.length === 0 ? (
            <li className="px-4 py-6 text-center text-slate-500">No items.</li>
          ) : (
            order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium text-slate-900">
                  {item.testCode} — {item.testName}
                </span>
                <span className="text-sm text-slate-600">
                  {item.resultValue ?? "—"} ({item.status})
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <Link href="/app/lab" className="text-sm font-medium text-blue-600 hover:underline">
        ← Back to Lab
      </Link>
    </div>
  );
}
