"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

const faqKeys = ["install", "domain", "modules", "hipaa", "multiTenant", "migrate", "roles", "trial"] as const;

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const t = useTranslations("landing.faq");

  return (
    <section id="faq" className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            {t("badge")}
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-slate-600">
            {t("subtitle")}{" "}
            <a href="#waitlist" className="text-blue-700 underline">
              {t("talkToTeam")}
            </a>
          </p>
        </div>

        {/* FAQ accordion */}
        <div className="space-y-3">
          {faqKeys.map((key, i) => (
            <div
              key={key}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-slate-900 text-sm leading-snug">
                  {t(`items.${key}.q`)}
                </span>
                {open === i ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                )}
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t(`items.${key}.a`)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
