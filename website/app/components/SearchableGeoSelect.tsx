"use client";

import { useState, useEffect, useRef } from "react";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

export type GeoOption = { code?: string; name: string; flag?: string };

interface SearchableGeoSelectProps {
  placeholder: string;
  value: string;
  onChange: (name: string, code?: string) => void;
  options: GeoOption[];
  loading?: boolean;
  disabled?: boolean;
  getDisplayLabel: (opt: GeoOption) => string;
  id?: string;
}

const MAX_LIST = 12;

export function SearchableGeoSelect({
  placeholder,
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  getDisplayLabel,
  id,
}: SearchableGeoSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered =
    searchTerms.length === 0
      ? options
      : options.filter((opt) => {
          const label = getDisplayLabel(opt).toLowerCase();
          return searchTerms.every((t) => label.includes(t));
        });
  const slice = filtered.slice(0, MAX_LIST);

  useEffect(() => setHighlightIndex(0), [query]);
  useEffect(() => {
    if (!open) return;
    const el = containerRef.current?.querySelector(`[data-geo-index="${highlightIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, highlightIndex, slice.length]);

  useEffect(() => {
    const onBlur = () => setTimeout(() => setOpen(false), 150);
    const c = containerRef.current;
    c?.addEventListener("focusout", onBlur);
    return () => c?.removeEventListener("focusout", onBlur);
  }, []);

  const handleSelect = (opt: GeoOption) => {
    onChange(opt.name, opt.code);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || slice.length === 0) {
      if (e.key === "Escape") setOpen(false);
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
      handleSelect(slice[highlightIndex]);
      return;
    }
    if (e.key === "Escape") {
      setQuery("");
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={open ? query : value}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
        className={inputClass}
      />
      {open && (
        <ul
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {loading ? (
            <li className="px-4 py-3 text-sm text-slate-500">Loading…</li>
          ) : slice.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">
              {query.trim() ? `No match for "${query.trim()}"` : "No options"}
            </li>
          ) : (
            slice.map((opt, idx) => (
              <li
                key={opt.code ? `${opt.code}-${opt.name}` : `${opt.name}-${idx}`}
                data-geo-index={idx}
                role="option"
                aria-selected={idx === highlightIndex}
                className={`cursor-pointer px-4 py-2.5 text-sm ${
                  idx === highlightIndex ? "bg-blue-50 text-blue-900" : "text-slate-800 hover:bg-slate-50"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt);
                }}
              >
                {getDisplayLabel(opt)}
              </li>
            ))
          )}
          {filtered.length > MAX_LIST && (
            <li className="px-4 py-2 text-xs text-slate-500">Type to narrow ({filtered.length} matches)</li>
          )}
        </ul>
      )}
    </div>
  );
}
