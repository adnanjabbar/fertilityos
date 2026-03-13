"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    q: "Do I need to install anything to use FertilityOS?",
    a: "No. FertilityOS is a fully cloud-based SaaS platform. You access it through any modern web browser — no software installation, no IT maintenance required. Updates and new features are deployed automatically.",
  },
  {
    q: "Can I use my own domain name (e.g., portal.myclinic.com)?",
    a: "Yes. On the Growth and Scale plans, you can connect your own domain or subdomain. We provide a simple CNAME setup guide, and Cloudflare handles the domain masking. Your patients will only see your brand.",
  },
  {
    q: "How does the module add-on system work?",
    a: "The core platform (Patient Management, Scheduling, EMR, IVF Lab, Billing, Staff Management) is included in every plan. Additional specialty modules like Telemedicine, Patient Portal, or Donor Management can be enabled at any time from your billing dashboard. Each add-on has a flat monthly fee per clinic account.",
  },
  {
    q: "Is FertilityOS HIPAA compliant?",
    a: "FertilityOS is architected to be HIPAA-compliant. Data is encrypted at rest and in transit, access is role-controlled, and all activity is logged. Business Associate Agreements (BAA) are available on Scale and Enterprise plans.",
  },
  {
    q: "How does multi-tenant data isolation work?",
    a: "Each clinic's data is stored in a logically isolated environment using row-level security and schema separation. Your data is completely inaccessible to other clinics on the platform.",
  },
  {
    q: "Can I migrate my existing patient data into FertilityOS?",
    a: "Yes. We support CSV import for patient records and can assist with data migration from common fertility software platforms. Contact our team for enterprise-level migration assistance.",
  },
  {
    q: "What staff roles does FertilityOS support?",
    a: "Admin, Doctor/Fertility Specialist, Embryologist, Nurse, Lab Technician, Reception, Radiologist, and fully customizable Staff roles. Each role can be assigned granular, module-level permissions by your clinic admin.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — all plans include a 14-day free trial. No credit card is required to start. After the trial, you can choose the plan that fits your clinic.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            Common Questions
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-slate-600">
            Everything you need to know about FertilityOS. Can&apos;t find the
            answer you&apos;re looking for?{" "}
            <a href="#waitlist" className="text-blue-700 underline">
              Talk to our team.
            </a>
          </p>
        </div>

        {/* FAQ accordion */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-slate-900 text-sm leading-snug">
                  {faq.q}
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
                    {faq.a}
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
