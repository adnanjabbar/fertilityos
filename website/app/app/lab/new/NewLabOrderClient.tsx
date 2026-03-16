"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Patient = { id: string; firstName: string; lastName: string };
type LabTest = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  unit: string | null;
  referenceRangeLow: string | null;
  referenceRangeHigh: string | null;
  referenceRangeMaleLow: string | null;
  referenceRangeMaleHigh: string | null;
  referenceRangeFemaleLow: string | null;
  referenceRangeFemaleHigh: string | null;
  isPanel: boolean;
};

const SEARCH_DROPDOWN_MAX = 12;

function TestSearchCombobox({
  tests,
  selectedIds,
  onSelect,
  disabled,
}: {
  tests: LabTest[];
  selectedIds: Set<string>;
  onSelect: (t: LabTest) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = tests.filter((t) => {
    if (t.isPanel) return false;
    if (selectedIds.has(t.id)) return false;
    if (searchTerms.length === 0) return false;
    const code = (t.code || "").toLowerCase();
    const name = (t.name || "").toLowerCase();
    const cat = (t.category || "").toLowerCase();
    const combined = `${code} ${name} ${cat}`;
    return searchTerms.every((term) => combined.includes(term));
  });
  const slice = matches.slice(0, SEARCH_DROPDOWN_MAX);
  const showDropdown = focused && (query.trim() !== "");

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    if (!showDropdown || highlightIndex < 0 || highlightIndex >= slice.length) return;
    listRef.current?.children[highlightIndex]?.scrollIntoView({ block: "nearest" });
  }, [showDropdown, highlightIndex, slice.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || slice.length === 0) {
      if (e.key === "Escape") setQuery("");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % slice.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + slice.length) % slice.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const t = slice[highlightIndex];
      if (t) {
        onSelect(t);
        setQuery("");
        setHighlightIndex(0);
      }
      return;
    }
    if (e.key === "Escape") {
      setQuery("");
      setFocused(false);
      setHighlightIndex(0);
    }
  };

  return (
    <div className="relative">
      <input
        type="search"
        placeholder="Type test code, name or category to search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
      />
      {showDropdown && (
        <ul
          ref={listRef}
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {slice.map((t, idx) => (
            <li
              key={t.id}
              role="option"
              aria-selected={idx === highlightIndex}
              className={`cursor-pointer px-4 py-2.5 text-sm ${
                idx === highlightIndex ? "bg-blue-50 text-blue-900" : "text-slate-800 hover:bg-slate-50"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(t);
                setQuery("");
                setHighlightIndex(0);
              }}
            >
              <span className="font-medium">{t.code}</span>
              <span className="text-slate-600"> — {t.name}</span>
              {t.category && (
                <span className="ml-1 text-xs text-slate-500">({t.category})</span>
              )}
            </li>
          ))}
          {matches.length > SEARCH_DROPDOWN_MAX && (
            <li className="px-4 py-2 text-xs text-slate-500">
              Type more to narrow down ({matches.length} matches)
            </li>
          )}
        </ul>
      )}
      {query.trim() !== "" && matches.length === 0 && (
        <p className="mt-1.5 text-sm text-slate-500">No tests match &quot;{query.trim()}&quot;</p>
      )}
    </div>
  );
}

function SelectedTestCard({
  test,
  onRemove,
}: {
  test: LabTest;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">
            {test.code} — {test.name}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-600">
            {test.category && <span>Category: {test.category}</span>}
            {test.unit && <span>Unit: {test.unit}</span>}
          </div>
          {(test.referenceRangeMaleLow != null ||
            test.referenceRangeFemaleLow != null ||
            test.referenceRangeMaleHigh != null ||
            test.referenceRangeFemaleHigh != null) && (
            <div className="mt-1.5 text-xs text-slate-500">
              <span className="font-medium">Reference: </span>
              Male {test.referenceRangeMaleLow ?? "—"}–{test.referenceRangeMaleHigh ?? "—"}
              {" · "}
              Female {test.referenceRangeFemaleLow ?? "—"}–{test.referenceRangeFemaleHigh ?? "—"}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Remove test"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function NewLabOrderClient() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patientId, setPatientId] = useState("");
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIds = new Set(selectedTests.map((t) => t.id));

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

  const addTest = (test: LabTest) => {
    if (selectedIds.has(test.id)) return;
    setSelectedTests((prev) => [...prev, test]);
  };

  const removeTest = (id: string) => {
    setSelectedTests((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!patientId || selectedTests.length === 0) {
      setError("Select a patient and at least one test.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/app/lab/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          testIds: selectedTests.map((t) => t.id),
        }),
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
        <label className="mb-2 block text-sm font-semibold text-slate-700">Add tests</label>
        {tests.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No tests in catalog. Run:{" "}
            <code className="bg-amber-100 px-1">node scripts/seed-lab-tests-nabl.js</code> from the{" "}
            <code className="bg-amber-100 px-1">website</code> folder to load the default NABL-style test list.
          </p>
        ) : (
          <>
            <p className="mb-2 text-xs text-slate-500">
              Search by code, name or category. Select a test to add it; its parameters and reference ranges are shown
              below.
            </p>
            <TestSearchCombobox
              tests={tests}
              selectedIds={selectedIds}
              onSelect={addTest}
              disabled={submitting}
            />

            {selectedTests.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  Selected tests ({selectedTests.length})
                </p>
                <ul className="space-y-3">
                  {selectedTests.map((t) => (
                    <li key={t.id}>
                      <SelectedTestCard test={t} onRemove={() => removeTest(t.id)} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || selectedTests.length === 0}
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
