"use client";

import type { ComplianceSection, ComplianceStatus } from "@/lib/compliance-checklist";
import { Shield, CheckCircle, Clock, MinusCircle } from "lucide-react";

function StatusBadge({ status }: { status: ComplianceStatus }) {
  switch (status) {
    case "implemented":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5" />
          Implemented
        </span>
      );
    case "planned":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          Planned
        </span>
      );
    case "n_a":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <MinusCircle className="w-3.5 h-3.5" />
          N/A
        </span>
      );
    default: {
      const _: never = status;
      return null;
    }
  }
}

export default function ComplianceClient({
  sections,
}: {
  sections: ComplianceSection[];
}) {
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section
          key={section.id}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-600" />
            <h2 className="font-bold text-slate-900">{section.title}</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {section.items.map((item) => (
              <li key={item.id} className="px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-900">{item.title}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {item.description}
                    </p>
                    <p className="text-sm text-slate-700 bg-blue-50/80 rounded-lg px-3 py-2 border border-blue-100">
                      <span className="font-medium text-slate-800">
                        FertilityOS implements:
                      </span>{" "}
                      {item.fertilityOsImplements}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
