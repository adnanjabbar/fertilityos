"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Receipt, Plus, DollarSign } from "lucide-react";

type InvoiceRow = {
  id: string;
  patientId: string;
  patientFirstName: string;
  patientLastName: string;
  invoiceNumber: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  totalAmount: string;
  currency: string;
  createdAt: string;
};

type PatientOption = { id: string; firstName: string; lastName: string };

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { dateStyle: "medium" });
}

export default function InvoicesClient() {
  const [list, setList] = useState<InvoiceRow[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientId: "",
    dueDate: "",
    notes: "",
    lines: [{ description: "", quantity: 1, unitPrice: "" }],
  });

  const fetchPatients = useCallback(async () => {
    const res = await fetch("/api/app/patients");
    if (res.ok) {
      const data = await res.json();
      setPatients(data.map((p: { id: string; firstName: string; lastName: string }) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName })));
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      const params = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const res = await fetch(`/api/app/invoices${params}`);
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(fetchList, 200);
    return () => clearTimeout(t);
  }, [fetchList]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleAddLine = () => {
    setForm((f) => ({ ...f, lines: [...f.lines, { description: "", quantity: 1, unitPrice: "" }] }));
  };

  const handleRemoveLine = (index: number) => {
    if (form.lines.length <= 1) return;
    setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== index) }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) {
      setAddError("Select a patient.");
      return;
    }
    const lines = form.lines
      .map((l) => ({ description: l.description.trim(), quantity: l.quantity, unitPrice: parseFloat(String(l.unitPrice)) || 0 }))
      .filter((l) => l.description.length > 0);
    if (lines.length === 0) {
      setAddError("Add at least one line item with a description.");
      return;
    }
    setAddError(null);
    setAddLoading(true);
    try {
      const res = await fetch("/api/app/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: form.patientId,
          dueDate: form.dueDate || null,
          notes: form.notes.trim() || null,
          lines,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(data.error || "Failed to create invoice.");
        return;
      }
      setShowAddForm(false);
      setForm({ patientId: "", dueDate: "", notes: "", lines: [{ description: "", quantity: 1, unitPrice: "" }] });
      fetchList();
      if (data.id) window.location.href = `/app/invoices/${data.id}`;
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <select
          className={inputClass + " w-auto min-w-[140px]"}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add invoice
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">New invoice</h2>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {addError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{addError}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Patient *</label>
                <select
                  className={inputClass}
                  value={form.patientId}
                  onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
                  required
                >
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Due date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Line items *</label>
              {form.lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-end mb-2">
                  <input
                    className={inputClass + " flex-1"}
                    placeholder="Description"
                    value={line.description}
                    onChange={(e) => setForm((f) => ({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, description: e.target.value } : l)) }))}
                  />
                  <input
                    type="number"
                    min={1}
                    className={inputClass + " w-20"}
                    value={line.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, quantity: parseInt(e.target.value, 10) || 1 } : l)) }))}
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className={inputClass + " w-28"}
                    placeholder="Unit price"
                    value={line.unitPrice}
                    onChange={(e) => setForm((f) => ({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, unitPrice: e.target.value } : l)) }))}
                  />
                  <button type="button" onClick={() => handleRemoveLine(i)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">Remove</button>
                </div>
              ))}
              <button type="button" onClick={handleAddLine} className="text-sm text-blue-700 font-medium hover:underline">+ Add line</button>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea rows={2} className={inputClass} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={addLoading} className="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-60">{addLoading ? "Creating…" : "Create invoice"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No invoices yet.</p>
            <p className="text-slate-500 text-sm mt-1">Add an invoice above or adjust the filter.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 font-medium">
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due date</th>
              </tr>
            </thead>
            <tbody>
              {list.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/app/invoices/${inv.id}`} className="font-medium text-blue-700 hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{inv.patientFirstName} {inv.patientLastName}</td>
                  <td className="px-4 py-3 text-slate-900">{inv.currency} {inv.totalAmount}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      inv.status === "paid" ? "bg-green-100 text-green-800" :
                      inv.status === "draft" ? "bg-slate-100 text-slate-600" :
                      inv.status === "sent" ? "bg-blue-100 text-blue-800" :
                      inv.status === "overdue" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(inv.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
