"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type Mode = "magic" | "password";

export default function PortalLoginPage() {
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/portal/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong");
        return;
      }
      setStatus("success");
      setMessage(data.message ?? "If an account exists for this email, we sent you a sign-in link.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setStatus("loading");
    setMessage("");
    try {
      const result = await signIn("portal-password", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) {
        setStatus("error");
        setMessage(result.error === "Too many sign-in attempts. Try again in 15 minutes." ? result.error : "Invalid email or password.");
        return;
      }
      if (result?.ok) {
        window.location.href = "/portal";
        return;
      }
      setStatus("error");
      setMessage("Sign-in failed. Try again or use the sign-in link.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("Enter your email above first.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/portal/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong");
        return;
      }
      setStatus("success");
      setMessage(data.message ?? "If an account exists for this email, we sent you a password reset link.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Patient portal</h1>

      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 mb-6">
        <button
          type="button"
          onClick={() => { setMode("magic"); setMessage(""); setStatus("idle"); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === "magic" ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:text-slate-900"}`}
        >
          Sign-in link
        </button>
        <button
          type="button"
          onClick={() => { setMode("password"); setMessage(""); setStatus("idle"); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === "password" ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:text-slate-900"}`}
        >
          Password
        </button>
      </div>

      {mode === "magic" && (
        <>
          <p className="text-slate-600 mb-6">
            Enter your email and we&apos;ll send you a link to sign in. The link expires in 24 hours.
          </p>
          <form onSubmit={handleMagicSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={status === "loading"}
              />
            </div>
            {message && (
              <p className={`text-sm ${status === "error" ? "text-red-600" : "text-slate-600"}`}>
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-2.5 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60"
            >
              {status === "loading" ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        </>
      )}

      {mode === "password" && (
        <>
          <p className="text-slate-600 mb-6">
            Sign in with your email and password. Don&apos;t have a password? Use the sign-in link or ask your clinic to send you a &quot;Set password&quot; link.
          </p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="pw-email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="pw-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={status === "loading"}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={status === "loading"}
                autoComplete="current-password"
              />
            </div>
            {message && (
              <p className={`text-sm ${status === "error" ? "text-red-600" : "text-slate-600"}`}>
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-2.5 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60"
            >
              {status === "loading" ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-sm text-slate-500">
              <button type="button" onClick={handleForgotPassword} disabled={status === "loading"} className="text-blue-600 hover:underline">
                Forgot password?
              </button>
            </p>
          </form>
        </>
      )}
    </div>
  );
}
