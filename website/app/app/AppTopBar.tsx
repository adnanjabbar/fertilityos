"use client";

import LanguageSwitcher from "../components/LanguageSwitcher";

type AppTopBarProps = {
  userName: string;
  tenantName: string | null;
};

export default function AppTopBar({ userName, tenantName }: AppTopBarProps) {
  return (
    <div className="hidden lg:flex absolute top-4 right-6 items-center gap-3 z-10">
      <LanguageSwitcher variant="dropdown" className="shrink-0" />
      <span className="text-sm text-slate-500">
        <span className="font-medium text-slate-700">{tenantName ?? "Clinic"}</span>
        {" · "}
        <span className="text-slate-600">{userName}</span>
      </span>
    </div>
  );
}
