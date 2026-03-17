"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Activity } from "lucide-react";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition";
const labelClass = "block text-sm font-semibold text-slate-700 mb-2";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app/dashboard";
  const registered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (res?.error) {
        setError(res.error === "Too many sign-in attempts. Try again in 15 minutes." ? res.error : "Invalid email or password.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: "google" | "azure-ad") => {
    setError(null);
    void signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4">
      <Link
        href="/"
        className="flex items-center gap-2 absolute top-6 left-6 text-slate-600 hover:text-blue-700 transition-colors"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-700">
          <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-xl text-slate-900">
          Fertility<span className="text-teal-600">OS</span>
        </span>
      </Link>

      <div className="w-full max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
          Sign in to your clinic
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          Welcome back
        </h1>
        <p className="text-slate-600 mb-8">
          Sign in with your FertilityOS admin account.
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
              placeholder="e.g. demo@example.com (password: demo)"
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
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          {(process.env.NEXT_PUBLIC_OAUTH_GOOGLE === "1" || process.env.NEXT_PUBLIC_OAUTH_MICROSOFT === "1") && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-500">Or continue with</span>
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

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-center text-sm text-slate-600">
          <span className="font-medium text-slate-700">Demo:</span> demo@example.com / demo
          <span className="block mt-1 text-xs text-slate-500">(Run npm run db:seed-demo if this account does not exist.)</span>
        </div>
        <p className="text-center text-slate-600 mt-4">
          Don’t have an account?{" "}
          <Link href="/register" className="font-semibold text-blue-700 hover:underline">
            Register your clinic
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
