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
  Pill,
  BookOpen,
  Printer,
  Barcode,
  ScrollText,
  Heart,
  Share2,
  Code,
  Coins,
  MapPin,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

const moduleConfig = [
  { key: "patientManagement", icon: Users, badge: "core" as const, badgeColor: "blue" },
  { key: "scheduling", icon: CalendarDays, badge: "core", badgeColor: "blue" },
  { key: "emr", icon: FileText, badge: "core", badgeColor: "blue" },
  { key: "ivfLab", icon: FlaskConical, badge: "specialty", badgeColor: "teal" },
  { key: "billing", icon: CreditCard, badge: "core", badgeColor: "blue" },
  { key: "staff", icon: Stethoscope, badge: "core", badgeColor: "blue" },
  { key: "labManagement", icon: FlaskConical, badge: "addon", badgeColor: "pink" },
  { key: "donor", icon: Baby, badge: "addon", badgeColor: "pink" },
  { key: "telemedicine", icon: Video, badge: "addon", badgeColor: "pink" },
  { key: "patientPortal", icon: Globe, badge: "addon", badgeColor: "pink" },
  { key: "inventory", icon: Package, badge: "addon", badgeColor: "pink" },
  { key: "analytics", icon: BarChart3, badge: "addon", badgeColor: "pink" },
  { key: "compliance", icon: Shield, badge: "addon", badgeColor: "pink" },
  { key: "securityReport", icon: ShieldCheck, badge: "addon", badgeColor: "pink" },
  { key: "formulary", icon: Pill, badge: "addon", badgeColor: "pink" },
  { key: "icd11", icon: BookOpen, badge: "addon", badgeColor: "pink" },
  { key: "letterheadPrint", icon: Printer, badge: "addon", badgeColor: "pink" },
  { key: "mrPrinting", icon: Barcode, badge: "addon", badgeColor: "pink" },
  { key: "auditLogs", icon: ScrollText, badge: "addon", badgeColor: "pink" },
  { key: "surrogacy", icon: Heart, badge: "addon", badgeColor: "pink" },
  { key: "referrals", icon: Share2, badge: "addon", badgeColor: "pink" },
  { key: "emailCampaigns", icon: Mail, badge: "addon", badgeColor: "pink" },
  { key: "apiKeys", icon: Code, badge: "addon", badgeColor: "pink" },
  { key: "multiCurrency", icon: Coins, badge: "addon", badgeColor: "pink" },
  { key: "multiLocation", icon: MapPin, badge: "addon", badgeColor: "pink" },
];

const badgeStyles: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  pink: "bg-pink-50 text-pink-600 border-pink-200",
};

const iconBgStyles: Record<string, string> = {
  blue: "bg-gradient-to-br from-blue-500/10 to-blue-600/20",
  teal: "bg-gradient-to-br from-teal-500/10 to-teal-600/20",
  pink: "bg-gradient-to-br from-pink-500/10 to-rose-500/20",
};

const iconColorStyles: Record<string, string> = {
  blue: "text-blue-600",
  teal: "text-teal-600",
  pink: "text-pink-600",
};

export default async function Modules() {
  const t = await getTranslations("landing.modules");

  return (
    <section id="modules" className="py-24 bg-gradient-to-b from-slate-50 via-white to-blue-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-blue-200/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
            {t("badge")}
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            {t("title")}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-500 to-blue-700">
              {t("titleHighlight")}
            </span>
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {moduleConfig.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.key}
                className="group relative bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-blue-200/60"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`flex items-center justify-center w-11 h-11 rounded-xl transition-transform group-hover:scale-105 ${iconBgStyles[mod.badgeColor]}`}
                  >
                    <Icon
                      className={`w-5 h-5 ${iconColorStyles[mod.badgeColor]}`}
                      strokeWidth={2}
                    />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${badgeStyles[mod.badgeColor]}`}
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
        <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" />
            <span className="text-slate-600">{t("legend.core")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-500 to-teal-600" />
            <span className="text-slate-600">{t("legend.specialty")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" />
            <span className="text-slate-600">{t("legend.addon")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
