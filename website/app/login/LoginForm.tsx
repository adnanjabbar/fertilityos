"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Activity } from "lucide-react";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition";
const labelClass = "block text-sm font-semibold text-slate-700 mb-2";

export type LoginFormProps = {
  initialCallbackUrl: string;
  initialRegistered: boolean;
};

export default function LoginForm({
  initialCallbackUrl,
  initialRegistered,
}: LoginFormProps) {
  const [callbackUrl] = useState(initialCallbackUrl);
  const [registered] = useState(initialRegistered);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  // Avoid persistent React hydration mismatch (#418) by ensuring the login form
  // only renders after the component mounts on the client.
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="text-slate-600 text-sm">Loading…</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (res?.status === 503) {
        setError(
          "Server temporarily unavailable. If this persists, ensure AUTH_TRUST_HOST=true and AUTH_URL are set in production (see deployment docs), then try again."
        );
        return;
      }
      if (res?.status === 504) {
        setError(
          "Request timed out. The server may be starting up or overloaded — wait a moment and try again, or check your connection."
        );
        return;
      }
      if (res?.error) {
        setError(
          res.error === "Too many sign-in attempts. Try again in 15 minutes."
            ? res.error
            : "Invalid email or password."
        );
        return;
      }
      if (res?.ok === false) {
        setError("Invalid email or password.");
        return;
      }
      // Use a full navigation so auth cookies are definitely applied.
      // This avoids hydration issues and middleware redirect races.
      window.location.assign(callbackUrl);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: "google" | "azure-ad") => {
    setError(null);
    void signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-slate-50 grid grid-cols-1 lg:grid-cols-4">
      <section className="lg:col-span-3 relative bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-8 lg:p-14 flex flex-col justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-white/90 hover:text-white transition-colors"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 border border-white/20">
            <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl">
            TheFertility<span className="text-teal-300">OS</span>
          </span>
        </Link>

        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-wider mb-6">
            Digital IVF Clinic OS
          </div>
          <h1 className="text-3xl lg:text-5xl font-extrabold leading-tight">
            Run your fertility clinic with one secure, compliant operating system.
          </h1>
          <p className="mt-5 text-base lg:text-lg text-white/80 max-w-2xl">
            Manage the complete treatment lifecycle from consultation to outcome, streamline operations, and deliver better patient experience with an affordable clinic platform.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-8 text-sm">
            <div className="rounded-xl bg-white/10 border border-white/20 p-4">
              <p className="font-semibold">Compliance-ready</p>
              <p className="text-white/75 mt-1">Built for healthcare workflows, auditability, and data security.</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/20 p-4">
              <p className="font-semibold">End-to-end IVF cycle</p>
              <p className="text-white/75 mt-1">Track clinical, lab, billing, and communication in one platform.</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/20 p-4">
              <p className="font-semibold">Affordable scale</p>
              <p className="text-white/75 mt-1">Designed for growing clinics without enterprise overhead.</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/60">Powered by TheFertilityOS</p>
      </section>

      <section className="lg:col-span-1 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            Sign in to your clinic
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
            Welcome back
          </h2>
          <p className="text-slate-600 mb-8">
            Sign in with your TheFertilityOS admin account.
          </p>

        {registered && (
          <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm">
            Your clinic account was created. Sign in below.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
        >
          <div>
            <label htmlFor="email" className={labelClass}>
              Email or username
            </label>
            <input
              id="email"
              type="text"
              autoComplete="username"
              placeholder="e.g. your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold hover:from-blue-800 hover:to-blue-900 transition-all shadow-lg shadow-blue-300/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/forgot-password"
              className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-800 hover:border-blue-400 hover:text-blue-800 transition-colors"
            >
              Forgot password?
            </Link>
            <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50/80 px-4 py-3 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-800">14-day free trial</p>
              <p className="text-sm text-teal-900/90 mt-1 font-medium">
                Full access to explore the platform — no card required to start.
              </p>
            </div>
          </div>

          {(process.env.NEXT_PUBLIC_OAUTH_GOOGLE === "1" ||
            process.env.NEXT_PUBLIC_OAUTH_MICROSOFT === "1") && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-500">
                    Or continue with
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {process.env.NEXT_PUBLIC_OAUTH_GOOGLE === "1" && (
                  <button
                    type="button"
                    onClick={() => handleOAuth("google")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition"
                  >
                    Google
                  </button>
                )}
                {process.env.NEXT_PUBLIC_OAUTH_MICROSOFT === "1" && (
                  <button
                    type="button"
                    onClick={() => handleOAuth("azure-ad")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition"
                  >
                    Microsoft
                  </button>
                )}
              </div>
            </>
          )}
        </form>

          <div className="mt-6 space-y-2">
            <p className="text-center text-slate-600 text-sm">Don&apos;t have an account?</p>
            <Link
              href="/register"
              className="flex w-full items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-blue-600 bg-blue-50 text-blue-900 font-bold text-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors shadow-sm"
            >
              Sign up — digitalize your clinic
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
