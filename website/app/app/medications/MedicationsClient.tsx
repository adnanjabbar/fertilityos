"use client";

import { useState, useEffect, useCallback } from "react";
import { Pill, Plus, Pencil, Trash2, ListOrdered, X } from "lucide-react";

const MEDICATION_FORMS = [
  "tablet",
  "capsule",
  "injection",
  "suppository",
  "pessary",
  "syrup",
  "cream",
  "gel",
  "drops",
  "inhaler",
  "other",
] as const;

const FREQUENCY_OPTIONS = [
  { value: "OD", label: "Once daily (OD)" },
  { value: "BD", label: "Twice daily (BD)" },
  { value: "TDS", label: "Three times daily (TDS)" },
  { value: "QID", label: "Four times daily (QID)" },
  { value: "at_night", label: "At night" },
  { value: "at_morning", label: "In the morning" },
  { value: "once_weekly", label: "Once weekly" },
  { value: "twice_weekly", label: "Twice weekly" },
  { value: "half_monthly", label: "Half monthly" },
  { value: "once_monthly", label: "Once monthly" },
  { value: "as_needed", label: "As needed" },
  { value: "other", label: "Other" },
];

const INSTRUCTION_KEYS = [
  { key: "pregnancy_safe", label: "Pregnancy safe" },
  { key: "lactation_safe", label: "Lactation safe" },
  { key: "addiction_risk", label: "Addiction risk" },
  { key: "dependency_risk", label: "Dependency risk" },
  { key: "drug_interaction_risk", label: "Drug interaction risk" },
  { key: "cautions", label: "Cautions" },
] as const;

type Medication = {
  id: string;
  brandName: string;
  genericName: string;
  dosage: string;
  form: string;
  frequencyOptions: string[];
  instructionsCheckboxes: Record<string, boolean>;
  instructionsExtended: string | null;
  pharmaceuticalCompany: string | null;
  createdAt: string;
  updatedAt: string;
};

type MedicationGroup = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type GroupItem = {
  id: string;
  medicationId: string;
  quantityPerCycle: string | null;
  defaultDurationDays: number | null;
  sortOrder: number;
  brandName: string;
  genericName: string;
  dosage: string;
  form: string;
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]";
const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

