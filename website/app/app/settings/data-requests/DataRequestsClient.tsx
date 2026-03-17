"use client";

import { useState, useEffect, useCallback } from "react";

type PatientInfo = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
};

type RequestItem = {
  id: string;
  patientId: string;
  type: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
  completedByUserId: string | null;
  patient: PatientInfo;
  tenantName: string | null;
};

export default function DataRequestsClient() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/app/patient-data-requests");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load requests");
      }
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to load deletion requests",
      });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleMarkCompleted = async (id: string, executeDeletion: boolean) => {
    if (executeDeletion && !window.confirm("Permanently delete this patient's data? This cannot be undone and will remove the patient and related records (appointments, invoices, etc.).")) {
      return;
    }
    if (executeDeletion) {
      setDeletingId(id);
    } else {
      setCompletingId(id);
    }
    setMessage(null);
    try {
      const res = await fetch(`/api/app/patient-data-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", executeDeletion: !!executeDeletion }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update");
      }
      const data = await res.json().catch(() => ({}));
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setMessage({
        type: "success",
        text: data.deleted
          ? "Request completed and patient data deleted."
          : "Request marked as completed.",
      });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to update",
      });
    } finally {
      setCompletingId(null);
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-slate-600">Loading deletion requests…</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Data requests</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pending patient account deletion requests. Mark as completed after processing per your clinic policy.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-slate-600">
          No pending deletion requests.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Patient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Requested
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {requests.map((req) => (
                <tr key={req.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                    {req.patient.firstName} {req.patient.lastName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                    {req.patient.email ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                    {new Date(req.requestedAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <span className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(req.id, false)}
                        disabled={completingId === req.id || deletingId === req.id}
                        className="rounded-md bg-slate-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-500 disabled:opacity-50"
                      >
                        {completingId === req.id ? "Updating…" : "Mark completed"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(req.id, true)}
                        disabled={completingId === req.id || deletingId === req.id}
                        className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        {deletingId === req.id ? "Deleting…" : "Complete & delete data"}
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
