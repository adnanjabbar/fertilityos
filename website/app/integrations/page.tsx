import Link from "next/link";
import { getTranslations } from "next-intl/server";
import Navbar from "../components/Navbar";
import { auth } from "@/auth";
import {
  MessageSquare,
  Video,
  CreditCard,
  Mail,
  FlaskConical,
  Building2,
  Shield,
  Plug,
} from "lucide-react";

const INTEGRATIONS = [
  {
    id: "twilio",
    nameKey: "twilio",
    descriptionKey: "twilioDesc",
    icon: MessageSquare,
    category: "messaging",
    docsUrl: "https://www.twilio.com/docs",
    connectPath: "/app/settings/integrations",
  },
  {
    id: "daily",
    nameKey: "daily",
    descriptionKey: "dailyDesc",
    icon: Video,
    category: "telemedicine",
    docsUrl: "https://docs.daily.co",
    connectPath: "/app/settings/integrations",
  },
  {
    id: "whatsapp",
    nameKey: "whatsapp",
    descriptionKey: "whatsappDesc",
    icon: MessageSquare,
    category: "messaging",
    docsUrl: "https://developers.facebook.com/docs/whatsapp",
    connectPath: "/app/settings/integrations",
  },
  {
    id: "stripe",
    nameKey: "stripe",
    descriptionKey: "stripeDesc",
    icon: CreditCard,
    category: "billing",
    docsUrl: "https://stripe.com/docs",
    connectPath: "/app/billing",
  },
  {
    id: "resend",
    nameKey: "resend",
    descriptionKey: "resendDesc",
    icon: Mail,
    category: "email",
    docsUrl: "https://resend.com/docs",
    connectPath: "/app/settings/integrations",
  },
  {
    id: "lis",
    nameKey: "lis",
    descriptionKey: "lisDesc",
    icon: FlaskConical,
    category: "lab",
    docsUrl: null,
    connectPath: "/app/settings/lab-integration",
  },
  {
    id: "google",
    nameKey: "google",
    descriptionKey: "googleDesc",
    icon: Shield,
    category: "auth",
    docsUrl: "https://developers.google.com/identity/protocols/oauth2",
    connectPath: "/app/settings/integrations",
  },
  {
    id: "api",
    nameKey: "api",
    descriptionKey: "apiDesc",
    icon: Plug,
    category: "developers",
    docsUrl: null,
    connectPath: "/app/developers",
  },
] as const;

export default async function IntegrationsPage() {
  const session = await auth();
  const t = await getTranslations("landing.integrations");

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar session={session} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
            {t("title")}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INTEGRATIONS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-slate-600" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-slate-900 mb-1">
                      {t(`items.${item.nameKey}`)}
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      {t(`items.${item.descriptionKey}`)}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {session?.user && (
                        <Link
                          href={item.connectPath}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                        >
                          <Building2 className="w-4 h-4" />
                          {t("configureInDashboard")}
                        </Link>
                      )}
                      {item.docsUrl && (
                        <a
                          href={item.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                        >
                          {t("docs")}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-slate-500 text-sm">
          {t("footer")}
        </p>
      </div>
    </main>
  );
}
