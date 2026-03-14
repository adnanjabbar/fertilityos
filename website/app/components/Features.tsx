import {
  Globe,
  Lock,
  Zap,
  HeartHandshake,
  Shield,
  CloudCog,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

const featureKeys = [
  { key: "whiteLabel", icon: Globe, color: "blue" },
  { key: "hipaa", icon: Lock, color: "teal" },
  { key: "ivfWorkflows", icon: Zap, color: "pink" },
  { key: "multiRole", icon: HeartHandshake, color: "blue" },
  { key: "dataSovereignty", icon: Shield, color: "teal" },
  { key: "alwaysUpdated", icon: CloudCog, color: "pink" },
] as const;

const colorMap: Record<string, { bg: string; iconBg: string; icon: string }> = {
  blue: { bg: "bg-blue-50", iconBg: "bg-blue-100", icon: "text-blue-700" },
  teal: { bg: "bg-teal-50", iconBg: "bg-teal-100", icon: "text-teal-700" },
  pink: { bg: "bg-pink-50", iconBg: "bg-pink-100", icon: "text-pink-600" },
};

const statKeys = [
  { value: "12+", labelKey: "specialtyModules" as const },
  { value: "99.9%", labelKey: "uptimeSla" as const },
  { value: "HIPAA", labelKey: "compliant" as const },
  { value: "24/7", labelKey: "support" as const },
];

export default async function Features() {
  const t = await getTranslations("landing.features");

  return (
    <section id="features" className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold uppercase tracking-wider mb-6">
            {t("badge")}
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            {t("title")}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-pink-400">
              {t("titleHighlight")}
            </span>
          </h2>
          <p className="text-xl text-slate-400">
            {t("subtitle")}
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureKeys.map((feat) => {
            const Icon = feat.icon;
            const colors = colorMap[feat.color];
            return (
              <div
                key={feat.key}
                className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-xl ${colors.iconBg} mb-4`}
                >
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  {t(`items.${feat.key}.title`)}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {t(`items.${feat.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {statKeys.map((stat) => (
            <div key={stat.labelKey} className="text-center">
              <div className="text-4xl font-extrabold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400 font-medium">
                {t(`stats.${stat.labelKey}`)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
