import {
  UserPlus,
  Settings,
  Layers,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Register Your Clinic",
    description:
      "Sign up with your clinic's name, specialty, and contact details. Choose your FertilityOS subdomain or connect your own custom domain for full white-label branding.",
    color: "blue",
    details: [
      "Clinic profile & license information",
      "Choose subdomain or connect your domain",
      "White-label logo & color customization",
      "Multi-location support",
    ],
  },
  {
    number: "02",
    icon: Settings,
    title: "Set Up Your Team",
    description:
      "Create accounts for your entire staff — doctors, nurses, embryologists, lab technicians, reception, and radiologists. Assign precise, role-based permissions for each team member.",
    color: "teal",
    details: [
      "Unlimited staff sub-accounts",
      "Pre-built role templates",
      "Granular module-level permissions",
      "Two-factor authentication (2FA)",
    ],
  },
  {
    number: "03",
    icon: Layers,
    title: "Enable Your Modules",
    description:
      "Activate the modules your clinic needs from the billing dashboard. Core modules are included in every plan. Specialty add-ons can be enabled at any time with a single click.",
    color: "pink",
    details: [
      "Core modules included in all plans",
      "Add-on modules activated instantly",
      "Per-clinic module configuration",
      "Cancel or change modules anytime",
    ],
  },
  {
    number: "04",
    icon: CheckCircle2,
    title: "Start Managing Care",
    description:
      "Onboard your patients, schedule appointments, document clinical notes, track IVF cycles, and manage billing — all in one unified, beautifully designed platform.",
    color: "blue",
    details: [
      "Import existing patient records",
      "Guided onboarding checklist",
      "Dedicated support during setup",
      "Training resources & documentation",
    ],
  },
];

const colorMap: Record<string, { bg: string; text: string; iconBg: string; border: string }> = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    iconBg: "bg-blue-100",
    border: "border-blue-200",
  },
  teal: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    iconBg: "bg-teal-100",
    border: "border-teal-200",
  },
  pink: {
    bg: "bg-pink-50",
    text: "text-pink-600",
    iconBg: "bg-pink-100",
    border: "border-pink-200",
  },
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-600 text-xs font-semibold uppercase tracking-wider mb-6">
            Getting Started
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6">
            Up and running in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-teal-600">
              minutes, not months.
            </span>
          </h2>
          <p className="text-xl text-slate-600">
            FertilityOS is designed for clinical teams, not IT departments.
            Onboard your clinic in four simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            const colors = colorMap[step.color];
            return (
              <div
                key={step.number}
                className={`relative rounded-2xl p-8 border ${colors.border} ${colors.bg}`}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${colors.iconBg}`}
                  >
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-bold uppercase tracking-widest mb-1 ${colors.text}`}
                    >
                      Step {step.number}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {step.title}
                    </h3>
                  </div>
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {step.description}
                </p>
                <ul className="space-y-2">
                  {step.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${colors.text}`} />
                      {detail}
                    </li>
                  ))}
                </ul>
                {/* Step number background decoration */}
                <div
                  className={`absolute top-4 right-6 text-6xl font-black opacity-10 ${colors.text} select-none pointer-events-none`}
                >
                  {step.number}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-700 text-white font-bold text-lg hover:bg-blue-800 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
