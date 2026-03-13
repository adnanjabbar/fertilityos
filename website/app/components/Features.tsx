import {
  Globe,
  Lock,
  Zap,
  HeartHandshake,
  Shield,
  CloudCog,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "White-Label Ready",
    description:
      "Use your own domain, logo, and brand colors. Patients and staff see your brand, powered by FertilityOS behind the scenes.",
    color: "blue",
  },
  {
    icon: Lock,
    title: "HIPAA Compliant Architecture",
    description:
      "End-to-end encryption, audit logs, role-based access, and Business Associate Agreements (BAA) available on Scale and Enterprise plans.",
    color: "teal",
  },
  {
    icon: Zap,
    title: "Built for IVF Workflows",
    description:
      "Designed by a Fertility Specialist. Every workflow, every data field, and every report maps to real clinical practice — not generic healthcare software.",
    color: "pink",
  },
  {
    icon: HeartHandshake,
    title: "Multi-Role Team Management",
    description:
      "Doctors, embryologists, nurses, receptionists, and lab technicians each get a tailored interface with the exact permissions they need.",
    color: "blue",
  },
  {
    icon: Shield,
    title: "Data Sovereignty",
    description:
      "Your clinic's data is stored in isolated, encrypted environments. Tenant separation ensures no data leakage between accounts.",
    color: "teal",
  },
  {
    icon: CloudCog,
    title: "Always Up-to-Date",
    description:
      "Cloud-native SaaS means no installations, no updates to manage. New features and regulatory updates are deployed automatically.",
    color: "pink",
  },
];

const colorMap: Record<string, { bg: string; iconBg: string; icon: string }> = {
  blue: { bg: "bg-blue-50", iconBg: "bg-blue-100", icon: "text-blue-700" },
  teal: { bg: "bg-teal-50", iconBg: "bg-teal-100", icon: "text-teal-700" },
  pink: { bg: "bg-pink-50", iconBg: "bg-pink-100", icon: "text-pink-600" },
};

export default function Features() {
  return (
    <section id="features" className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold uppercase tracking-wider mb-6">
            Platform Capabilities
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Enterprise-grade platform.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-pink-400">
              Clinic-friendly simplicity.
            </span>
          </h2>
          <p className="text-xl text-slate-400">
            FertilityOS combines the security and scalability of enterprise
            software with the ease of use that clinical teams actually need.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            const colors = colorMap[feat.color];
            return (
              <div
                key={feat.title}
                className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-xl ${colors.iconBg} mb-4`}
                >
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { value: "12+", label: "Specialty Modules" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "HIPAA", label: "Compliant" },
            { value: "24/7", label: "Support (Scale+)" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-extrabold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
