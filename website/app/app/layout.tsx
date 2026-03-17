import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { tenants, tenantBranding } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isModuleEnabled } from "@/lib/modules";
import { getTranslations } from "next-intl/server";
import AppSidebar, { type NavGroup } from "./AppSidebar";
import AppTopBar from "./AppTopBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations("app.nav");

  let enabledModules: string | null = null;
  if (session.user.tenantId) {
    const [row] = await db
      .select({ enabledModules: tenants.enabledModules })
      .from(tenants)
      .where(eq(tenants.id, session.user.tenantId))
      .limit(1);
    enabledModules = row?.enabledModules ?? null;
  }

  const showPatients = isModuleEnabled(enabledModules, "patientManagement");
  const showAppointments = isModuleEnabled(enabledModules, "scheduling");
  const showInvoices = isModuleEnabled(enabledModules, "billing");
  const showLab = isModuleEnabled(enabledModules, "labManagement");
  const isAdmin = session.user.roleSlug === "admin";
  const isSuperAdmin = session.user.roleSlug === "super_admin";
  const showDonors =
    isAdmin || session.user.roleSlug === "embryologist" || session.user.roleSlug === "lab_tech";
  const showLabNav =
    showLab &&
    (isAdmin ||
      session.user.roleSlug === "lab_tech" ||
      session.user.roleSlug === "embryologist" ||
      session.user.roleSlug === "pathologist" ||
      session.user.roleSlug === "doctor");
  const showReportsToApprove =
    showLab && (isAdmin || session.user.roleSlug === "pathologist");

  const labItems: NavGroup["items"] = [];
  if (showLabNav || showReportsToApprove || showDonors || isAdmin) {
    const children: NavGroup["items"] = [
      ...(showLabNav ? [{ href: "/app/lab", labelKey: "lab", iconKey: "lab" as const }] : []),
      ...(showReportsToApprove ? [{ href: "/app/lab/reports", labelKey: "reportsToApprove", iconKey: "lab" as const }] : []),
      ...(showDonors ? [{ href: "/app/donors", labelKey: "donors", iconKey: "donors" as const }] : []),
      ...(isAdmin
        ? [
            { href: "/app/surrogacy", labelKey: "surrogacy", iconKey: "surrogacy" as const },
            { href: "/app/inventory", labelKey: "inventory", iconKey: "inventory" as const },
            { href: "/app/medications", labelKey: "medications", iconKey: "medications" as const },
          ]
        : []),
    ].filter(Boolean) as NavGroup["items"];
    if (children.length > 1) {
      labItems.push({ href: "/app/lab", labelKey: "lab", iconKey: "lab", children });
    } else {
      labItems.push(...children);
    }
  }

  let branding: { logoUrl: string | null; primaryColor: string | null; showPoweredBy: boolean } = {
    logoUrl: null,
    primaryColor: null,
    showPoweredBy: true,
  };
  if (session.user.tenantId) {
    const [row] = await db
      .select({ logoUrl: tenantBranding.logoUrl, primaryColor: tenantBranding.primaryColor, showPoweredBy: tenantBranding.showPoweredBy })
      .from(tenantBranding)
      .where(eq(tenantBranding.tenantId, session.user.tenantId))
      .limit(1);
    if (row) {
      branding = {
        logoUrl: row.logoUrl ?? null,
        primaryColor: row.primaryColor ?? null,
        showPoweredBy: row.showPoweredBy ?? true,
      };
    }
  }

  const adminItems: NavGroup["items"] = isAdmin
    ? [
        { href: "/app/referrals", labelKey: "referrals", iconKey: "referrals" },
        { href: "/app/team", labelKey: "team", iconKey: "team" },
        { href: "/app/developers", labelKey: "developers", iconKey: "developers" },
        { href: "/app/compliance", labelKey: "compliance", iconKey: "compliance" },
        { href: "/app/audit-logs", labelKey: "auditLog", iconKey: "auditLog" },
        { href: "/app/security-report", labelKey: "securityReport", iconKey: "auditLog" },
        { href: "/app/email-campaigns", labelKey: "emailCampaigns", iconKey: "emailCampaigns" },
        {
          href: "#",
          labelKey: "settings",
          iconKey: "settings",
          children: [
            { href: "/app/settings/letterhead", labelKey: "letterhead", iconKey: "letterhead" },
            { href: "/app/settings/locations", labelKey: "locations", iconKey: "locations" },
            { href: "/app/settings/integrations", labelKey: "integrations", iconKey: "integrations" },
            { href: "/app/settings/lab-integration", labelKey: "labIntegration", iconKey: "labIntegration" },
            { href: "/app/settings/data-requests", labelKey: "dataRequests", iconKey: "compliance" },
          ],
        },
      ]
    : [];

  const navGroups: NavGroup[] = [
    {
      labelKey: "groupMain",
      items: [
        { href: "/app/dashboard", labelKey: "dashboard", iconKey: "dashboard" },
        ...(session.user.roleSlug !== "patient"
          ? [{ href: "/app/account/security", labelKey: "accountSecurity", iconKey: "compliance" as const }]
          : []),
      ],
    },
    {
      labelKey: "groupClinical",
      items: [
        ...(showPatients ? [{ href: "/app/patients", labelKey: "patients", iconKey: "patients" as const }] : []),
        ...(showAppointments
          ? [{ href: "/app/appointments", labelKey: "appointments", iconKey: "appointments" as const }]
          : []),
      ].filter(Boolean) as NavGroup["items"],
    },
    {
      labelKey: "groupBilling",
      items: [
        ...(showInvoices ? [{ href: "/app/invoices", labelKey: "invoices", iconKey: "invoices" as const }] : []),
        { href: "/app/reports", labelKey: "reports", iconKey: "reports" },
        ...(isAdmin ? [{ href: "/app/billing", labelKey: "billing", iconKey: "billing" as const }] : []),
      ].filter(Boolean) as NavGroup["items"],
    },
    ...(labItems.length > 0 ? [{ labelKey: "groupLab" as const, items: labItems }] : []),
    ...(adminItems.length > 0 ? [{ labelKey: "groupAdmin" as const, items: adminItems }] : []),
    ...(isSuperAdmin
      ? [
          {
            labelKey: "groupPlatform" as const,
            items: [{ href: "/app/super", labelKey: "superDashboard", iconKey: "superDashboard" }],
          },
        ]
      : []),
  ].filter((g) => g.items.length > 0);

  const labels: Record<string, string> = {
    dashboard: t("dashboard"),
    patients: t("patients"),
    appointments: t("appointments"),
    invoices: t("invoices"),
    reports: t("reports"),
    billing: t("billing"),
    lab: t("lab"),
    donors: t("donors"),
    surrogacy: t("surrogacy"),
    inventory: t("inventory"),
    medications: t("medications"),
    referrals: t("referrals"),
    team: t("team"),
    developers: t("developers"),
    compliance: t("compliance"),
    auditLog: t("auditLog"),
    accountSecurity: t("accountSecurity"),
    emailCampaigns: t("emailCampaigns"),
    letterhead: t("letterhead"),
    locations: t("locations"),
    integrations: t("integrations"),
    labIntegration: t("labIntegration"),
    dataRequests: t("dataRequests"),
    securityReport: t("securityReport"),
    superDashboard: t("superDashboard"),
    settings: t("settings"),
    logOut: t("logOut"),
    groupMain: t("groupMain"),
    groupClinical: t("groupClinical"),
    groupBilling: t("groupBilling"),
    groupLab: t("groupLab"),
    groupAdmin: t("groupAdmin"),
    groupPlatform: t("groupPlatform"),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="flex min-h-screen">
        <AppSidebar
          navGroups={navGroups}
          labels={labels}
          userName={session.user.name ?? "User"}
          tenantName={session.user.tenantName ?? null}
          brandingLogoUrl={branding.logoUrl}
          brandingPrimaryColor={branding.primaryColor}
          showPoweredBy={branding.showPoweredBy}
        />
        <main className="flex-1 min-w-0 relative pt-14 lg:pt-14">
          <AppTopBar userName={session.user.name ?? "User"} tenantName={session.user.tenantName ?? null} />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
