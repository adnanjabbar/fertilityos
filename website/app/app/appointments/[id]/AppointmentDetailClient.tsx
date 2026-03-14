"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Save, X, Video } from "lucide-react";

type Appointment = {
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
  videoRoomId: string | null;
  createdAt: string;
  updatedAt: string;
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

export default function AppointmentDetailClient({ appointmentId }: { appointmentId: string }) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Appointment> & { startAt?: string; endAt?: string }>({});
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/app/appointments/${appointmentId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setAppointment(data);
        setForm({
          patientId: data.patientId,
          title: data.title ?? "",
          startAt: toDatetimeLocal(data.startAt),
          endAt: toDatetimeLocal(data.endAt),
          type: data.type,
          status: data.status,
          notes: data.notes ?? "",
        });
      })
      .catch(() => setError("Appointment not found"))
      .finally(() => setLoading(false));

    fetch("/api/app/patients")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setPatients(data.map((p: { id: string; firstName: string; lastName: string }) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName }))));
  }, [appointmentId]);

  const videoTypes = ["consultation", "follow-up", "video"];
  const canStartVideo = videoTypes.includes(appointment?.type ?? "");

  const handleStartVideo = async () => {
    if (!appointment) return;
    setVideoError(null);
    setVideoLoading(true);
    try {
      const res = await fetch(`/api/app/appointments/${appointment.id}/video-room`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVideoError(data.error ?? "Failed to create video room");
        return;
      }
      const url = data.url;
      if (url && typeof url === "string") {
        window.open(url, "_blank", "noopener,noreferrer");
        setAppointment((prev) => (prev ? { ...prev, videoRoomId: url } : null));
      } else {
        setVideoError("Invalid response");
      }
    } catch {
      setVideoError("Something went wrong");
    } finally {
      setVideoLoading(false);
    }
  };

  const handleSave = async () => {
    if (!appointment) return;
    const startAt = form.startAt ? new Date(form.startAt).toISOString() : undefined;
    const endAt = form.endAt ? new Date(form.endAt).toISOString() : undefined;
    setSaveError(null);
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/app/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: form.patientId,
          title: form.title || null,
          startAt,
          endAt,
          type: form.type,
          status: form.status,
          notes: form.notes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || "Failed to update");
        return;
      }
      // Refetch to get patient name and full row
      const refetch = await fetch(`/api/app/appointments/${appointmentId}`);
      if (refetch.ok) {
        const full = await refetch.json();
        setAppointment(full);
        setVideoError(null);
        setForm({
          patientId: full.patientId,
          title: full.title ?? "",
          startAt: toDatetimeLocal(full.startAt),
          endAt: toDatetimeLocal(full.endAt),
          type: full.type,
          status: full.status,
          notes: full.notes ?? "",
        });
      }
      setEditing(false);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (error || !appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error ?? "Appointment not found"}</p>
        <Link href="/app/appointments" className="text-blue-700 hover:underline mt-2 inline-block">Back to appointments</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/app/appointments"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Appointments
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-xl font-bold text-slate-900">
            {appointment.patientFirstName} {appointment.patientLastName} — {appointment.type}
          </h1>
          <div className="flex items-center gap-2">
            {canStartVideo && (
              <>
                {videoError && (
                  <p className="text-sm text-red-600 mr-2">{videoError}</p>
                )}
                <button
                  type="button"
                  onClick={handleStartVideo}
                  disabled={videoLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 font-medium hover:bg-blue-100 disabled:opacity-60"
                >
                  <Video className="w-4 h-4" />
                  {appointment.videoRoomId ? "Join video call" : videoLoading ? "Creating…" : "Start video call"}
                </button>
              </>
            )}
            {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saveLoading ? "Saving…" : "Save"}
              </button>
            </div>
          )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{saveError}</p>
          )}

          {!editing ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-slate-500">Patient</dt>
                <dd className="mt-1">
                  <Link href={`/app/patients/${appointment.patientId}`} className="text-blue-700 hover:underline">
                    {appointment.patientFirstName} {appointment.patientLastName}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Start</dt>
                <dd className="mt-1 text-slate-900">{formatDateTime(appointment.startAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">End</dt>
                <dd className="mt-1 text-slate-900">{formatDateTime(appointment.endAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Type</dt>
                <dd className="mt-1 text-slate-900 capitalize">{appointment.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    appointment.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                    appointment.status === "completed" ? "bg-green-100 text-green-800" :
                    appointment.status === "cancelled" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800"
                  }`}>
                    {appointment.status}
                  </span>
                </dd>
              </div>
              {appointment.title && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Title</dt>
                  <dd className="mt-1 text-slate-900">{appointment.title}</dd>
                </div>
              )}
              {appointment.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Notes</dt>
                  <dd className="mt-1 text-slate-900 whitespace-pre-wrap">{appointment.notes}</dd>
                </div>
              )}
            </dl>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Patient</label>
                <select
                  className={inputClass}
                  value={form.patientId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start</label>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={form.startAt ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>End</label>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={form.endAt ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    className={inputClass}
                    value={form.type ?? "consultation"}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    <option value="consultation">Consultation</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="video">Video call</option>
                    <option value="retrieval">Retrieval</option>
                    <option value="transfer">Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    className={inputClass}
                    value={form.status ?? "scheduled"}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No show</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Title</label>
                <input
                  className={inputClass}
                  value={form.title ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={form.notes ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
