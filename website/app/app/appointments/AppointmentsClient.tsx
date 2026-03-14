"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CalendarPlus, Search, Calendar } from "lucide-react";

type AppointmentRow = {
  id: string;
  patientId: string;
  patientFirstName: string;
  patientLastName: string;
  providerId: string | null;
  title: string | null;
  startAt: string;
  endAt: string;
  type: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

type PatientOption = { id: string; firstName: string; lastName: string };

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

function formatDateTime(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AppointmentsClient() {
  const [list, setList] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [patientFilter, setPatientFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientId: "",
    startAt: "",
    endAt: "",
    type: "consultation",
    title: "",
    notes: "",
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
      const params = new URLSearchParams();
      if (fromDate) params.set("from", new Date(fromDate).toISOString());
      if (toDate) params.set("to", new Date(toDate + "T23:59:59").toISOString());
      if (patientFilter) params.set("patientId", patientFilter);
      const q = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/app/appointments${q}`);
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, patientFilter]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(fetchList, 200);
    return () => clearTimeout(t);
  }, [fetchList]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.startAt || !form.endAt) {
      setAddError("Patient, start time, and end time are required.");
      return;
    }
    const start = new Date(form.startAt);
    const end = new Date(form.endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setAddError("Invalid date/time.");
      return;
    }
    setAddError(null);
    setAddLoading(true);
    try {
      const res = await fetch("/api/app/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: form.patientId,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          type: form.type || "consultation",
          title: form.title.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(data.error || "Failed to create appointment.");
        return;
      }
      setShowAddForm(false);
      setForm({ patientId: "", startAt: "", endAt: "", type: "consultation", title: "", notes: "" });
      fetchList();
      if (data.id) window.location.href = `/app/appointments/${data.id}`;
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            className={inputClass + " w-auto"}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            placeholder="From"
          />
          <span className="text-slate-400">–</span>
          <input
            type="date"
            className={inputClass + " w-auto"}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <select
          className={inputClass + " w-auto min-w-[180px]"}
          value={patientFilter}
          onChange={(e) => setPatientFilter(e.target.value)}
        >
          <option value="">All patients</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
        >
          <CalendarPlus className="w-5 h-5" />
          Add appointment
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">New appointment</h2>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {addError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{addError}</p>
            )}
            <div>
              <label htmlFor="patientId" className={labelClass}>Patient *</label>
              <select
                id="patientId"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startAt" className={labelClass}>Start *</label>
                <input
                  id="startAt"
                  type="datetime-local"
                  className={inputClass}
                  value={form.startAt}
                  onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label htmlFor="endAt" className={labelClass}>End *</label>
                <input
                  id="endAt"
                  type="datetime-local"
                  className={inputClass}
                  value={form.endAt}
                  onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className={labelClass}>Type</label>
                <select
                  id="type"
                  className={inputClass}
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="consultation">Consultation</option>
                  <option value="retrieval">Retrieval</option>
                  <option value="transfer">Transfer</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="title" className={labelClass}>Title</label>
                <input
                  id="title"
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className={labelClass}>Notes</label>
              <textarea
                id="notes"
                rows={2}
                className={inputClass}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addLoading}
                className="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-60"
              >
                {addLoading ? "Creating…" : "Create appointment"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No appointments yet.</p>
            <p className="text-slate-500 text-sm mt-1">Add an appointment above or adjust filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 font-medium">
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/appointments/${a.id}`}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {a.patientFirstName} {a.patientLastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(a.startAt)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(a.endAt)}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{a.type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      a.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                      a.status === "completed" ? "bg-green-100 text-green-800" :
                      a.status === "cancelled" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800"
                    }`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
