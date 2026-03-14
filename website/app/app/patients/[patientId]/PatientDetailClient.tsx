"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Save, X, FileText, Plus, FlaskConical } from "lucide-react";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  gender: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type ClinicalNote = {
  id: string;
  authorName: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  diagnosisCode: string | null;
  createdAt: string;
  updatedAt: string;
};

type IvfCycle = {
  id: string;
  patientId: string;
  cycleNumber: string;
  cycleType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Embryo = {
  id: string;
  cycleId: string;
  day: string | null;
  grade: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { dateStyle: "medium" });
}

export default function PatientDetailClient({ patientId }: { patientId: string }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Patient>>({});
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [addNoteLoading, setAddNoteLoading] = useState(false);
  const [addNoteError, setAddNoteError] = useState<string | null>(null);
  const [addNoteForm, setAddNoteForm] = useState({ subjective: "", objective: "", assessment: "", plan: "", diagnosisCode: "" });
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteForm, setEditNoteForm] = useState<Partial<ClinicalNote>>({});
  const [saveNoteLoading, setSaveNoteLoading] = useState(false);
  const [cycles, setCycles] = useState<IvfCycle[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [showAddCycle, setShowAddCycle] = useState(false);
  const [addCycleLoading, setAddCycleLoading] = useState(false);
  const [addCycleForm, setAddCycleForm] = useState({ cycleNumber: "", cycleType: "fresh", startDate: "", endDate: "", notes: "" });
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [cycleEmbryos, setCycleEmbryos] = useState<Record<string, Embryo[]>>({});
  const [showAddEmbryo, setShowAddEmbryo] = useState<string | null>(null);
  const [addEmbryoForm, setAddEmbryoForm] = useState({ day: "", grade: "", status: "fresh", notes: "" });
  const [addEmbryoLoading, setAddEmbryoLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/app/patients/${patientId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setPatient(data);
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          country: data.country ?? "",
          postalCode: data.postalCode ?? "",
          gender: data.gender ?? "",
          notes: data.notes ?? "",
        });
      })
      .catch(() => setError("Patient not found"))
      .finally(() => setLoading(false));
  }, [patientId]);

  const fetchNotes = useCallback(() => {
    setNotesLoading(true);
    fetch(`/api/app/patients/${patientId}/notes`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setNotes)
      .finally(() => setNotesLoading(false));
  }, [patientId]);

  useEffect(() => {
    if (patientId) fetchNotes();
  }, [patientId, fetchNotes]);

  const fetchCycles = useCallback(() => {
    setCyclesLoading(true);
    fetch(`/api/app/patients/${patientId}/cycles`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setCycles)
      .finally(() => setCyclesLoading(false));
  }, [patientId]);

  useEffect(() => {
    if (patientId) fetchCycles();
  }, [patientId, fetchCycles]);

  const fetchEmbryos = useCallback(async (cycleId: string) => {
    const res = await fetch(`/api/app/ivf-cycles/${cycleId}/embryos`);
    if (res.ok) {
      const list = await res.json();
      setCycleEmbryos((prev) => ({ ...prev, [cycleId]: list }));
    }
  }, []);

  useEffect(() => {
    if (expandedCycleId) fetchEmbryos(expandedCycleId);
  }, [expandedCycleId, fetchEmbryos]);

  const handleAddCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCycleForm.cycleNumber.trim()) return;
    setAddCycleLoading(true);
    try {
      const res = await fetch(`/api/app/patients/${patientId}/cycles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleNumber: addCycleForm.cycleNumber.trim(),
          cycleType: addCycleForm.cycleType,
          startDate: addCycleForm.startDate || null,
          endDate: addCycleForm.endDate || null,
          notes: addCycleForm.notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddNoteError(data.error || "Failed to add cycle");
        return;
      }
      setShowAddCycle(false);
      setAddCycleForm({ cycleNumber: "", cycleType: "fresh", startDate: "", endDate: "", notes: "" });
      fetchCycles();
    } finally {
      setAddCycleLoading(false);
    }
  };

  const handleAddEmbryo = async (cycleId: string, e: React.FormEvent) => {
    e.preventDefault();
    setAddEmbryoLoading(true);
    try {
      const res = await fetch(`/api/app/ivf-cycles/${cycleId}/embryos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: addEmbryoForm.day.trim() || undefined,
          grade: addEmbryoForm.grade.trim() || undefined,
          status: addEmbryoForm.status,
          notes: addEmbryoForm.notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddNoteError(data.error || "Failed to add embryo");
        return;
      }
      setShowAddEmbryo(null);
      setAddEmbryoForm({ day: "", grade: "", status: "fresh", notes: "" });
      fetchEmbryos(cycleId);
    } finally {
      setAddEmbryoLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddNoteError(null);
    setAddNoteLoading(true);
    try {
      const res = await fetch(`/api/app/patients/${patientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjective: addNoteForm.subjective.trim() || undefined,
          objective: addNoteForm.objective.trim() || undefined,
          assessment: addNoteForm.assessment.trim() || undefined,
          plan: addNoteForm.plan.trim() || undefined,
          diagnosisCode: addNoteForm.diagnosisCode.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddNoteError(data.error || "Failed to add note");
        return;
      }
      setShowAddNote(false);
      setAddNoteForm({ subjective: "", objective: "", assessment: "", plan: "", diagnosisCode: "" });
      fetchNotes();
    } finally {
      setAddNoteLoading(false);
    }
  };

  const handleSaveNote = async (noteId: string) => {
    setSaveNoteLoading(true);
    try {
      const res = await fetch(`/api/app/clinical-notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjective: editNoteForm.subjective ?? undefined,
          objective: editNoteForm.objective ?? undefined,
          assessment: editNoteForm.assessment ?? undefined,
          plan: editNoteForm.plan ?? undefined,
          diagnosisCode: editNoteForm.diagnosisCode ?? undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddNoteError(data.error || "Failed to update note");
        return;
      }
      setEditingNoteId(null);
      fetchNotes();
    } finally {
      setSaveNoteLoading(false);
    }
  };

  const handleSave = async () => {
    if (!patient) return;
    setSaveError(null);
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/app/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName?.trim(),
          lastName: form.lastName?.trim(),
          dateOfBirth: form.dateOfBirth || null,
          email: form.email?.trim() || null,
          phone: form.phone?.trim() || null,
          address: form.address?.trim() || null,
          city: form.city?.trim() || null,
          state: form.state?.trim() || null,
          country: form.country?.trim() || null,
          postalCode: form.postalCode?.trim() || null,
          gender: form.gender?.trim() || null,
          notes: form.notes?.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || "Failed to update");
        return;
      }
      setPatient(data);
      setForm({
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        country: data.country ?? "",
        postalCode: data.postalCode ?? "",
        gender: data.gender ?? "",
        notes: data.notes ?? "",
      });
      setEditing(false);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <div className="text-slate-500 py-8">Loading…</div>;
  if (error || !patient) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">{error ?? "Patient not found"}</p>
        <Link href="/app/patients" className="mt-4 inline-block text-blue-700 font-medium hover:underline">
          Back to patients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/app/patients"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to patients
        </Link>
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{saveError}</p>
        )}
        {editing ? (
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First name</label>
                <input
                  className={inputClass}
                  value={form.firstName ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input
                  className={inputClass}
                  value={form.lastName ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date of birth</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.dateOfBirth ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <input
                  className={inputClass}
                  value={form.gender ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                className={inputClass}
                value={form.email ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                className={inputClass}
                value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                className={inputClass}
                value={form.address ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>City</label>
                <input className={inputClass} value={form.city ?? ""} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input className={inputClass} value={form.state ?? ""} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input className={inputClass} value={form.country ?? ""} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Postal code</label>
                <input className={inputClass} value={form.postalCode ?? ""} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
              </div>
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
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">
              {patient.firstName} {patient.lastName}
            </h1>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date of birth</dt>
                <dd className="text-slate-900 mt-0.5">{formatDate(patient.dateOfBirth)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gender</dt>
                <dd className="text-slate-900 mt-0.5">{patient.gender ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</dt>
                <dd className="text-slate-900 mt-0.5">{patient.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</dt>
                <dd className="text-slate-900 mt-0.5">{patient.phone ?? "—"}</dd>
              </div>
              {(patient.address || patient.city) && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Address</dt>
                  <dd className="text-slate-900 mt-0.5">
                    {[patient.address, [patient.city, patient.state, patient.postalCode].filter(Boolean).join(", "), patient.country]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </dd>
                </div>
              )}
              {patient.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</dt>
                  <dd className="text-slate-900 mt-0.5 whitespace-pre-wrap">{patient.notes}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Added</dt>
                <dd className="text-slate-900 mt-0.5">{formatDate(patient.createdAt)}</dd>
              </div>
            </dl>
          </>
        )}
      </div>

      {/* Clinical notes (SOAP) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          Clinical notes
        </h2>
        {notesLoading ? (
          <p className="text-slate-500">Loading notes…</p>
        ) : (
          <>
            {!showAddNote ? (
              <button
                type="button"
                onClick={() => setShowAddNote(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 mb-4"
              >
                <Plus className="w-4 h-4" />
                Add note
              </button>
            ) : (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">New SOAP note</h3>
                {addNoteError && <p className="text-sm text-red-600 mb-2">{addNoteError}</p>}
                <form onSubmit={handleAddNote} className="space-y-3">
                  <div>
                    <label className={labelClass}>Subjective</label>
                    <textarea rows={2} className={inputClass} value={addNoteForm.subjective} onChange={(e) => setAddNoteForm((f) => ({ ...f, subjective: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Objective</label>
                    <textarea rows={2} className={inputClass} value={addNoteForm.objective} onChange={(e) => setAddNoteForm((f) => ({ ...f, objective: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Assessment</label>
                    <textarea rows={2} className={inputClass} value={addNoteForm.assessment} onChange={(e) => setAddNoteForm((f) => ({ ...f, assessment: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Plan</label>
                    <textarea rows={2} className={inputClass} value={addNoteForm.plan} onChange={(e) => setAddNoteForm((f) => ({ ...f, plan: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Diagnosis code</label>
                    <input className={inputClass} value={addNoteForm.diagnosisCode} onChange={(e) => setAddNoteForm((f) => ({ ...f, diagnosisCode: e.target.value }))} placeholder="Optional" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAddNote(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={addNoteLoading} className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60">{addNoteLoading ? "Saving…" : "Save note"}</button>
                  </div>
                </form>
              </div>
            )}
            {notes.length === 0 && !showAddNote ? (
              <p className="text-slate-500">No clinical notes yet. Add one above.</p>
            ) : (
              <ul className="space-y-4">
                {notes.map((note) => (
                  <li key={note.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      className="w-full px-4 py-3 flex items-center justify-between text-left bg-slate-50 hover:bg-slate-100"
                      onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                    >
                      <span className="font-medium text-slate-900">{formatDate(note.createdAt)} — {note.authorName}</span>
                      <span className="text-slate-500 text-sm">{expandedNoteId === note.id ? "Collapse" : "Expand"}</span>
                    </button>
                    {expandedNoteId === note.id && (
                      <div className="p-4 bg-white border-t border-slate-200">
                        {editingNoteId === note.id ? (
                          <div className="space-y-3">
                            {["subjective", "objective", "assessment", "plan"].map((key) => (
                              <div key={key}>
                                <label className={labelClass}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                                <textarea
                                  rows={2}
                                  className={inputClass}
                                  value={(editNoteForm as Record<string, string>)[key] ?? (note as Record<string, string>)[key] ?? ""}
                                  onChange={(e) => setEditNoteForm((f) => ({ ...f, [key]: e.target.value }))}
                                />
                              </div>
                            ))}
                            <div>
                              <label className={labelClass}>Diagnosis code</label>
                              <input
                                className={inputClass}
                                value={editNoteForm.diagnosisCode ?? note.diagnosisCode ?? ""}
                                onChange={(e) => setEditNoteForm((f) => ({ ...f, diagnosisCode: e.target.value }))}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setEditingNoteId(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                              <button type="button" onClick={() => handleSaveNote(note.id)} disabled={saveNoteLoading} className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60">{saveNoteLoading ? "Saving…" : "Save"}</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <dl className="grid grid-cols-1 gap-2 text-sm">
                              <div><dt className="text-slate-500">Subjective</dt><dd className="text-slate-900 whitespace-pre-wrap">{note.subjective || "—"}</dd></div>
                              <div><dt className="text-slate-500">Objective</dt><dd className="text-slate-900 whitespace-pre-wrap">{note.objective || "—"}</dd></div>
                              <div><dt className="text-slate-500">Assessment</dt><dd className="text-slate-900 whitespace-pre-wrap">{note.assessment || "—"}</dd></div>
                              <div><dt className="text-slate-500">Plan</dt><dd className="text-slate-900 whitespace-pre-wrap">{note.plan || "—"}</dd></div>
                              {note.diagnosisCode && <div><dt className="text-slate-500">Diagnosis code</dt><dd className="text-slate-900">{note.diagnosisCode}</dd></div>}
                            </dl>
                            <button type="button" onClick={() => { setEditingNoteId(note.id); setEditNoteForm({ subjective: note.subjective ?? "", objective: note.objective ?? "", assessment: note.assessment ?? "", plan: note.plan ?? "", diagnosisCode: note.diagnosisCode ?? "" }); }} className="mt-3 text-sm text-blue-700 font-medium hover:underline">Edit note</button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* IVF cycles */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-slate-600" />
          IVF cycles
        </h2>
        {cyclesLoading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <>
            {!showAddCycle ? (
              <button
                type="button"
                onClick={() => setShowAddCycle(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 mb-4"
              >
                <Plus className="w-4 h-4" />
                Add cycle
              </button>
            ) : (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">New IVF cycle</h3>
                <form onSubmit={handleAddCycle} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Cycle number</label>
                      <input className={inputClass} value={addCycleForm.cycleNumber} onChange={(e) => setAddCycleForm((f) => ({ ...f, cycleNumber: e.target.value }))} placeholder="e.g. 1" required />
                    </div>
                    <div>
                      <label className={labelClass}>Type</label>
                      <select className={inputClass} value={addCycleForm.cycleType} onChange={(e) => setAddCycleForm((f) => ({ ...f, cycleType: e.target.value }))}>
                        <option value="fresh">Fresh</option>
                        <option value="frozen">Frozen</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Start date</label>
                      <input type="date" className={inputClass} value={addCycleForm.startDate} onChange={(e) => setAddCycleForm((f) => ({ ...f, startDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>End date</label>
                      <input type="date" className={inputClass} value={addCycleForm.endDate} onChange={(e) => setAddCycleForm((f) => ({ ...f, endDate: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Notes</label>
                    <textarea rows={2} className={inputClass} value={addCycleForm.notes} onChange={(e) => setAddCycleForm((f) => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAddCycle(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={addCycleLoading} className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60">{addCycleLoading ? "Saving…" : "Add cycle"}</button>
                  </div>
                </form>
              </div>
            )}
            {cycles.length === 0 && !showAddCycle ? (
              <p className="text-slate-500">No IVF cycles yet. Add one above.</p>
            ) : (
              <ul className="space-y-4">
                {cycles.map((cycle) => (
                  <li key={cycle.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      className="w-full px-4 py-3 flex items-center justify-between text-left bg-slate-50 hover:bg-slate-100"
                      onClick={() => setExpandedCycleId(expandedCycleId === cycle.id ? null : cycle.id)}
                    >
                      <span className="font-medium text-slate-900">Cycle {cycle.cycleNumber} — {cycle.cycleType} · {cycle.status}</span>
                      <span className="text-slate-500 text-sm">{cycle.startDate ? formatDate(cycle.startDate) : "—"}</span>
                    </button>
                    {expandedCycleId === cycle.id && (
                      <div className="p-4 bg-white border-t border-slate-200">
                        <dl className="grid grid-cols-2 gap-2 text-sm mb-4">
                          <div><dt className="text-slate-500">Type</dt><dd className="text-slate-900 capitalize">{cycle.cycleType}</dd></div>
                          <div><dt className="text-slate-500">Status</dt><dd className="text-slate-900 capitalize">{cycle.status}</dd></div>
                          <div><dt className="text-slate-500">Start</dt><dd className="text-slate-900">{cycle.startDate ? formatDate(cycle.startDate) : "—"}</dd></div>
                          <div><dt className="text-slate-500">End</dt><dd className="text-slate-900">{cycle.endDate ? formatDate(cycle.endDate) : "—"}</dd></div>
                          {cycle.notes && <div className="col-span-2"><dt className="text-slate-500">Notes</dt><dd className="text-slate-900 whitespace-pre-wrap">{cycle.notes}</dd></div>}
                        </dl>
                        <h4 className="font-semibold text-slate-900 mb-2">Embryos</h4>
                        {(cycleEmbryos[cycle.id] ?? []).length === 0 && showAddEmbryo !== cycle.id && (
                          <p className="text-slate-500 text-sm mb-2">No embryos recorded.</p>
                        )}
                        {(cycleEmbryos[cycle.id] ?? []).length > 0 && (
                          <table className="w-full text-sm mb-3">
                            <thead><tr className="text-left text-slate-500"><th className="pb-1">Day</th><th className="pb-1">Grade</th><th className="pb-1">Status</th></tr></thead>
                            <tbody>
                              {(cycleEmbryos[cycle.id] ?? []).map((emb) => (
                                <tr key={emb.id}><td className="py-1">{emb.day ?? "—"}</td><td>{emb.grade ?? "—"}</td><td className="capitalize">{emb.status}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {showAddEmbryo === cycle.id ? (
                          <form onSubmit={(e) => handleAddEmbryo(cycle.id, e)} className="p-3 bg-slate-50 rounded-lg space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div><label className="text-xs font-medium text-slate-600">Day</label><input className={inputClass + " py-1.5"} value={addEmbryoForm.day} onChange={(e) => setAddEmbryoForm((f) => ({ ...f, day: e.target.value }))} placeholder="3 or 5" /></div>
                              <div><label className="text-xs font-medium text-slate-600">Grade</label><input className={inputClass + " py-1.5"} value={addEmbryoForm.grade} onChange={(e) => setAddEmbryoForm((f) => ({ ...f, grade: e.target.value }))} placeholder="e.g. 4AA" /></div>
                              <div><label className="text-xs font-medium text-slate-600">Status</label><select className={inputClass + " py-1.5"} value={addEmbryoForm.status} onChange={(e) => setAddEmbryoForm((f) => ({ ...f, status: e.target.value }))}><option value="fresh">Fresh</option><option value="frozen">Frozen</option><option value="transferred">Transferred</option><option value="discarded">Discarded</option></select></div>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setShowAddEmbryo(null)} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">Cancel</button>
                              <button type="submit" disabled={addEmbryoLoading} className="text-sm px-3 py-1.5 rounded-lg bg-blue-700 text-white disabled:opacity-60">{addEmbryoLoading ? "Saving…" : "Add embryo"}</button>
                            </div>
                          </form>
                        ) : (
                          <button type="button" onClick={() => setShowAddEmbryo(cycle.id)} className="text-sm text-blue-700 font-medium hover:underline">Add embryo</button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
