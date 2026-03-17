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
  faChevronDown,
  faChevronRight,
  faCog,
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
  settings: faCog,
};

export type NavItem = {
  href: string;
  labelKey: string;
  iconKey: keyof typeof iconMap;
  children?: NavItem[];
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
  brandingLogoUrl?: string | null;
  brandingPrimaryColor?: string | null;
  showPoweredBy?: boolean;
};

export default function AppSidebar({
  navGroups,
  labels,
  userName,
  tenantName,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());

  const isChildActive = (item: NavItem) =>
    item.children?.some(
      (c) => pathname === c.href || (c.href !== "/app/dashboard" && pathname.startsWith(c.href))
    );

  const activeBg = brandingPrimaryColor && /^#[0-9A-Fa-f]{6}$/.test(brandingPrimaryColor)
    ? brandingPrimaryColor
    : "rgb(37 99 235)"; // blue-600

  const linkClass = (href: string) => {
    const active =
      pathname === href ||
      (href !== "/app/dashboard" && pathname.startsWith(href));
    return [
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px]",
      active
        ? "text-white shadow"
        : "text-slate-200 hover:bg-slate-700/70 hover:text-white",
      active ? "" : "",
    ].join(" ").trim();
  };

  const linkStyle = (href: string) => {
    const active =
      pathname === href ||
      (href !== "/app/dashboard" && pathname.startsWith(href));
    return active ? { backgroundColor: activeBg } : undefined;
  };

  const childLinkClass = (href: string) => {
    const active =
      pathname === href ||
      (href !== "/app/dashboard" && pathname.startsWith(href));
    return [
      "flex items-center gap-2.5 rounded-lg pl-8 pr-3 py-2 text-sm transition-all duration-200 min-h-[40px]",
      active
        ? "text-white"
        : "text-slate-300 hover:bg-slate-700/60 hover:text-white",
    ].join(" ");
  };

  const childLinkStyle = (href: string) => {
    const active =
      pathname === href ||
      (href !== "/app/dashboard" && pathname.startsWith(href));
    return active ? { backgroundColor: activeBg, opacity: 0.95 } : undefined;
  };

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sidebarContent = (
    <>
      {/* Logo — left sidebar branding */}
      <Link
        href="/app/dashboard"
        className="flex items-center gap-2.5 px-3 py-4 border-b border-slate-700/50"
        onClick={() => setMobileOpen(false)}
      >
        {brandingLogoUrl ? (
          <img src={brandingLogoUrl} alt="" className="w-10 h-10 rounded-xl object-contain bg-white/10" />
        ) : (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 shadow-lg">
            <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-white" />
          </div>
        )}
        <span className="font-bold text-lg tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-teal-300 to-blue-400">
            TheFertility
          </span>
          <span className="text-teal-300">OS</span>
        </span>
      </Link>

      {/* Nav groups — left sidebar menu */}
      <nav
        className="flex-1 overflow-y-auto py-4 px-2 space-y-5"
        aria-label="Main navigation"
      >
        {navGroups.map((group, gIdx) => (
          <div key={gIdx}>
            {group.labelKey && (
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {labels[group.labelKey] ?? group.labelKey}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item, iIdx) => {
                const itemKey = `${gIdx}-${iIdx}-${item.href}`;
                const hasChildren = item.children && item.children.length > 0;
                const childActive = hasChildren && isChildActive(item);
                const isOpen = expandedKeys.has(itemKey) || childActive;
                const icon = iconMap[item.iconKey] ?? faChartLine;
                const label = labels[item.labelKey] ?? item.labelKey;

                if (hasChildren) {
                  const isFolderOnly = item.href === "#" || !item.href;
                  return (
                    <li key={itemKey}>
                      <div className="flex items-center gap-1">
                        {isFolderOnly ? (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(itemKey)}
                            className="flex flex-1 min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700/70 hover:text-white transition-all duration-200 min-h-[44px] text-left"
                            aria-expanded={isOpen}
                          >
                            <FontAwesomeIcon icon={icon} className="w-5 h-5 shrink-0" aria-hidden />
                            <span className="truncate flex-1">{label}</span>
                            <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          </button>
                        ) : (
                          <>
                            <Link
                                  href={item.href}
                                  className={linkClass(item.href) + " flex-1 min-w-0"}
                                  style={linkStyle(item.href)}
                                  onClick={() => setMobileOpen(false)}
                                  aria-current={pathname === item.href ? "page" : undefined}
                                >
                              <FontAwesomeIcon icon={icon} className="w-5 h-5 shrink-0" aria-hidden />
                              <span className="truncate">{label}</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => toggleExpanded(itemKey)}
                              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/70 transition-colors"
                              aria-expanded={isOpen}
                              aria-label={isOpen ? "Collapse" : "Expand"}
                            >
                              <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                      {isOpen && (
                        <ul className="mt-0.5 ml-1 space-y-0.5 border-l border-slate-700/60">
                          {item.children!.map((child) => {
                            const childIcon = iconMap[child.iconKey] ?? faChartLine;
                            const childLabel = labels[child.labelKey] ?? child.labelKey;
                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className={childLinkClass(child.href)}
                                  style={childLinkStyle(child.href)}
                                  onClick={() => setMobileOpen(false)}
                                  aria-current={pathname === child.href ? "page" : undefined}
                                >
                                  <FontAwesomeIcon icon={childIcon} className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
                                  <span className="truncate">{childLabel}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={itemKey}>
                    <Link
                      href={item.href}
                      className={linkClass(item.href)}
                      style={linkStyle(item.href)}
                      onClick={() => setMobileOpen(false)}
                      aria-current={pathname === item.href ? "page" : undefined}
                    >
                      <FontAwesomeIcon icon={icon} className="w-5 h-5 shrink-0" aria-hidden />
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
        <div className="px-3 py-2 rounded-lg bg-slate-800/60 text-slate-300 text-xs">
          <p className="font-medium text-white truncate">{userName}</p>
          <p className="truncate opacity-90">{tenantName ?? "—"}</p>
        </div>
        {showPoweredBy && (
          <p className="px-3 py-1 text-xs text-slate-500">
            Powered by{" "}
            <a href="https://www.thefertilityos.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-300">
              FertilityOS
            </a>
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            void signOut({ callbackUrl: "/" });
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-all min-h-[44px]"
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