export default function MedicationsClient() {
  const [tab, setTab] = useState<"formulary" | "protocols">("formulary");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [groups, setGroups] = useState<MedicationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMed, setShowAddMed] = useState(false);
  const [addMedLoading, setAddMedLoading] = useState(false);
  const [addMedError, setAddMedError] = useState<string | null>(null);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [editMedForm, setEditMedForm] = useState<Partial<Medication>>({});
  const [saveMedLoading, setSaveMedLoading] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [addGroupLoading, setAddGroupLoading] = useState(false);
  const [addGroupError, setAddGroupError] = useState<string | null>(null);
  const [addGroupForm, setAddGroupForm] = useState({ name: "", description: "" });
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupForm, setEditGroupForm] = useState<Partial<MedicationGroup>>({});
  const [saveGroupLoading, setSaveGroupLoading] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupItems, setGroupItems] = useState<Record<string, GroupItem[]>>({});
  const [showAddGroupItem, setShowAddGroupItem] = useState<string | null>(null);
  const [addGroupItemMedicationId, setAddGroupItemMedicationId] = useState("");
  const [addGroupItemQuantity, setAddGroupItemQuantity] = useState("");
  const [addGroupItemDuration, setAddGroupItemDuration] = useState("");
  const [addGroupItemLoading, setAddGroupItemLoading] = useState(false);

  const defaultMedForm = {
    brandName: "",
    genericName: "",
    dosage: "",
    form: "tablet" as const,
    frequencyOptions: [] as string[],
    instructionsCheckboxes: {} as Record<string, boolean>,
    instructionsExtended: "",
    pharmaceuticalCompany: "",
  };

  const [medForm, setMedForm] = useState(defaultMedForm);

  const fetchMedications = useCallback(async () => {
    const res = await fetch("/api/app/medications");
    if (res.ok) setMedications(await res.json());
  }, []);

  const fetchGroups = useCallback(async () => {
    const res = await fetch("/api/app/medication-groups");
    if (res.ok) setGroups(await res.json());
  }, []);

  const fetchGroupItems = useCallback(async (groupId: string) => {
    const res = await fetch(`/api/app/medication-groups/${groupId}/items`);
    if (res.ok) {
      const items = await res.json();
      setGroupItems((prev) => ({ ...prev, [groupId]: items }));
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMedications(), fetchGroups()]).finally(() => setLoading(false));
  }, [fetchMedications, fetchGroups]);

  useEffect(() => {
    if (expandedGroupId) fetchGroupItems(expandedGroupId);
  }, [expandedGroupId, fetchGroupItems]);

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medForm.brandName.trim() || !medForm.genericName.trim() || !medForm.dosage.trim()) {
      setAddMedError("Brand name, generic name, and dosage are required.");
      return;
    }
    setAddMedError(null);
    setAddMedLoading(true);
    try {
      const res = await fetch("/api/app/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: medForm.brandName.trim(),
          genericName: medForm.genericName.trim(),
          dosage: medForm.dosage.trim(),
          form: medForm.form,
          frequencyOptions: medForm.frequencyOptions,
          instructionsCheckboxes: medForm.instructionsCheckboxes,
          instructionsExtended: medForm.instructionsExtended?.trim() || null,
          pharmaceuticalCompany: medForm.pharmaceuticalCompany?.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddMedError(data.error || "Failed to add medication.");
        return;
      }
      setShowAddMed(false);
      setMedForm(defaultMedForm);
      fetchMedications();
    } finally {
      setAddMedLoading(false);
    }
  };

  const handleSaveMed = async (id: string) => {
    setSaveMedLoading(true);
    try {
      const res = await fetch(`/api/app/medications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: editMedForm.brandName,
          genericName: editMedForm.genericName,
          dosage: editMedForm.dosage,
          form: editMedForm.form,
          frequencyOptions: editMedForm.frequencyOptions,
          instructionsCheckboxes: editMedForm.instructionsCheckboxes,
          instructionsExtended: editMedForm.instructionsExtended,
          pharmaceuticalCompany: editMedForm.pharmaceuticalCompany,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddMedError(data.error || "Failed to update.");
        return;
      }
      setEditingMedId(null);
      fetchMedications();
    } finally {
      setSaveMedLoading(false);
    }
  };

  const handleDeleteMed = async (id: string) => {
    if (!confirm("Remove this medication from the formulary?")) return;
    const res = await fetch(`/api/app/medications/${id}`, { method: "DELETE" });
    if (res.ok) fetchMedications();
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addGroupForm.name.trim()) {
      setAddGroupError("Name is required.");
      return;
    }
    setAddGroupError(null);
    setAddGroupLoading(true);
    try {
      const res = await fetch("/api/app/medication-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addGroupForm.name.trim(),
          description: addGroupForm.description.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddGroupError(data.error || "Failed to add protocol.");
        return;
      }
      setShowAddGroup(false);
      setAddGroupForm({ name: "", description: "" });
      fetchGroups();
    } finally {
      setAddGroupLoading(false);
    }
  };

  const handleSaveGroup = async (id: string) => {
    setSaveGroupLoading(true);
    try {
      const res = await fetch(`/api/app/medication-groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editGroupForm.name,
          description: editGroupForm.description,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddGroupError(data.error || "Failed to update.");
        return;
      }
      setEditingGroupId(null);
      fetchGroups();
    } finally {
      setSaveGroupLoading(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Delete this protocol? Medications in it will no longer be prescribed as a group.")) return;
    const res = await fetch(`/api/app/medication-groups/${id}`, { method: "DELETE" });
    if (res.ok) {
      setExpandedGroupId(null);
      fetchGroups();
    }
  };

  const handleAddGroupItem = async (groupId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!addGroupItemMedicationId) return;
    setAddGroupItemLoading(true);
    try {
      const res = await fetch(`/api/app/medication-groups/${groupId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId: addGroupItemMedicationId,
          quantityPerCycle: addGroupItemQuantity.trim() || null,
          defaultDurationDays: addGroupItemDuration ? parseInt(addGroupItemDuration, 10) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddGroupError(data.error || "Failed to add medication to protocol.");
        return;
      }
      setShowAddGroupItem(null);
      setAddGroupItemMedicationId("");
      setAddGroupItemQuantity("");
      setAddGroupItemDuration("");
      fetchGroupItems(groupId);
    } finally {
      setAddGroupItemLoading(false);
    }
  };

  const handleRemoveGroupItem = async (groupId: string, itemId: string) => {
    if (!confirm("Remove this medication from the protocol?")) return;
    const res = await fetch(`/api/app/medication-groups/${groupId}/items/${itemId}`, { method: "DELETE" });
    if (res.ok) fetchGroupItems(groupId);
  };

  if (loading) {
    return <div className="text-slate-500 py-8">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("formulary")}
          className={`px-4 py-2 font-medium rounded-t-xl border-b-2 min-h-[44px] ${
            tab === "formulary"
              ? "border-blue-600 text-blue-700 bg-blue-50"
              : "border-transparent text-slate-600 hover:bg-slate-50"
          }`}
        >
          Formulary
        </button>
        <button
          type="button"
          onClick={() => setTab("protocols")}
          className={`px-4 py-2 font-medium rounded-t-xl border-b-2 min-h-[44px] ${
            tab === "protocols"
              ? "border-blue-600 text-blue-700 bg-blue-50"
              : "border-transparent text-slate-600 hover:bg-slate-50"
          }`}
        >
          Protocols (groups)
        </button>
      </div>

      {tab === "formulary" && (
        <>
          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            Adding instructions helps patients follow their medication plans.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAddMed(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 min-h-[44px]"
            >
              <Plus className="w-5 h-5" />
              Add medication
            </button>
          </div>

          {showAddMed && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4">New medication</h2>
              {addMedError && <p className="text-sm text-red-600 mb-2">{addMedError}</p>}
              <form onSubmit={handleAddMed} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Brand name *</label>
                    <input className={inputClass} value={medForm.brandName} onChange={(e) => setMedForm((f) => ({ ...f, brandName: e.target.value }))} required />
                  </div>
                  <div>
                    <label className={labelClass}>Generic name *</label>
                    <input className={inputClass} value={medForm.genericName} onChange={(e) => setMedForm((f) => ({ ...f, genericName: e.target.value }))} required />
                  </div>
                  <div>
                    <label className={labelClass}>Dosage *</label>
                    <input className={inputClass} value={medForm.dosage} onChange={(e) => setMedForm((f) => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 10mg" required />
                  </div>
                  <div>
                    <label className={labelClass}>Form</label>
                    <select className={inputClass} value={medForm.form} onChange={(e) => setMedForm((f) => ({ ...f, form: e.target.value as typeof medForm.form }))}>
                      {MEDICATION_FORMS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Frequency options (select all that apply)</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <label key={opt.value} className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={medForm.frequencyOptions.includes(opt.value)}
                          onChange={(e) => {
                            if (e.target.checked)
                              setMedForm((f) => ({ ...f, frequencyOptions: [...f.frequencyOptions, opt.value] }));
                            else
                              setMedForm((f) => ({ ...f, frequencyOptions: f.frequencyOptions.filter((x) => x !== opt.value) }));
                          }}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Instructions (check all that apply)</label>
                  <div className="flex flex-wrap gap-4 mt-1">
                    {INSTRUCTION_KEYS.map(({ key, label }) => (
                      <label key={key} className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!medForm.instructionsCheckboxes[key]}
                          onChange={(e) =>
                            setMedForm((f) => ({
                              ...f,
                              instructionsCheckboxes: { ...f.instructionsCheckboxes, [key]: e.target.checked },
                            }))
                          }
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Extended instructions (clinic-defined)</label>
                  <textarea rows={3} className={inputClass} value={medForm.instructionsExtended} onChange={(e) => setMedForm((f) => ({ ...f, instructionsExtended: e.target.value }))} placeholder="Optional" />
                </div>
                <div>
                  <label className={labelClass}>Pharmaceutical company (optional)</label>
                  <input className={inputClass} value={medForm.pharmaceuticalCompany} onChange={(e) => setMedForm((f) => ({ ...f, pharmaceuticalCompany: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAddMed(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 min-h-[44px]">Cancel</button>
                  <button type="submit" disabled={addMedLoading} className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60 min-h-[44px]">{addMedLoading ? "Adding…" : "Add"}</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {medications.length === 0 ? (
              <div className="p-12 text-center">
                <Pill className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No medications in formulary yet.</p>
                <p className="text-slate-500 text-sm mt-1">Add medications above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 font-medium">
                      <th className="px-4 py-3">Brand / Generic</th>
                      <th className="px-4 py-3">Dosage</th>
                      <th className="px-4 py-3">Form</th>
                      <th className="px-4 py-3">Frequencies</th>
                      <th className="px-4 py-3 w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((med) => (
                      <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          {editingMedId === med.id ? (
                            <div className="space-y-1">
                              <input className={inputClass + " py-1.5"} value={editMedForm.brandName ?? med.brandName} onChange={(e) => setEditMedForm((f) => ({ ...f, brandName: e.target.value }))} placeholder="Brand" />
                              <input className={inputClass + " py-1.5"} value={editMedForm.genericName ?? med.genericName} onChange={(e) => setEditMedForm((f) => ({ ...f, genericName: e.target.value }))} placeholder="Generic" />
                            </div>
                          ) : (
                            <span className="font-medium text-slate-900">{med.brandName} / {med.genericName}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingMedId === med.id ? (
                            <input className={inputClass + " w-24 py-1.5"} value={editMedForm.dosage ?? med.dosage} onChange={(e) => setEditMedForm((f) => ({ ...f, dosage: e.target.value }))} />
                          ) : (
                            med.dosage
                          )}
                        </td>
                        <td className="px-4 py-3 capitalize">{med.form}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {(med.frequencyOptions || []).length ? (med.frequencyOptions || []).join(", ") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {editingMedId === med.id ? (
                            <div className="flex gap-1">
                              <button type="button" onClick={() => handleSaveMed(med.id)} disabled={saveMedLoading} className="text-blue-700 font-medium text-xs hover:underline">Save</button>
                              <button type="button" onClick={() => setEditingMedId(null)} className="text-slate-500 text-xs hover:underline">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => { setEditingMedId(med.id); setEditMedForm({ brandName: med.brandName, genericName: med.genericName, dosage: med.dosage, form: med.form, frequencyOptions: med.frequencyOptions || [], instructionsCheckboxes: med.instructionsCheckboxes || {}, instructionsExtended: med.instructionsExtended, pharmaceuticalCompany: med.pharmaceuticalCompany }); }} className="text-slate-600 hover:text-blue-700" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                              <button type="button" onClick={() => handleDeleteMed(med.id)} className="text-slate-600 hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "protocols" && (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAddGroup(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 min-h-[44px]"
            >
              <Plus className="w-5 h-5" />
              Add protocol
            </button>
          </div>

          {showAddGroup && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4">New protocol (medication group)</h2>
              {addGroupError && <p className="text-sm text-red-600 mb-2">{addGroupError}</p>}
              <form onSubmit={handleAddGroup} className="space-y-4">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input className={inputClass} value={addGroupForm.name} onChange={(e) => setAddGroupForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. IVF Protocol" required />
                </div>
                <div>
                  <label className={labelClass}>Description (optional)</label>
                  <textarea rows={2} className={inputClass} value={addGroupForm.description} onChange={(e) => setAddGroupForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAddGroup(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 min-h-[44px]">Cancel</button>
                  <button type="submit" disabled={addGroupLoading} className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60 min-h-[44px]">{addGroupLoading ? "Adding…" : "Add"}</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {groups.length === 0 ? (
              <div className="p-12 text-center">
                <ListOrdered className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No protocols yet.</p>
                <p className="text-slate-500 text-sm mt-1">Add a protocol above, then add medications from the formulary.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {groups.map((group) => (
                  <li key={group.id} className="border-b border-slate-100">
                    <div className="px-4 py-3 flex items-center justify-between bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                        className="flex-1 text-left font-medium text-slate-900 flex items-center gap-2"
                      >
                        {editingGroupId === group.id ? (
                          <input className={inputClass + " py-1.5 flex-1"} value={editGroupForm.name ?? group.name} onChange={(e) => setEditGroupForm((f) => ({ ...f, name: e.target.value }))} onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <>
                            <span>{group.name}</span>
                            {group.description && <span className="text-slate-500 font-normal text-sm">— {group.description}</span>}
                          </>
                        )}
                      </button>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {editingGroupId === group.id ? (
                          <>
                            <button type="button" onClick={() => handleSaveGroup(group.id)} disabled={saveGroupLoading} className="text-blue-700 font-medium text-sm">Save</button>
                            <button type="button" onClick={() => setEditingGroupId(null)} className="text-slate-500 text-sm">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => { setEditingGroupId(group.id); setEditGroupForm({ name: group.name, description: group.description }); }} className="text-slate-600 hover:text-blue-700" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                            <button type="button" onClick={() => handleDeleteGroup(group.id)} className="text-slate-600 hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </div>
                    {expandedGroupId === group.id && (
                      <div className="p-4 bg-white border-t border-slate-200">
                        <h4 className="font-semibold text-slate-900 mb-2">Medications in this protocol</h4>
                        {(groupItems[group.id] ?? []).length === 0 && showAddGroupItem !== group.id && (
                          <p className="text-slate-500 text-sm mb-2">No medications added. Add from formulary below.</p>
                        )}
                        {(groupItems[group.id] ?? []).length > 0 && (
                          <ul className="space-y-2 mb-4">
                            {(groupItems[group.id] ?? []).map((item) => (
                              <li key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 text-sm">
                                <span className="text-slate-900">{item.brandName} / {item.genericName} — {item.dosage}</span>
                                <span className="text-slate-500">{item.quantityPerCycle ?? "—"} · {item.defaultDurationDays != null ? `${item.defaultDurationDays} days` : "—"}</span>
                                <button type="button" onClick={() => handleRemoveGroupItem(group.id, item.id)} className="text-red-600 hover:underline text-xs">Remove</button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {showAddGroupItem === group.id ? (
                          <form onSubmit={(e) => handleAddGroupItem(group.id, e)} className="p-3 bg-slate-50 rounded-xl space-y-2">
                            <div>
                              <label className={labelClass}>Medication from formulary</label>
                              <select className={inputClass} value={addGroupItemMedicationId} onChange={(e) => setAddGroupItemMedicationId(e.target.value)} required>
                                <option value="">Select…</option>
                                {medications.filter((m) => !(groupItems[group.id] ?? []).some((i) => i.medicationId === m.id)).map((m) => (
                                  <option key={m.id} value={m.id}>{m.brandName} / {m.genericName} — {m.dosage}</option>
                                ))}
                                {medications.length === 0 && <option value="" disabled>No medications in formulary</option>}
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Quantity per cycle (optional)</label>
                                <input className={inputClass} value={addGroupItemQuantity} onChange={(e) => setAddGroupItemQuantity(e.target.value)} placeholder="e.g. 1 box" />
                              </div>
                              <div>
                                <label className={labelClass}>Default duration (days)</label>
                                <input type="number" min={0} className={inputClass} value={addGroupItemDuration} onChange={(e) => setAddGroupItemDuration(e.target.value)} placeholder="e.g. 14" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setShowAddGroupItem(null)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-sm">Cancel</button>
                              <button type="submit" disabled={addGroupItemLoading} className="px-3 py-1.5 rounded-lg bg-blue-700 text-white text-sm disabled:opacity-60">{addGroupItemLoading ? "Adding…" : "Add"}</button>
                            </div>
                          </form>
                        ) : (
                          <button type="button" onClick={() => setShowAddGroupItem(group.id)} className="text-sm text-blue-700 font-medium hover:underline">Add medication from formulary</button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
