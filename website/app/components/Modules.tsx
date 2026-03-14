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
import { getTranslations } from "next-intl/server";

const moduleConfig = [
  { key: "patientManagement", icon: Users, badge: "core" as const, badgeColor: "blue", available: true },
  { key: "scheduling", icon: CalendarDays, badge: "core", badgeColor: "blue", available: true },
  { key: "emr", icon: FileText, badge: "core", badgeColor: "blue", available: true },
  { key: "ivfLab", icon: FlaskConical, badge: "specialty", badgeColor: "teal", available: true },
  { key: "billing", icon: CreditCard, badge: "core", badgeColor: "blue", available: true },
  { key: "staff", icon: Stethoscope, badge: "core", badgeColor: "blue", available: true },
  { key: "donor", icon: Baby, badge: "addon", badgeColor: "pink", available: false },
  { key: "telemedicine", icon: Video, badge: "addon", badgeColor: "pink", available: false },
  { key: "patientPortal", icon: Globe, badge: "addon", badgeColor: "pink", available: false },
  { key: "inventory", icon: Package, badge: "addon", badgeColor: "pink", available: false },
  { key: "analytics", icon: BarChart3, badge: "addon", badgeColor: "pink", available: false },
  { key: "compliance", icon: Shield, badge: "addon", badgeColor: "pink", available: false },
];

const badgeStyles: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  pink: "bg-pink-50 text-pink-600 border-pink-200",
};

export default async function Modules() {
  const t = await getTranslations("landing.modules");

  return (
    <section id="modules" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold uppercase tracking-wider mb-6">
            {t("badge")}
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            {t("title")}
            <br />
            <span className="text-teal-600">{t("titleHighlight")}</span>
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {moduleConfig.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.key}
                className={`relative bg-white rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-lg ${
                  mod.available
                    ? "border-slate-200 shadow-sm"
                    : "border-slate-100 shadow-sm opacity-80"
                }`}
              >
                {!mod.available && (
                  <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                    {t("comingSoon")}
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
                    {t(mod.badge)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {t(`items.${mod.key}.name`)}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {t(`items.${mod.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Module legend */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>{t("legend.core")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-500" />
            <span>{t("legend.specialty")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-pink-500" />
            <span>{t("legend.addon")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
