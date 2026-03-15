"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

type BillingCycle = "monthly" | "quarterly" | "yearly";

const planFeatureKeys = {
  starter: ["providers3", "patients200", "patientMgmt", "scheduling", "basicEmr", "ivfLab", "financialMgmt", "staffMgmt", "subdomain", "emailSupport"] as const,
  growth: ["providers15", "unlimitedPatients", "everythingStarter", "customDomain", "whiteLabel", "advancedReporting", "prioritySupport", "addonsIncluded2", "apiAccess", "dataExport"] as const,
  scale: ["unlimitedProviders", "unlimitedPatients", "everythingGrowth", "multiLocation", "allAddons", "dedicatedManager", "phoneSupport", "customIntegrations", "sla", "hipaaBaa"] as const,
};

const plans = [
  {
    planKey: "starter" as const,
    prices: { monthly: 29.99, quarterly: 85, yearly: 287 },
    color: "slate",
    featureKeys: planFeatureKeys.starter,
    ctaKey: "startFreeTrial" as const,
    popular: false,
  },
  {
    planKey: "growth" as const,
    prices: { monthly: 49.99, quarterly: 142, yearly: 479 },
    color: "blue",
    featureKeys: planFeatureKeys.growth,
    ctaKey: "startFreeTrial" as const,
    popular: true,
  },
  {
    planKey: "scale" as const,
    prices: { monthly: 79.99, quarterly: 228, yearly: 767 },
    color: "teal",
    featureKeys: planFeatureKeys.scale,
    ctaKey: "startFreeTrial" as const,
    popular: false,
  },
];

const addonKeys = [
  "telemedicine",
  "patientPortal",
  "donorManagement",
  "inventoryManagement",
  "analyticsReporting",
  "complianceAudit",
] as const;

// Small modules $4.99/mo; larger/complex modules $6.99/mo (add-on pricing).
const addonPrices: Record<(typeof addonKeys)[number], { monthly: number; quarterly: number; yearly: number }> = {
  telemedicine: { monthly: 6.99, quarterly: 19.9, yearly: 67 },
  patientPortal: { monthly: 4.99, quarterly: 14.2, yearly: 48 },
  donorManagement: { monthly: 6.99, quarterly: 19.9, yearly: 67 },
  inventoryManagement: { monthly: 4.99, quarterly: 14.2, yearly: 48 },
  analyticsReporting: { monthly: 6.99, quarterly: 19.9, yearly: 67 },
  complianceAudit: { monthly: 4.99, quarterly: 14.2, yearly: 48 },
};

const planColors: Record<string, { card: string; btn: string; badge: string }> = {
  slate: {
    card: "border-slate-200",
    btn: "bg-slate-800 hover:bg-slate-900 text-white",
    badge: "",
  },
  blue: {
    card: "border-blue-400 ring-2 ring-blue-300",
    btn: "bg-blue-700 hover:bg-blue-800 text-white",
    badge: "bg-blue-700 text-white",
  },
  teal: {
    card: "border-teal-300",
    btn: "bg-teal-700 hover:bg-teal-800 text-white",
    badge: "",
  },
};

export default function Pricing() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const t = useTranslations("landing.pricing");

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            {t("badge")}
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6">
            {t("title")}
            <br />
            <span className="text-blue-700">{t("titleHighlight")}</span>
          </h2>
          <p className="text-xl text-slate-600">
            {t("subtitle")}
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-2 mb-14">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            {(["monthly", "quarterly", "yearly"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setBilling(value)}
                className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  billing === value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t(value)}
                {value === "quarterly" && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-teal-500 text-white text-[10px] font-bold leading-none">
                    {t("save5")}
                  </span>
                )}
                {value === "yearly" && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-teal-500 text-white text-[10px] font-bold leading-none">
                    {t("save20")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => {
            const colors = planColors[plan.color];
            const price = plan.prices[billing];
            return (
              <div
                key={plan.planKey}
                className={`relative bg-white rounded-2xl border p-8 flex flex-col ${colors.card} ${
                  plan.popular ? "shadow-xl" : "shadow-sm"
                }`}
              >
                {plan.popular && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${colors.badge}`}
                  >
                    {t("mostPopular")}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {t(`plans.${plan.planKey}.name`)}
                  </h3>
                  <p className="text-sm text-slate-500">{t(`plans.${plan.planKey}.tagline`)}</p>
                </div>
                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-extrabold text-slate-900">
                      ${price}
                    </span>
                    <span className="text-slate-500 pb-1">{t("perMonth")}</span>
                  </div>
                  {billing !== "monthly" && (
                    <p className="text-xs text-teal-600 font-medium mt-1">
                      {t("billed")} {t(billing)} · {t("save")}{" "}
                      {billing === "quarterly" ? "5%" : "20%"}
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.featureKeys.map((key) => (
                    <li
                      key={key}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                      {t(`features.${key}`)}
                    </li>
                  ))}
                </ul>
                <a
                  href="#waitlist"
                  className={`w-full text-center px-6 py-3 rounded-xl font-bold text-sm transition-all ${colors.btn}`}
                >
                  {t(plan.ctaKey)}
                </a>
              </div>
            );
          })}
        </div>

        {/* Add-on modules */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-pink-500" />
              <h3 className="text-2xl font-bold text-slate-900">
                {t("moduleAddons")}
              </h3>
            </div>
            <p className="text-slate-600">
              {t("addonsSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addonKeys.map((key) => {
              const addonPrice = addonPrices[key][billing];
              return (
                <div
                  key={key}
                  className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex items-center justify-between hover:border-pink-200 hover:bg-pink-50/30 transition-colors"
                >
                  <span className="font-semibold text-sm text-slate-800">
                    {t(`addons.${key}`)}
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">
                      +${addonPrice}
                    </span>
                    <span className="text-xs text-slate-400">{t("perMonth")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enterprise callout */}
        <div className="mt-16 bg-gradient-to-r from-blue-700 to-teal-600 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">
            {t("enterpriseTitle")}
          </h3>
          <p className="text-blue-100 mb-6 text-lg">
            {t("enterpriseSubtitle")}
          </p>
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors"
          >
            {t("talkToSales")}
          </a>
        </div>
      </div>
    </section>
  );
}
