"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PortalResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token?.trim() || password.length < 8 || password !== confirm) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/portal/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong");
        return;
      }
      setStatus("success");
      setMessage(data.message ?? "Password reset. You can sign in with your email and password.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  };

  if (!token?.trim()) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset your password</h1>
        <p className="text-slate-600 mb-4">
          This page requires a valid reset link. Use the link from the email we sent you, or{" "}
          <Link href="/portal/login" className="text-blue-600 hover:underline">
            request a new one
          </Link>
          .
        </p>
        <Link href="/portal/login" className="text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Password reset</h1>
        <p className="text-slate-600 mb-4">{message}</p>
        <Link
          href="/portal/login"
          className="inline-block py-2.5 px-4 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset your password</h1>
      <p className="text-slate-600 mb-6">Enter a new password for your patient portal.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            New password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
            disabled={status === "loading"}
            autoComplete="new-password"
          />
          <p className="text-xs text-slate-500 mt-1">At least 8 characters</p>
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
            disabled={status === "loading"}
            autoComplete="new-password"
          />
        </div>
        {password && confirm && password !== confirm && (
          <p className="text-sm text-amber-600">Passwords do not match.</p>
        )}
        {message && (
          <p className={`text-sm ${status === "error" ? "text-red-600" : "text-slate-600"}`}>{message}</p>
        )}
        <button
          type="submit"
          disabled={status === "loading" || password.length < 8 || password !== confirm}
          className="w-full py-2.5 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60"
        >
          {status === "loading" ? "Resetting…" : "Reset password"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        <Link href="/portal/login" className="text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
