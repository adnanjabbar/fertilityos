import { Activity } from "lucide-react";
import { getTranslations } from "next-intl/server";

const footerLinkConfig = {
  Product: ["features", "modules", "pricing", "howItWorks", "roadmap"] as const,
  Company: ["about", "blog", "careers", "contact"] as const,
  Legal: ["privacyPolicy", "termsOfService", "hipaaPolicy", "cookiePolicy"] as const,
  Support: ["documentation", "apiReference", "statusPage", "helpCenter"] as const,
};

const hrefByKey: Record<string, string> = {
  features: "#features",
  modules: "#modules",
  pricing: "#pricing",
  howItWorks: "#how-it-works",
  roadmap: "#",
  about: "#about",
  blog: "#",
  careers: "#",
  contact: "#waitlist",
  privacyPolicy: "#",
  termsOfService: "#",
  hipaaPolicy: "#",
  cookiePolicy: "#",
  documentation: "#",
  apiReference: "#",
  statusPage: "#",
  helpCenter: "#",
};

export default async function Footer() {
  const t = await getTranslations("landing.footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600">
                <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                Fertility<span className="text-teal-400">OS</span>
              </span>
            </a>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              {t("tagline")}
            </p>
            <p className="text-slate-500 text-xs">
              {t("builtBy")}
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinkConfig).map(([category, keys]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-4">
                {t(category as "Product" | "Company" | "Legal" | "Support")}
              </h4>
              <ul className="space-y-2.5">
                {keys.map((key) => (
                  <li key={key}>
                    <a
                      href={hrefByKey[key] ?? "#"}
                      className="text-slate-400 text-sm hover:text-white transition-colors"
                    >
                      {t(`links.${key}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Compliance badges */}
        <div className="flex flex-wrap gap-3 mb-10">
          {(t.raw("badges") as string[]).map((badge: string) => (
            <span
              key={badge}
              className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-medium"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            {t("copyright", { year })}
          </p>
          <p className="text-slate-600 text-xs">
            {t("taglineBottom")}
          </p>
        </div>
      </div>
    </footer>
  );
}
