"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Activity } from "lucide-react";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition";
const labelClass = "block text-sm font-semibold text-slate-700 mb-2";

type InviteInfo = {
  email: string;
  roleSlug: string;
  tenantName: string;
  expiresAt: string;
} | null;

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";
  const [invite, setInvite] = useState<InviteInfo>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link.");
      setLoading(false);
      return;
    }
    fetch(`/api/auth/invite/${token}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Invitation not found or already used.");
          if (res.status === 410) throw new Error("This invitation has expired.");
          throw new Error("Something went wrong.");
        }
        return res.json();
      })
      .then((data) => setInvite(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !fullName.trim() || password.length < 8) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fullName: fullName.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading invitation…</div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 absolute top-6 left-6 text-slate-600 hover:text-blue-700"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl text-slate-900">FertilityOS</span>
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <Link
            href="/login"
            className="inline-block mt-4 text-blue-700 font-semibold hover:underline"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-teal-800 mb-2">You’re all set</h1>
          <p className="text-teal-700">
            Your account has been created. Redirecting you to sign in…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4">
      <Link
        href="/"
        className="flex items-center gap-2 absolute top-6 left-6 text-slate-600 hover:text-blue-700"
      >
        <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-xl text-slate-900">FertilityOS</span>
      </Link>
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
          Join {invite?.tenantName ?? "your clinic"}
        </h1>
        <p className="text-slate-600 mb-6">
          You’ve been invited to join as <strong>{invite?.roleSlug?.replace("_", " ")}</strong>. Set your name and password below.
        </p>
        <p className="text-sm text-slate-500 mb-4">Email: <strong>{invite?.email}</strong></p>
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
        >
          <div>
            <label htmlFor="fullName" className={labelClass}>Full name</label>
            <input
              id="fullName"
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              minLength={8}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition-all disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
