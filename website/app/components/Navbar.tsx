"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Activity } from "lucide-react";
import type { Session } from "next-auth";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

const navLinkKeys = [
  { key: "features", href: "#features" },
  { key: "modules", href: "#modules" },
  { key: "pricing", href: "#pricing" },
  { key: "howItWorks", href: "#how-it-works" },
  { key: "about", href: "#about" },
] as const;

export default function Navbar({ session }: { session: Session | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("landing.nav");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-700 group-hover:bg-blue-800 transition-colors">
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">
              Fertility<span className="text-teal-600">OS</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinkKeys.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors"
              >
                {t(link.key)}
              </a>
            ))}
          </div>

          {/* Desktop CTAs + Language */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher variant="buttons" className="shrink-0" />
            {session ? (
              <>
                <Link
                  href="/app/dashboard"
                  className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors"
                >
                  {t("dashboard")}
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm"
                >
                  {t("logOut")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors"
                >
                  {t("signIn")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm"
                >
                  {t("getEarlyAccess")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t("toggleMenu")}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-4 space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-slate-500">Language</span>
              <LanguageSwitcher variant="buttons" />
            </div>
            {navLinkKeys.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-slate-700 hover:text-blue-700 py-1"
                onClick={() => setMobileOpen(false)}
              >
                {t(link.key)}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              {session ? (
                <>
                  <Link
                    href="/app/dashboard"
                    className="w-full text-center px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("dashboard")}
                  </Link>
                  <Link
                    href="/api/auth/signout"
                    className="w-full text-center px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("logOut")}
                  </Link>
                </>
              ) : (
                <Link
                  href="/register"
                  className="w-full text-center px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("getEarlyAccess")}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
