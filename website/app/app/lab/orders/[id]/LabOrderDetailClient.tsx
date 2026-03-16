"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Check, Send, Save } from "lucide-react";

const LAB_ORDER_STATUSES = [
  "pending",
  "ordered",
  "sample_collected",
  "in_processing",
  "completed",
  "awaiting_final_approval",
  "published",
] as const;

type OrderItem = {
  id: string;
  testId: string;
  testCode: string;
  testName: string;
  status: string;
  resultValue: string | null;
  resultUnit: string | null;
  referenceRange: string | null;
  resultAt: string | null;
};

type OrderDetail = {
  id: string;
  patientId: string;
  patientName: string | null;
  status: string;
  requestedAt: string | null;
  resultAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  items: OrderItem[];
};

function formatDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function formatStatus(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function LabOrderDetailClient({
  orderId,
  canEdit,
  canApprove,
}: {
  orderId: string;
  canEdit: boolean;
  canApprove: boolean;
}) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [approving, setApproving] = useState(false);
  const [submittingForApproval, setSubmittingForApproval] = useState(false);
  const [editItems, setEditItems] = useState<Record<string, Partial<OrderItem>>>({});

  const fetchOrder = useCallback(() => {
    fetch(`/api/app/lab/orders/${orderId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setOrder)
      .catch(() => setError("Order not found."))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusChange = async (newStatus: string) => {
    setSavingStatus(true);
    setError(null);
    try {
      const res = await fetch(`/api/app/lab/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update status");
        return;
      }
      setOrder((o) => (o ? { ...o, status: newStatus } : null));
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setSubmittingForApproval(true);
    setError(null);
    try {
      const res = await fetch(`/api/app/lab/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_for_approval" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to submit for approval");
        return;
      }
      setOrder((o) => (o ? { ...o, status: "awaiting_final_approval" } : null));
    } finally {
      setSubmittingForApproval(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    setError(null);
    try {
      const res = await fetch(`/api/app/lab/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to approve");
        return;
      }
      fetchOrder();
    } finally {
      setApproving(false);
    }
  };

  const handleSaveResults = async () => {
    if (!order || Object.keys(editItems).length === 0) return;
    setSavingItems(true);
    setError(null);
    try {
      const items = order.items
        .filter((it) => editItems[it.id])
        .map((it) => {
          const ed = editItems[it.id]!;
          return {
            id: it.id,
            ...(ed.resultValue !== undefined && { resultValue: ed.resultValue }),
            ...(ed.resultUnit !== undefined && { resultUnit: ed.resultUnit }),
            ...(ed.referenceRange !== undefined && { referenceRange: ed.referenceRange }),
            ...(ed.status !== undefined && { status: ed.status }),
            ...(ed.resultAt !== undefined && { resultAt: ed.resultAt || null }),
          };
        });
      const res = await fetch(`/api/app/lab/orders/${orderId}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save results");
        return;
      }
      setEditItems({});
      fetchOrder();
    } finally {
      setSavingItems(false);
    }
  };

  const updateItemEdit = (itemId: string, field: keyof OrderItem, value: string | null) => {
    setEditItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value ?? "" },
    }));
  };

  if (loading) return <p className="text-slate-600">Loading…</p>;
  if (error || !order) {
    return (
      <div className="space-y-4">
        <p className="text-slate-600">{error ?? "Order not found."}</p>
        <Link href="/app/lab" className="text-sm font-medium text-blue-600 hover:underline">
          ← Back to Lab
        </Link>
      </div>
    );
  }

  const hasItemEdits = Object.keys(editItems).length > 0;
  const isAwaitingApproval = order.status === "awaiting_final_approval";
  const isPublished = order.status === "published";
  const canChangeStatus = canEdit && !isPublished;
  const showSubmitForApproval =
    canEdit && (order.status === "completed" || order.status === "in_processing") && !isPublished;
  const showApproveBtn = canApprove && isAwaitingApproval;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-500">Patient</dt>
            <dd className="font-medium text-slate-900">
              <Link
                href={`/app/patients/${order.patientId}`}
                className="text-blue-700 hover:underline"
              >
                {order.patientName ?? "—"}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Order status</dt>
            <dd className="flex items-center gap-2 flex-wrap">
              {canChangeStatus ? (
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={savingStatus}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-900 bg-white"
                >
                  {LAB_ORDER_STATUSES.filter((s) => s !== "awaiting_final_approval" && s !== "published").map(
                    (s) => (
                      <option key={s} value={s}>
                        {formatStatus(s)}
                      </option>
                    )
                  )}
                  <option value="awaiting_final_approval">Awaiting final approval</option>
                </select>
              ) : (
                <span className="font-medium text-slate-900">{formatStatus(order.status)}</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Requested</dt>
            <dd>{formatDate(order.requestedAt)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Result at</dt>
            <dd>{formatDate(order.resultAt)}</dd>
          </div>
          {order.approvedAt && (
            <>
              <div>
                <dt className="text-sm font-medium text-slate-500">Approved at</dt>
                <dd>{formatDate(order.approvedAt)}</dd>
              </div>
            </>
          )}
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          {showSubmitForApproval && (
            <button
              type="button"
              onClick={handleSubmitForApproval}
              disabled={submittingForApproval}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800 font-medium hover:bg-amber-100 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {submittingForApproval ? "Submitting…" : "Submit for approval"}
            </button>
          )}
          {showApproveBtn && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700 disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              {approving ? "Approving…" : "Approve report"}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold text-slate-900">Tests & results</h2>
          {canEdit && hasItemEdits && (
            <button
              type="button"
              onClick={handleSaveResults}
              disabled={savingItems}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {savingItems ? "Saving…" : "Save results"}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Test</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Result</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Unit</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Reference range</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Result at</th>
              </tr>
            </thead>
            <tbody>
              {order.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No tests in this order.
                  </td>
                </tr>
              ) : (
                order.items.map((item) => {
                  const ed = editItems[item.id];
                  const resultValue = ed?.resultValue !== undefined ? ed.resultValue : item.resultValue;
                  const resultUnit = ed?.resultUnit !== undefined ? ed.resultUnit : item.resultUnit;
                  const referenceRange =
                    ed?.referenceRange !== undefined ? ed.referenceRange : item.referenceRange;
                  const itemStatus = ed?.status !== undefined ? ed.status : item.status;
                  const resultAt = ed?.resultAt !== undefined ? ed.resultAt : item.resultAt;
                  return (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {item.testCode} — {item.testName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {canEdit && !isPublished ? (
                          <select
                            value={itemStatus}
                            onChange={(e) => updateItemEdit(item.id, "status", e.target.value)}
                            className="rounded border border-slate-200 px-2 py-1 text-slate-900 w-40"
                          >
                            {LAB_ORDER_STATUSES.filter(
                              (s) => s !== "awaiting_final_approval" && s !== "published"
                            ).map((s) => (
                              <option key={s} value={s}>
                                {formatStatus(s)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          formatStatus(itemStatus)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canEdit && !isPublished ? (
                          <input
                            type="text"
                            value={resultValue ?? ""}
                            onChange={(e) => updateItemEdit(item.id, "resultValue", e.target.value)}
                            placeholder="Value"
                            className="rounded border border-slate-200 px-2 py-1 w-28 text-slate-900"
                          />
                        ) : (
                          item.resultValue ?? "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canEdit && !isPublished ? (
                          <input
                            type="text"
                            value={resultUnit ?? ""}
                            onChange={(e) => updateItemEdit(item.id, "resultUnit", e.target.value)}
                            placeholder="Unit"
                            className="rounded border border-slate-200 px-2 py-1 w-20 text-slate-900"
                          />
                        ) : (
                          item.resultUnit ?? "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canEdit && !isPublished ? (
                          <input
                            type="text"
                            value={referenceRange ?? ""}
                            onChange={(e) =>
                              updateItemEdit(item.id, "referenceRange", e.target.value)
                            }
                            placeholder="e.g. 0-5"
                            className="rounded border border-slate-200 px-2 py-1 w-24 text-slate-900"
                          />
                        ) : (
                          item.referenceRange ?? "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canEdit && !isPublished ? (
                          <input
                            type="datetime-local"
                            value={
                              resultAt
                                ? new Date(resultAt).toISOString().slice(0, 16)
                                : ""
                            }
                            onChange={(e) =>
                              updateItemEdit(
                                item.id,
                                "resultAt",
                                e.target.value ? new Date(e.target.value).toISOString() : null
                              )
                            }
                            className="rounded border border-slate-200 px-2 py-1 text-slate-900"
                          />
                        ) : (
                          formatDate(item.resultAt)
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Link href="/app/lab" className="text-sm font-medium text-blue-600 hover:underline">
        ← Back to Lab
      </Link>
    </div>
  );
}
