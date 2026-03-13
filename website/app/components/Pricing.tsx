"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";

type BillingCycle = "monthly" | "quarterly" | "yearly";

const billingOptions: { label: string; value: BillingCycle; discount?: string }[] =
  [
    { label: "Monthly", value: "monthly" },
    { label: "Quarterly", value: "quarterly", discount: "Save 5%" },
    { label: "Yearly", value: "yearly", discount: "Save 20%" },
  ];

const plans = [
  {
    name: "Starter",
    tagline: "Perfect for small fertility practices",
    prices: { monthly: 299, quarterly: 284, yearly: 239 },
    color: "slate",
    features: [
      "Up to 3 providers",
      "Up to 200 patients",
      "Patient Management (Core)",
      "Scheduling & Appointments",
      "Basic EMR (Clinical Notes)",
      "IVF Lab & Embryology",
      "Financial Management",
      "Staff & Role Management",
      "fertilityo.com subdomain",
      "Email support",
    ],
    addonsIncluded: 0,
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Growth",
    tagline: "For established fertility centers",
    prices: { monthly: 699, quarterly: 664, yearly: 559 },
    color: "blue",
    features: [
      "Up to 15 providers",
      "Unlimited patients",
      "Everything in Starter",
      "Custom domain (BYO)",
      "White-label branding",
      "Advanced reporting",
      "Priority email & chat support",
      "2 Add-on modules included",
      "API access",
      "Data export (CSV/PDF)",
    ],
    addonsIncluded: 2,
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Scale",
    tagline: "For multi-location clinic groups",
    prices: { monthly: 1499, quarterly: 1424, yearly: 1199 },
    color: "teal",
    features: [
      "Unlimited providers",
      "Unlimited patients",
      "Everything in Growth",
      "Multi-location support",
      "All Add-on modules included",
      "Dedicated account manager",
      "Phone & priority support",
      "Custom integrations",
      "SLA guarantee (99.9%)",
      "HIPAA BAA included",
    ],
    addonsIncluded: 999,
    cta: "Contact Sales",
    popular: false,
  },
];

const addOns = [
  { name: "Telemedicine", price: { monthly: 99, quarterly: 94, yearly: 79 } },
  { name: "Patient Portal", price: { monthly: 79, quarterly: 75, yearly: 63 } },
  { name: "Donor Management", price: { monthly: 129, quarterly: 123, yearly: 103 } },
  { name: "Inventory Management", price: { monthly: 69, quarterly: 66, yearly: 55 } },
  { name: "Analytics & Reporting", price: { monthly: 89, quarterly: 85, yearly: 71 } },
  { name: "Compliance & Audit", price: { monthly: 59, quarterly: 56, yearly: 47 } },
];

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

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            Transparent Pricing
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6">
            Simple pricing.
            <br />
            <span className="text-blue-700">No hidden fees.</span>
          </h2>
          <p className="text-xl text-slate-600">
            Start with the core platform and add specialty modules as you grow.
            All plans include a 14-day free trial — no credit card required.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-2 mb-14">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            {billingOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBilling(opt.value)}
                className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  billing === opt.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {opt.label}
                {opt.discount && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-teal-500 text-white text-[10px] font-bold leading-none">
                    {opt.discount}
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
                key={plan.name}
                className={`relative bg-white rounded-2xl border p-8 flex flex-col ${colors.card} ${
                  plan.popular ? "shadow-xl" : "shadow-sm"
                }`}
              >
                {plan.popular && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${colors.badge}`}
                  >
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-slate-500">{plan.tagline}</p>
                </div>
                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-extrabold text-slate-900">
                      ${price}
                    </span>
                    <span className="text-slate-500 pb-1">/mo</span>
                  </div>
                  {billing !== "monthly" && (
                    <p className="text-xs text-teal-600 font-medium mt-1">
                      Billed {billing} · Save{" "}
                      {billing === "quarterly" ? "5%" : "20%"}
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <a
                  href="#waitlist"
                  className={`w-full text-center px-6 py-3 rounded-xl font-bold text-sm transition-all ${colors.btn}`}
                >
                  {plan.cta}
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
                Module Add-ons
              </h3>
            </div>
            <p className="text-slate-600">
              Enable additional modules for your clinic at any time from your
              billing dashboard. Each add-on is billed per clinic account.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addOns.map((addon) => {
              const addonPrice = addon.price[billing];
              return (
                <div
                  key={addon.name}
                  className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex items-center justify-between hover:border-pink-200 hover:bg-pink-50/30 transition-colors"
                >
                  <span className="font-semibold text-sm text-slate-800">
                    {addon.name}
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">
                      +${addonPrice}
                    </span>
                    <span className="text-xs text-slate-400">/mo</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enterprise callout */}
        <div className="mt-16 bg-gradient-to-r from-blue-700 to-teal-600 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">
            Running a multi-location group or enterprise clinic?
          </h3>
          <p className="text-blue-100 mb-6 text-lg">
            Get a custom quote with dedicated infrastructure, premium SLA,
            custom integrations, and full white-label licensing.
          </p>
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors"
          >
            Talk to Sales
          </a>
        </div>
      </div>
    </section>
  );
}
