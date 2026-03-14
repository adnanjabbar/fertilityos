"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";

type Item = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  reorderLevel: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

function isLowStock(quantity: string, reorderLevel: string): boolean {
  const q = parseFloat(quantity);
  const r = parseFloat(reorderLevel);
  if (Number.isNaN(q) || Number.isNaN(r)) return false;
  return q <= r;
}

export default function InventoryClient() {
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", quantity: "0", unit: "units", reorderLevel: "0", notes: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Item>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/app/inventory");
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setAddError("Name is required.");
      return;
    }
    setAddError(null);
    setAddLoading(true);
    try {
      const res = await fetch("/api/app/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          quantity: form.quantity,
          unit: form.unit || "units",
          reorderLevel: form.reorderLevel || "0",
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(data.error || "Failed to add item.");
        return;
      }
      setShowAdd(false);
      setForm({ name: "", quantity: "0", unit: "units", reorderLevel: "0", notes: "" });
      fetchList();
    } finally {
      setAddLoading(false);
    }
  };

  const handleSave = async (id: string) => {
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/app/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          quantity: editForm.quantity,
          unit: editForm.unit,
          reorderLevel: editForm.reorderLevel,
          notes: editForm.notes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddError(data.error || "Failed to update.");
        return;
      }
      setEditingId(null);
      fetchList();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/app/inventory/${id}`, { method: "DELETE" });
    if (res.ok) fetchList();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800"
        >
          <Plus className="w-5 h-5" />
          Add item
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">New item</h2>
          {addError && <p className="text-sm text-red-600 mb-2">{addError}</p>}
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Name *</label>
                <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>Quantity</label>
                <input type="number" min={0} step="any" className={inputClass} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Unit</label>
                <input className={inputClass} value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="e.g. units, boxes" />
              </div>
              <div>
                <label className={labelClass}>Reorder level</label>
                <input type="number" min={0} step="any" className={inputClass} value={form.reorderLevel} onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea rows={2} className={inputClass} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={addLoading} className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60">{addLoading ? "Adding…" : "Add"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No inventory items yet.</p>
            <p className="text-slate-500 text-sm mt-1">Add consumables above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 font-medium">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Reorder level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {editingId === item.id ? (
                      <input className={inputClass + " py-1.5"} value={editForm.name ?? item.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                    ) : (
                      <span className="font-medium text-slate-900">{item.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === item.id ? (
                      <input type="number" min={0} className={inputClass + " w-24 py-1.5"} value={editForm.quantity ?? item.quantity} onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))} />
                    ) : (
                      item.quantity
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === item.id ? (
                      <input className={inputClass + " w-24 py-1.5"} value={editForm.unit ?? item.unit} onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))} />
                    ) : (
                      item.unit
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === item.id ? (
                      <input type="number" min={0} className={inputClass + " w-24 py-1.5"} value={editForm.reorderLevel ?? item.reorderLevel} onChange={(e) => setEditForm((f) => ({ ...f, reorderLevel: e.target.value }))} />
                    ) : (
                      item.reorderLevel
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isLowStock(item.quantity, item.reorderLevel) ? (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Low stock</span>
                    ) : (
                      <span className="text-slate-500">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === item.id ? (
                      <div className="flex gap-1">
                        <button type="button" onClick={() => handleSave(item.id)} disabled={saveLoading} className="text-blue-700 font-medium text-xs hover:underline">Save</button>
                        <button type="button" onClick={() => setEditingId(null)} className="text-slate-500 text-xs hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setEditingId(item.id); setEditForm({ name: item.name, quantity: item.quantity, unit: item.unit, reorderLevel: item.reorderLevel, notes: item.notes }); }} className="text-slate-600 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                        <button type="button" onClick={() => handleDelete(item.id)} className="text-slate-600 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
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
