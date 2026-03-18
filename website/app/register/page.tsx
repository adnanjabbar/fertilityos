"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Activity, ArrowRight, ArrowLeft } from "lucide-react";

type Step = "email" | "clinic" | "admin";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition";
const labelClass = "block text-sm font-semibold text-slate-700 mb-2";

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}

function stepDescription(step: Step): string {
  switch (step) {
    case "email":
      return "Verify your work email to continue.";
    case "clinic":
      return "Enter your clinic details. You'll set your admin account next.";
    case "admin":
      return "Create the administrator account and verify your phone.";
    default:
      return "";
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    const tenant = searchParams.get("tenant");
    if (ref) setRefCode(ref);
    if (tenant) setTenantSlug(tenant);
  }, [searchParams]);

  const [clinic, setClinic] = useState({
    name: "",
    slug: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    specialty: "",
    licenseInfo: "",
  });
  const [admin, setAdmin] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });

  const handleSendEmailCode = async () => {
    if (!admin.email.trim()) {
      setError("Enter your email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-email-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: admin.email.trim(), context: "clinic_register" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to send code");
        return;
      }
      setEmailCodeSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!admin.email.trim() || emailCode.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: admin.email.trim(),
          code: emailCode.trim(),
          context: "clinic_register",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Invalid or expired code");
        return;
      }
      setStep("clinic");
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneCode = async () => {
    const phone = admin.phone.trim().replace(/\s/g, "");
    if (!phone) {
      setError("Enter your phone number.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          context: "admin_signup",
          recipientName: admin.fullName.trim() || "You",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to send code");
        return;
      }
      setPhoneCodeSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    const phone = admin.phone.trim().replace(/\s/g, "");
    if (!phone || phoneCode.length !== 6) {
      setError("Enter the 6-digit code from your phone.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code: phoneCode.trim(),
          context: "admin_signup",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Invalid or expired code");
        return;
      }
      setPhoneVerified(true);
      setPhoneCodeSent(false);
      setPhoneCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleClinicNext = () => {
    if (!clinic.name.trim()) {
      setError("Clinic name is required.");
      return;
    }
    if (!clinic.country.trim() || clinic.country.length !== 2) {
      setError("Country must be a 2-letter code (e.g. US, PK).");
      return;
    }
    setError(null);
    setClinic((c) => ({ ...c, slug: c.slug || slugFromName(c.name) }));
    setStep("admin");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(refCode ? { ref: refCode } : {}),
          ...(tenantSlug ? { tenantSlug } : {}),
          clinic: {
            name: clinic.name.trim(),
            slug: (clinic.slug || slugFromName(clinic.name)).trim().toLowerCase(),
            address: clinic.address.trim() || undefined,
            city: clinic.city.trim() || undefined,
            state: clinic.state.trim() || undefined,
            country: clinic.country.trim().toUpperCase(),
            postalCode: clinic.postalCode.trim() || undefined,
            specialty: clinic.specialty.trim() || undefined,
            licenseInfo: clinic.licenseInfo.trim() || undefined,
          },
          admin: {
            email: admin.email.trim().toLowerCase(),
            password: admin.password,
            fullName: admin.fullName.trim(),
            phone: admin.phone.trim().replace(/\s/g, "") || undefined,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }
      // Auto sign-in so they don't have to type password again
      const signInRes = await signIn("credentials", {
        email: admin.email.trim().toLowerCase(),
        password: admin.password,
        redirect: false,
      });
      if (signInRes?.ok && !signInRes?.error) {
        router.push("/app/dashboard");
        router.refresh();
      } else {
        router.push("/login?registered=1");
      }
    } finally {
      setLoading(false);
    }
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

      <div className="w-full max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
          Create your clinic account
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          Register your clinic
        </h1>
        <p className="text-slate-600 mb-8">
          {stepDescription(step)}
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {step === "email" ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <label htmlFor="register-email" className={labelClass}>Work email <span className="text-red-500">*</span></label>
              <input
                id="register-email"
                type="email"
                placeholder="you@yourclinic.com"
                value={admin.email}
                onChange={(e) => setAdmin((a) => ({ ...a, email: e.target.value }))}
                className={inputClass}
                disabled={emailCodeSent}
              />
            </div>
            {!emailCodeSent ? (
              <button
                type="button"
                onClick={handleSendEmailCode}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send verification code"}
              </button>
            ) : (
              <>
                <div>
                  <label htmlFor="emailCode" className={labelClass}>Verification code (check your email)</label>
                  <input
                    id="emailCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                    className={inputClass}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setEmailCodeSent(false); setEmailCode(""); }}
                    className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    Use different email
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={loading || emailCode.length !== 6}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 disabled:opacity-60"
                  >
                    {loading ? "Verifying…" : "Verify and continue"}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : step === "clinic" ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <label htmlFor="clinic-name" className={labelClass}>
                Clinic / Center name <span className="text-red-500">*</span>
              </label>
              <input
                id="clinic-name"
                type="text"
                placeholder="e.g. Advanced Fertility Center"
                value={clinic.name}
                onChange={(e) =>
                  setClinic((c) => ({
                    ...c,
                    name: e.target.value,
                    slug: c.slug || slugFromName(e.target.value),
                  }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="clinic-slug" className={labelClass}>
                Subdomain slug
              </label>
              <input
                id="clinic-slug"
                type="text"
                placeholder="e.g. advanced-fertility"
                value={clinic.slug}
                onChange={(e) =>
                  setClinic((c) => ({ ...c, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
                }
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1">
                Your clinic URL will be: <strong>{clinic.slug || "..."}.thefertilityos.com</strong>
              </p>
            </div>
            <div>
              <label htmlFor="country" className={labelClass}>
                Country (2-letter code) <span className="text-red-500">*</span>
              </label>
              <input
                id="country"
                type="text"
                placeholder="e.g. US, PK, GB"
                maxLength={2}
                value={clinic.country}
                onChange={(e) =>
                  setClinic((c) => ({ ...c, country: e.target.value.toUpperCase() }))
                }
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className={labelClass}>City</label>
                <input
                  id="city"
                  type="text"
                  placeholder="City"
                  value={clinic.city}
                  onChange={(e) => setClinic((c) => ({ ...c, city: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>State / Region</label>
                <input
                  id="state"
                  type="text"
                  placeholder="State"
                  value={clinic.state}
                  onChange={(e) => setClinic((c) => ({ ...c, state: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="address" className={labelClass}>Address</label>
              <input
                id="address"
                type="text"
                placeholder="Street address"
                value={clinic.address}
                onChange={(e) => setClinic((c) => ({ ...c, address: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="specialty" className={labelClass}>Specialty</label>
              <input
                id="specialty"
                type="text"
                placeholder="e.g. IVF, Reproductive Endocrinology"
                value={clinic.specialty}
                onChange={(e) => setClinic((c) => ({ ...c, specialty: e.target.value }))}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={handleClinicNext}
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5"
            >
              Next: Admin account
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
          >
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Your full name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Dr. Jane Smith"
                value={admin.fullName}
                onChange={(e) => setAdmin((a) => ({ ...a, fullName: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="admin-email" className={labelClass}>
                Work email <span className="text-red-500">*</span>
              </label>
              <input
                id="admin-email"
                type="email"
                placeholder="you@yourclinic.com"
                value={admin.email}
                readOnly
                className={inputClass + " bg-slate-50"}
              />
            </div>
            <div>
              <label htmlFor="admin-phone" className={labelClass}>
                Phone (optional)
              </label>
              <input
                id="admin-phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={admin.phone}
                onChange={(e) => {
                  setAdmin((a) => ({ ...a, phone: e.target.value }));
                  setPhoneVerified(false);
                }}
                className={inputClass}
                disabled={phoneCodeSent}
              />
              {admin.phone.trim() && !phoneVerified && !phoneCodeSent && (
                <button
                  type="button"
                  onClick={handleSendPhoneCode}
                  disabled={loading}
                  className="mt-2 w-full py-2 rounded-lg border border-blue-600 text-blue-700 font-semibold text-sm hover:bg-blue-50"
                >
                  {loading ? "Sending…" : "Send verification code"}
                </button>
              )}
              {phoneCodeSent && (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setPhoneCodeSent(false); setPhoneCode(""); }}
                      className="py-2 px-4 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyPhone}
                      disabled={loading || phoneCode.length !== 6}
                      className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                    >
                      {loading ? "Verifying…" : "Verify"}
                    </button>
                  </div>
                </div>
              )}
              {phoneVerified && admin.phone.trim() && (
                <p className="mt-1 text-sm text-green-600 font-medium">Phone verified</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={admin.password}
                onChange={(e) => setAdmin((a) => ({ ...a, password: e.target.value }))}
                className={inputClass}
                minLength={8}
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("clinic")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="submit"
                disabled={loading || (admin.phone.trim() !== "" && !phoneVerified)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? "Creating account…" : "Create clinic & account"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-slate-600 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
