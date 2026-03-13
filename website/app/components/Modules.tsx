import {
  Users,
  CalendarDays,
  FileText,
  FlaskConical,
  CreditCard,
  Package,
  BarChart3,
  Video,
  Globe,
  Shield,
  Stethoscope,
  Baby,
} from "lucide-react";

const modules = [
  {
    icon: Users,
    name: "Patient Management",
    description:
      "Complete patient profiles, medical history, consents, partner/donor linkage, and document management. The central hub for every patient's journey.",
    badge: "Core",
    badgeColor: "blue",
    available: true,
  },
  {
    icon: CalendarDays,
    name: "Scheduling & Appointments",
    description:
      "Multi-provider calendar with drag-and-drop booking, automated SMS/email reminders, waitlist management, and recurring appointment templates.",
    badge: "Core",
    badgeColor: "blue",
    available: true,
  },
  {
    icon: FileText,
    name: "Electronic Medical Records",
    description:
      "Clinical notes in SOAP format, ICD-10 diagnosis codes, prescription management, referral letters, and a complete audit trail for compliance.",
    badge: "Core",
    badgeColor: "blue",
    available: true,
  },
  {
    icon: FlaskConical,
    name: "IVF Lab & Embryology",
    description:
      "Full IVF cycle tracking — stimulation protocols, egg retrieval, fertilization rates, embryo grading (Gardner scale), cryopreservation, PGT/PGS results, and chain of custody.",
    badge: "Specialty",
    badgeColor: "teal",
    available: true,
  },
  {
    icon: CreditCard,
    name: "Financial Management & Billing",
    description:
      "Treatment package pricing, invoice generation, payment tracking, insurance claim management, and financial reporting. Integrated with Stripe.",
    badge: "Core",
    badgeColor: "blue",
    available: true,
  },
  {
    icon: Stethoscope,
    name: "Staff & Role Management",
    description:
      "Onboard doctors, nurses, embryologists, lab technicians, reception, radiologists, and custom staff roles. Granular module-level permissions per role.",
    badge: "Core",
    badgeColor: "blue",
    available: true,
  },
  {
    icon: Baby,
    name: "Donor Management",
    description:
      "Manage egg and sperm donor profiles, matching workflows, consent documentation, legal compliance tracking, and anonymization controls.",
    badge: "Add-on",
    badgeColor: "pink",
    available: false,
  },
  {
    icon: Video,
    name: "Telemedicine",
    description:
      "HIPAA-compliant video consultations built into the patient record. Schedule, conduct, and document virtual appointments with recordings and notes.",
    badge: "Add-on",
    badgeColor: "pink",
    available: false,
  },
  {
    icon: Globe,
    name: "Patient Portal",
    description:
      "A branded, patient-facing portal where patients can view their treatment plan, test results, appointments, invoices, and message their care team securely.",
    badge: "Add-on",
    badgeColor: "pink",
    available: false,
  },
  {
    icon: Package,
    name: "Inventory Management",
    description:
      "Track consumables, medications, lab reagents, and equipment. Set low-stock alerts, manage purchase orders, and maintain expiry tracking.",
    badge: "Add-on",
    badgeColor: "pink",
    available: false,
  },
  {
    icon: BarChart3,
    name: "Analytics & Reporting",
    description:
      "KPI dashboards, success rate analytics, cycle outcome reports, financial summaries, and custom report builder. Export to PDF or CSV.",
    badge: "Add-on",
    badgeColor: "pink",
    available: false,
  },
  {
    icon: Shield,
    name: "Compliance & Audit",
    description:
      "Automated audit trails, data access logs, HIPAA and GDPR compliance tools, data retention policies, and regulatory report generation.",
    badge: "Add-on",
    badgeColor: "pink",
    available: false,
  },
];

const badgeStyles: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  pink: "bg-pink-50 text-pink-600 border-pink-200",
};

export default function Modules() {
  return (
    <section id="modules" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold uppercase tracking-wider mb-6">
            Modular by Design
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            Every module your clinic needs.
            <br />
            <span className="text-teal-600">Pay only for what you use.</span>
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed">
            FertilityOS is built around a modular architecture. The core
            platform gives you multi-tenant accounts, RBAC, and basic patient
            management. Add specialist modules as your clinic grows.
          </p>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.name}
                className={`relative bg-white rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-lg ${
                  mod.available
                    ? "border-slate-200 shadow-sm"
                    : "border-slate-100 shadow-sm opacity-80"
                }`}
              >
                {!mod.available && (
                  <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                    Coming Soon
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                      mod.badgeColor === "blue"
                        ? "bg-blue-100"
                        : mod.badgeColor === "teal"
                        ? "bg-teal-100"
                        : "bg-pink-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        mod.badgeColor === "blue"
                          ? "text-blue-700"
                          : mod.badgeColor === "teal"
                          ? "text-teal-700"
                          : "text-pink-600"
                      }`}
                    />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${
                      badgeStyles[mod.badgeColor]
                    }`}
                  >
                    {mod.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {mod.name}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {mod.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Module legend */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Core — included in all plans</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-500" />
            <span>Specialty — IVF-focused module</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-pink-500" />
            <span>Add-on — enable per clinic</span>
          </div>
        </div>
      </div>
    </section>
  );
}
