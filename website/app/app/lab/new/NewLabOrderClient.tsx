"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Patient = { id: string; firstName: string; lastName: string };
type LabTest = {
  id: string;
  code: string;
  name: string;
  unit: string | null;
  referenceRangeLow: string | null;
  referenceRangeHigh: string | null;
  isPanel: boolean;
};

export default function NewLabOrderClient() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patientId, setPatientId] = useState("");
  const [testIds, setTestIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/app/patients").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/app/lab/tests").then((r) => (r.ok ? r.json() : [])),
    ]).then(([pList, tList]) => {
      setPatients(Array.isArray(pList) ? pList : []);
      setTests(Array.isArray(tList) ? tList : []);
      setLoading(false);
    });
  }, []);

  const toggleTest = (id: string) => {
    setTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!patientId || testIds.size === 0) {
      setError("Select a patient and at least one test.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/app/lab/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, testIds: Array.from(testIds) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to create order.");
        return;
      }
      router.push(`/app/lab/orders/${data.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">Patient</label>
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-400"
          required
        >
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {[p.firstName, p.lastName].filter(Boolean).join(" ") || p.id}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Tests</label>
        {tests.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No tests in catalog. Add tests to create orders. (Test catalog UI coming soon; for now use API or DB.)
          </p>
        ) : (
          <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
            {tests.filter((t) => !t.isPanel).map((t) => (
              <li key={t.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={t.id}
                  checked={testIds.has(t.id)}
                  onChange={() => toggleTest(t.id)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <label htmlFor={t.id} className="cursor-pointer text-sm text-slate-900">
                  {t.code} — {t.name}
                  {t.unit && ` (${t.unit})`}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || testIds.size === 0}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create order"}
        </button>
        <Link
          href="/app/lab"
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
