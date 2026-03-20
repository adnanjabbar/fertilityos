import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Activity } from "lucide-react";

export const metadata = {
  title: "Translate FertilityOS — FertilityOS",
  description:
    "How to contribute professional translations via public JSON message files and the production approval workflow.",
};

export default async function TranslatePage() {
  const t = await getTranslations("translatePage");
  const steps = t.raw("workflowSteps") as string[];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-700">
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            Fertility<span className="text-teal-600">OS</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">
            ← Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">{t("title")}</h1>
        <p className="text-lg text-slate-600 mb-10 leading-relaxed">{t("lead")}</p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t("whereFiles")}</h2>
          <p className="text-slate-600 leading-relaxed">{t("whereFilesBody")}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-3">{t("workflowTitle")}</h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            {steps.map((s, i) => (
              <li key={i} className="leading-relaxed">
                {s}
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t("deployTitle")}</h2>
          <p className="text-slate-600 leading-relaxed">{t("deployBody")}</p>
        </section>

        <p className="text-sm text-slate-500 border-t border-slate-200 pt-8">{t("readmeLink")}</p>
      </main>
    </div>
  );
}
