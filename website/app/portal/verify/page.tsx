"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

const NATIONAL_ID_OPTIONS = [
  { value: "national_id", label: "National ID" },
  { value: "ssn", label: "SSN" },
  { value: "citizen_id", label: "Citizen ID" },
  { value: "other", label: "Other" },
];

export default function PortalVerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const prescriptionId = searchParams.get("p");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "form" | "otp">("loading");
  const [error, setError] = useState("");

  const [nationalIdType, setNationalIdType] = useState("national_id");
  const [nationalIdValue, setNationalIdValue] = useState("");
  const [phone, setPhone] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [verificationId, setVerificationId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const doSignIn = useCallback(async () => {
    if (!token?.trim()) {
      if (prescriptionId?.trim()) {
        setStatus("form");
        return;
      }
      setStatus("error");
      setError("Missing or invalid link. Use the link from your printed prescription or request a sign-in link from the login page.");
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
  }, [token, prescriptionId]);

  useEffect(() => {
    if (token?.trim()) {
      doSignIn();
    } else if (prescriptionId?.trim()) {
      setStatus("form");
    } else {
      setStatus("error");
      setError("Use the link from your printed prescription (scan the QR code) or request a sign-in link from the login page.");
    }
  }, [token, prescriptionId, doSignIn]);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalIdValue.trim() || !phone.trim()) return;
    setVerifyLoading(true);
    setError("");
    try {
      const res = await fetch("/api/portal/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nationalIdType,
          nationalIdValue: nationalIdValue.trim(),
          phone: phone.trim().replace(/\s/g, ""),
          prescriptionId: prescriptionId?.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not send verification code.");
        return;
      }
      setVerificationId(data.verificationId);
      setStatus("otp");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setOtpLoading(true);
    setError("");
    try {
      const res = await fetch("/api/portal/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId,
          code: otpCode.trim().replace(/\s/g, ""),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (data.token) {
        const result = await signIn("portal-token", {
          token: data.token,
          redirect: false,
        });
        if (result?.ok) {
          window.location.href = "/portal";
          return;
        }
      }
      setError("Sign-in failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  if (status === "form") {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verify your identity</h1>
        <p className="text-slate-600 mb-6">
          Enter the national ID and phone number on file with the clinic. We&apos;ll send you a one-time code to sign in.
        </p>
        {error && (
          <p className="mb-4 p-3 rounded-xl text-sm bg-red-50 text-red-700" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div>
            <label htmlFor="nationalIdType" className="block text-sm font-medium text-slate-700 mb-1">
              ID type
            </label>
            <select
              id="nationalIdType"
              value={nationalIdType}
              onChange={(e) => setNationalIdType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]"
              required
            >
              {NATIONAL_ID_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nationalIdValue" className="block text-sm font-medium text-slate-700 mb-1">
              ID number
            </label>
            <input
              id="nationalIdValue"
              type="text"
              value={nationalIdValue}
              onChange={(e) => setNationalIdValue(e.target.value)}
              placeholder="Enter your ID number"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]"
              required
              disabled={verifyLoading}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]"
              required
              disabled={verifyLoading}
            />
          </div>
          <button
            type="submit"
            disabled={verifyLoading}
            className="w-full py-2.5 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60 min-h-[44px]"
          >
            {verifyLoading ? "Sending code…" : "Send verification code"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          <a href="/portal/login" className="text-blue-600 hover:underline">
            Sign in with email instead
          </a>
        </p>
      </div>
    );
  }

  if (status === "otp") {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Enter verification code</h1>
        <p className="text-slate-600 mb-6">
          We sent a 6-digit code to your phone. Enter it below.
        </p>
        {error && (
          <p className="mb-4 p-3 rounded-xl text-sm bg-red-50 text-red-700" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <label htmlFor="otpCode" className="block text-sm font-medium text-slate-700 mb-1">
              Code
            </label>
            <input
              id="otpCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] text-center text-lg tracking-widest"
              maxLength={6}
              required
              disabled={otpLoading}
            />
          </div>
          <button
            type="submit"
            disabled={otpLoading || otpCode.length !== 6}
            className="w-full py-2.5 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60 min-h-[44px]"
          >
            {otpLoading ? "Verifying…" : "Verify and sign in"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setStatus("form");
            setVerificationId("");
            setOtpCode("");
            setError("");
          }}
          className="mt-4 text-sm text-slate-600 hover:text-slate-900"
        >
          Use a different phone or ID
        </button>
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
          className="inline-block py-2.5 px-4 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 min-h-[44px]"
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
