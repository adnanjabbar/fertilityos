import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

const highlightKeys = [
  "purposeBuilt",
  "ivfLab",
  "multiTenant",
  "hipaa",
] as const;

export default async function Hero() {
  const t = await getTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden bg-white pt-32 pb-24 sm:pt-40 sm:pb-32">
      {/* Background gradient decoration */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-blue-50 opacity-60 blur-3xl" />
        <div className="absolute top-60 -left-40 w-[500px] h-[500px] rounded-full bg-pink-50 opacity-50 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-teal-50 opacity-40 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {t("badge")}
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
            {t("title")}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-teal-600 to-pink-500">
              {t("titleHighlight")}
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-slate-600 leading-relaxed mb-10 max-w-3xl mx-auto">
            {t("subheadline")}
          </p>

          {/* Highlight bullets */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-12">
            {highlightKeys.map((key) => (
              <div
                key={key}
                className="flex items-center gap-1.5 text-sm text-slate-700"
              >
                <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                {t(`highlights.${key}`)}
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-700 text-white font-bold text-lg hover:bg-blue-800 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
            >
              {t("cta.getEarlyAccess")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-bold text-lg hover:border-blue-300 hover:text-blue-700 transition-all"
            >
              {t("cta.signIn")}
            </Link>
            <a
              href="#modules"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-bold text-lg hover:border-blue-300 hover:text-blue-700 transition-all"
            >
              {t("cta.exploreModules")}
            </a>
          </div>
        </div>

        {/* Product illustration / mockup placeholder */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-200 border border-slate-200">
            {/* Browser chrome */}
            <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-3 py-1.5 text-xs text-slate-400 font-mono">
                  {t("dashboardMockup.url")}
                </div>
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="bg-slate-50 p-6 min-h-[360px]">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { labelKey: "activePatients", value: "247", color: "blue" },
                  { labelKey: "ivfCyclesToday", value: "12", color: "teal" },
                  { labelKey: "embryosInCulture", value: "38", color: "pink" },
                  { labelKey: "appointmentsToday", value: "31", color: "purple" },
                ].map((stat) => (
                  <div
                    key={stat.labelKey}
                    className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
                  >
                    <p className="text-xs text-slate-500 mb-1">{t(`dashboardMockup.${stat.labelKey}`)}</p>
                    <p
                      className={`text-2xl font-bold ${
                        stat.color === "blue"
                          ? "text-blue-700"
                          : stat.color === "teal"
                          ? "text-teal-600"
                          : stat.color === "pink"
                          ? "text-pink-500"
                          : "text-purple-600"
                      }`}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    {t("dashboardMockup.ivfCycleOverview")}
                  </p>
                  <div className="flex items-end gap-2 h-24">
                    {[65, 80, 45, 90, 70, 55, 85, 60, 75, 95, 50, 70].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-gradient-to-t from-blue-600 to-blue-400 opacity-80"
                          style={{ height: `${h}%` }}
                        />
                      )
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    {t("dashboardMockup.todaysSchedule")}
                  </p>
                  <div className="space-y-2">
                    {[
                      { time: "09:00", name: "Sarah M.", typeKey: "retrieval" as const },
                      { time: "10:30", name: "Emma K.", typeKey: "consultation" as const },
                      { time: "14:00", name: "Aisha R.", typeKey: "transfer" as const },
                    ].map((appt) => (
                      <div
                        key={appt.time}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="text-slate-400 w-10 shrink-0">
                          {appt.time}
                        </span>
                        <span className="font-medium text-slate-700 flex-1">
                          {appt.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                          {t(`dashboardMockup.${appt.typeKey}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-400 mb-6 uppercase tracking-wider font-medium">
            {t("trustBar")}
          </p>
          <div className="flex items-center justify-center gap-10 flex-wrap">
            {(t.raw("clinicNames") as string[]).map((name: string) => (
              <span
                key={name}
                className="text-slate-300 font-semibold text-sm tracking-tight"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
