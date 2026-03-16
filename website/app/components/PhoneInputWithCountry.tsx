"use client";

import dynamic from "next/dynamic";
import "react-phone-number-input/style.css";

export type PhoneValue = string | undefined;

interface PhoneInputWithCountryProps {
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const PhoneInput = dynamic(() => import("react-phone-number-input").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="h-[42px] w-full rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
  ),
});

export function PhoneInputWithCountry({
  value,
  onChange,
  placeholder = "Enter phone number",
  disabled = false,
  id,
  className = "",
}: PhoneInputWithCountryProps) {
  return (
    <div
      className={`PhoneInputWrapper flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 ${className}`}
    >
      <PhoneInput
        id={id}
        international
        defaultCountry="PK"
        placeholder={placeholder}
        value={value ?? undefined}
        onChange={(v) => onChange(v ?? undefined)}
        disabled={disabled}
        className="flex-1 min-w-0 !border-0 !ring-0 bg-transparent px-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm outline-none"
      />
    </div>
  );
}
