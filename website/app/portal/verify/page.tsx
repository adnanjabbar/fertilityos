"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function PortalVerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  const doSignIn = useCallback(async () => {
    if (!token?.trim()) {
      setStatus("error");
      setError("Missing or invalid link.");
      return;
    }
    const result = await signIn("portal-token", {
      token: token.trim(),
      redirect: false,
    });
    if (result?.error) {
      setStatus("error");
      setError("This link is invalid or has expired. Request a new one from the login page.");
      return;
    }
    if (result?.ok) {
      setStatus("success");
      window.location.href = "/portal";
      return;
    }
    setStatus("error");
    setError("Sign-in failed. Please try again.");
  }, [token]);

  useEffect(() => {
    doSignIn();
  }, [doSignIn]);

  if (status === "loading") {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-slate-600">Signing you in…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Unable to sign in</h1>
        <p className="text-slate-600 mb-4">{error}</p>
        <a
          href="/portal/login"
          className="inline-block py-2.5 px-4 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800"
        >
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-12">
      <p className="text-slate-600">Redirecting…</p>
    </div>
  );
}
