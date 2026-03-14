import {
  UserPlus,
  Settings,
  Layers,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

const stepConfig = [
  { number: "01", icon: UserPlus, stepKey: "register", color: "blue" },
  { number: "02", icon: Settings, stepKey: "setupTeam", color: "teal" },
  { number: "03", icon: Layers, stepKey: "enableModules", color: "pink" },
  { number: "04", icon: CheckCircle2, stepKey: "startCare", color: "blue" },
] as const;

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

export default async function HowItWorks() {
  const t = await getTranslations("landing.howItWorks");

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-600 text-xs font-semibold uppercase tracking-wider mb-6">
            {t("badge")}
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6">
            {t("title")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-teal-600">
              {t("titleHighlight")}
            </span>
          </h2>
          <p className="text-xl text-slate-600">
            {t("subtitle")}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stepConfig.map((step) => {
            const Icon = step.icon;
            const colors = colorMap[step.color];
            const details = t.raw(`steps.${step.stepKey}.details`) as string[];
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
                      {t("steps.step")} {step.number}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {t(`steps.${step.stepKey}.title`)}
                    </h3>
                  </div>
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {t(`steps.${step.stepKey}.description`)}
                </p>
                <ul className="space-y-2">
                  {details.map((detail, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${colors.text}`} />
                      {detail}
                    </li>
                  ))}
                </ul>
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
            {t("cta")}
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
