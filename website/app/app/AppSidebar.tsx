"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faUsers,
  faCalendarAlt,
  faFileInvoice,
  faChartBar,
  faCreditCard,
  faVial,
  faFlask,
  faBaby,
  faBoxes,
  faPills,
  faShareAlt,
  faUserPlus,
  faCode,
  faShieldAlt,
  faScroll,
  faEnvelope,
  faPrint,
  faMapMarkerAlt,
  faPlug,
  faCrown,
  faSignOutAlt,
  faBars,
  faTimes,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import LanguageSwitcher from "../components/LanguageSwitcher";

const iconMap: Record<string, IconDefinition> = {
  dashboard: faChartLine,
  patients: faUsers,
  appointments: faCalendarAlt,
  invoices: faFileInvoice,
  reports: faChartBar,
  billing: faCreditCard,
  lab: faFlask,
  donors: faVial,
  surrogacy: faBaby,
  inventory: faBoxes,
  medications: faPills,
  referrals: faShareAlt,
  team: faUserPlus,
  developers: faCode,
  compliance: faShieldAlt,
  auditLog: faScroll,
  emailCampaigns: faEnvelope,
  letterhead: faPrint,
  locations: faMapMarkerAlt,
  integrations: faPlug,
  labIntegration: faVial,
  superDashboard: faCrown,
};

export type NavItem = {
  href: string;
  labelKey: string;
  iconKey: keyof typeof iconMap;
};

export type NavGroup = {
  labelKey: string | null;
  items: NavItem[];
};

type AppSidebarProps = {
  navGroups: NavGroup[];
  labels: Record<string, string>;
  userName: string;
  tenantName: string | null;
};

export default function AppSidebar({
  navGroups,
  labels,
  userName,
  tenantName,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = (href: string) => {
    const active =
      pathname === href ||
      (href !== "/app/dashboard" && pathname.startsWith(href));
    return [
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px]",
      active
        ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md shadow-blue-500/25"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    ].join(" ");
  };

  const sidebarContent = (
    <>
      {/* Logo — left sidebar branding */}
      <Link
        href="/app/dashboard"
        className="flex items-center gap-2.5 px-3 py-4 border-b border-slate-700/50"
        onClick={() => setMobileOpen(false)}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 shadow-lg">
          <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-blue-600">
            TheFertility
          </span>
          <span className="text-teal-400">OS</span>
        </span>
      </Link>

      {/* Nav groups — left sidebar menu */}
      <nav
        className="flex-1 overflow-y-auto py-4 px-2 space-y-6"
        aria-label="Main navigation"
      >
        {navGroups.map((group, idx) => (
          <div key={idx}>
            {group.labelKey && (
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {labels[group.labelKey] ?? group.labelKey}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const icon = iconMap[item.iconKey] ?? faChartLine;
                const label = labels[item.labelKey] ?? item.labelKey;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={linkClass(item.href)}
                      onClick={() => setMobileOpen(false)}
                      aria-current={pathname === item.href ? "page" : undefined}
                    >
                      <FontAwesomeIcon
                        icon={icon}
                        className="w-5 h-5 shrink-0"
                        aria-hidden
                      />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User & sign out */}
      <div className="p-3 border-t border-slate-700/50 space-y-2">
        <div className="lg:hidden px-3 pb-2">
          <LanguageSwitcher variant="dropdown" className="w-full" />
        </div>
        <div className="px-3 py-2 rounded-lg bg-slate-800/50 text-slate-300 text-xs">
          <p className="font-medium text-white truncate">{userName}</p>
          <p className="truncate">{tenantName ?? "—"}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            void signOut({ callbackUrl: "/" });
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all min-h-[44px]"
          aria-label="Sign out"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5 shrink-0" />
          <span>{labels.logOut ?? "Log out"}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: top bar with hamburger to open LEFT drawer */}
      <div className="sticky top-0 z-30 flex lg:hidden items-center justify-between h-14 px-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-white/10">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <FontAwesomeIcon
            icon={mobileOpen ? faTimes : faBars}
            className="w-5 h-5"
          />
        </button>
        <Link href="/app/dashboard" className="font-bold text-lg">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
            TheFertility
          </span>
          OS
        </Link>
        <div className="w-10" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Left sidebar — always visible on desktop (lg), slide-in on mobile */}
      <aside
        className={[
          "fixed top-0 left-0 z-40 h-full w-64 flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-200 shadow-xl",
          "lg:sticky lg:top-0 lg:z-20 lg:shrink-0 lg:flex",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-200 ease-out",
        ].join(" ")}
        aria-label="App sidebar"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
