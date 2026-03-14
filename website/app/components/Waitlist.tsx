"use client";

import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const t = useTranslations("landing.waitlist");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section id="waitlist" className="py-24 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-600 text-xs font-semibold uppercase tracking-wider mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
          {t("badge")}
        </div>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
          {t("title")}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-teal-600 to-pink-500">
            {t("titleBrand")}
          </span>
        </h2>
        <p className="text-xl text-slate-600 mb-10">
          {t("subtitle")}
        </p>

        {submitted ? (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-8">
            <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-teal-800 mb-2">
              {t("successTitle")}
            </h3>
            <p className="text-teal-700">
              {t("successMessage", { email })}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-left"
          >
            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="clinic-name"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  {t("clinicName")}
                </label>
                <input
                  id="clinic-name"
                  type="text"
                  placeholder={t("clinicPlaceholder")}
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  {t("workEmail")} <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-700 text-white font-bold text-base hover:bg-blue-800 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
            >
              {t("joinWaitlist")}
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-slate-400 text-center mt-4">
              {t("disclaimer")}
            </p>
          </form>
        )}

        {/* Social proof mini */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {["#1e40af", "#0d9488", "#ec4899", "#7c3aed", "#d97706"].map(
              (color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white"
                  style={{ backgroundColor: color }}
                />
              )
            )}
          </div>
          <p className="text-sm text-slate-600">
            {t("socialProof", { count: "47" })}
          </p>
        </div>
      </div>
    </section>
  );
}
