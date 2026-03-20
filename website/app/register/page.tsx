"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Activity,
  ArrowRight,
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SearchableGeoSelect, type GeoOption } from "@/app/components/SearchableGeoSelect";
import { PhoneInputWithCountry } from "@/app/components/PhoneInputWithCountry";

const GEO_PUBLIC = "/api/public/geo";
const showSsoHint =
  process.env.NEXT_PUBLIC_OAUTH_GOOGLE === "1" || process.env.NEXT_PUBLIC_OAUTH_MICROSOFT === "1";

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
    stateCode: "",
    country: "",
    countryCode: "",
    postalCode: "",
    specialty: "",
    licenseInfo: "",
    latitude: "",
    longitude: "",
  });
  const [countryOptions, setCountryOptions] = useState<GeoOption[]>([]);
  const [stateOptions, setStateOptions] = useState<GeoOption[]>([]);
  const [cityOptions, setCityOptions] = useState<GeoOption[]>([]);
  const [geoLoading, setGeoLoading] = useState({
    countries: false,
    states: false,
    cities: false,
    gps: false,
  });
  const manualRegion =
    Boolean(clinic.countryCode) && !geoLoading.states && stateOptions.length === 0;

  useEffect(() => {
    if (step !== "clinic") return;
    setGeoLoading((g) => ({ ...g, countries: true }));
    fetch(`${GEO_PUBLIC}/countries`)
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => setCountryOptions(Array.isArray(arr) ? arr : []))
      .finally(() => setGeoLoading((g) => ({ ...g, countries: false })));
  }, [step]);

  useEffect(() => {
    if (!clinic.countryCode) {
      setStateOptions([]);
      setCityOptions([]);
      return;
    }
    setGeoLoading((g) => ({ ...g, states: true }));
    fetch(`${GEO_PUBLIC}/states?country=${encodeURIComponent(clinic.countryCode)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => setStateOptions(Array.isArray(arr) ? arr : []))
      .finally(() => setGeoLoading((g) => ({ ...g, states: false })));
    setCityOptions([]);
  }, [clinic.countryCode]);

  useEffect(() => {
    if (!clinic.countryCode || !clinic.stateCode || manualRegion) {
      setCityOptions([]);
      return;
    }
    setGeoLoading((g) => ({ ...g, cities: true }));
    fetch(
      `${GEO_PUBLIC}/cities?country=${encodeURIComponent(clinic.countryCode)}&state=${encodeURIComponent(clinic.stateCode)}`
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => setCityOptions(Array.isArray(arr) ? arr : []))
      .finally(() => setGeoLoading((g) => ({ ...g, cities: false })));
  }, [clinic.countryCode, clinic.stateCode, manualRegion]);
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

  const handlePinWithGps = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Your browser does not support location sharing.");
      return;
    }
    setError(null);
    setGeoLoading((g) => ({ ...g, gps: true }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        setClinic((c) => ({ ...c, latitude: lat, longitude: lon }));
        try {
          const r = await fetch(
            `/api/public/reverse-geocode?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
          );
          const d = (await r.json().catch(() => ({}))) as {
            road?: string;
            city?: string;
            state?: string;
            countryCode?: string;
            postcode?: string;
          };
          if (!r.ok) {
            setGeoLoading((g) => ({ ...g, gps: false }));
            return;
          }
          setClinic((c) => {
            const cc = (d.countryCode ?? "").toUpperCase();
            const match =
              cc.length === 2 && countryOptions.length > 0
                ? countryOptions.find((o) => o.code?.toUpperCase() === cc)
                : undefined;
            const countryChanged = Boolean(match?.code && match.code !== c.countryCode);
            return {
              ...c,
              latitude: lat,
              longitude: lon,
              address: d.road && !c.address.trim() ? d.road : c.address,
              city: countryChanged ? (d.city ?? "") : d.city || c.city,
              state: countryChanged ? (d.state ?? "") : d.state || c.state,
              stateCode: countryChanged ? "" : c.stateCode,
              postalCode: d.postcode || c.postalCode,
              country: match?.name ?? c.country,
              countryCode: match?.code ?? c.countryCode,
            };
          });
        } catch {
          /* keep coordinates only */
        } finally {
          setGeoLoading((g) => ({ ...g, gps: false }));
        }
      },
      () => {
        setError("Could not read your location. Allow location access or enter your address manually.");
        setGeoLoading((g) => ({ ...g, gps: false }));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const handleClinicNext = () => {
    if (!clinic.name.trim()) {
      setError("Clinic name is required.");
      return;
    }
    if (!clinic.countryCode.trim() || clinic.countryCode.length !== 2) {
      setError("Choose your country from the searchable list (flag and full name).");
      return;
    }
    if (manualRegion) {
      if (!clinic.state.trim() || !clinic.city.trim()) {
        setError("Enter region and city for your location.");
        return;
      }
    } else {
      if (!clinic.state.trim() || !clinic.stateCode.trim()) {
        setError("Select a state or province from the list.");
        return;
      }
      if (!clinic.city.trim()) {
        setError("Select a city from the list.");
        return;
      }
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
            country: clinic.countryCode.trim().toUpperCase(),
            postalCode: clinic.postalCode.trim() || undefined,
            specialty: clinic.specialty.trim() || undefined,
            licenseInfo: clinic.licenseInfo.trim() || undefined,
            latitude: clinic.latitude.trim() || undefined,
            longitude: clinic.longitude.trim() || undefined,
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

  const stepIndex = step === "email" ? 0 : step === "clinic" ? 1 : 2;
  const progressPct = ((stepIndex + 1) / 3) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-teal-900">
      <div className="pointer-events-none absolute inset-0 register-aurora opacity-50" aria-hidden />

      <Link
        href="/"
        className="flex items-center gap-2 absolute top-5 left-5 z-20 text-white/90 hover:text-white transition-colors"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
          <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-lg sm:text-xl">
          TheFertility<span className="text-teal-300">OS</span>
        </span>
      </Link>

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        <aside className="hidden lg:flex lg:w-[42%] xl:w-[40%] flex-col justify-center px-10 xl:px-14 py-24 text-white border-r border-white/10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/95 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Clinic onboarding
          </div>
          <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight">
            A calmer way to bring your center online.
          </h2>
          <p className="mt-4 text-base text-white/80 max-w-md leading-relaxed">
            Verify your email, pin your location, and create your admin space — guided steps, clear copy,
            built for busy clinical teams.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-white/85">
            <li className="flex gap-3 items-start">
              <Mail className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
              <span>Work email verification keeps signups trustworthy.</span>
            </li>
            <li className="flex gap-3 items-start">
              <Building2 className="w-5 h-5 text-pink-300 shrink-0 mt-0.5" />
              <span>Full country &amp; region lists with flags — no cryptic codes.</span>
            </li>
            <li className="flex gap-3 items-start">
              <MapPin className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
              <span>Optional GPS pin refines your address when you want it.</span>
            </li>
            <li className="flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              <span>Strong password + optional phone OTP for your admin account.</span>
            </li>
          </ul>
        </aside>

        <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-12 lg:pt-12 lg:pb-12">
          <div className="w-full max-w-lg xl:max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-bold uppercase tracking-wider mb-4 lg:hidden backdrop-blur-sm">
              Create your clinic
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 drop-shadow-sm">
              Register your clinic
            </h1>
            <p className="text-white/85 text-sm sm:text-base mb-6">{stepDescription(step)}</p>

            <div className="mb-6">
              <div className="h-2 rounded-full bg-white/15 overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-pink-400 transition-all duration-700 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-white/70 mt-2 font-medium">
                Step {stepIndex + 1} of 3 — you&apos;re doing great.
              </p>
            </div>

            <nav aria-label="Registration steps" className="mb-8">
              <ol className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "email" as const, label: "Email", n: 1, Icon: Mail },
                    { id: "clinic" as const, label: "Clinic", n: 2, Icon: Building2 },
                    { id: "admin" as const, label: "Admin", n: 3, Icon: ShieldCheck },
                  ] as const
                ).map(({ id, label, n, Icon }) => {
                  const active = step === id;
                  const done =
                    (id === "email" && (step === "clinic" || step === "admin")) ||
                    (id === "clinic" && step === "admin");
                  return (
                    <li
                      key={id}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-sm ${
                        active
                          ? "border-cyan-300 bg-white/20 text-white shadow-lg"
                          : done
                            ? "border-teal-400/60 bg-teal-500/20 text-teal-50"
                            : "border-white/20 bg-white/5 text-white/60"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 opacity-90" aria-hidden />
                      <span className="opacity-80 tabular-nums">{n}.</span> {label}
                    </li>
                  );
                })}
              </ol>
            </nav>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-400/40 text-red-50 text-sm backdrop-blur-sm">
            {error}
          </div>
        )}

        {step === "email" ? (
          <div className="register-card-animate bg-white/95 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl shadow-black/20 p-6 sm:p-8 space-y-4">
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
          <div className="register-card-animate bg-white/95 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl shadow-black/20 p-6 sm:p-8 space-y-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="country" className={labelClass}>
                  Country <span className="text-red-500">*</span>
                </label>
                <SearchableGeoSelect
                  id="country"
                  placeholder="Search by country name or flag…"
                  value={clinic.country}
                  onChange={(name, code) =>
                    setClinic((c) => ({
                      ...c,
                      country: name,
                      countryCode: code ?? "",
                      state: "",
                      stateCode: "",
                      city: "",
                    }))
                  }
                  options={countryOptions}
                  loading={geoLoading.countries}
                  getDisplayLabel={(c) => (c.flag ? `${c.flag} ${c.name}` : c.name)}
                />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>
                  State / province <span className="text-red-500">*</span>
                </label>
                {manualRegion ? (
                  <>
                    <p className="text-xs text-slate-500 mb-2">
                      No subdivisions in our directory for this country — type region and city.
                    </p>
                    <input
                      id="state"
                      type="text"
                      placeholder="Region / province"
                      value={clinic.state}
                      onChange={(e) => setClinic((c) => ({ ...c, state: e.target.value, stateCode: "" }))}
                      className={inputClass}
                    />
                  </>
                ) : (
                  <SearchableGeoSelect
                    id="state"
                    placeholder="Search state…"
                    value={clinic.state}
                    onChange={(name, code) =>
                      setClinic((c) => ({ ...c, state: name, stateCode: code ?? "", city: "" }))
                    }
                    options={stateOptions}
                    loading={geoLoading.states}
                    disabled={!clinic.countryCode}
                    getDisplayLabel={(s) => s.name}
                  />
                )}
              </div>
              <div>
                <label htmlFor="city" className={labelClass}>
                  City <span className="text-red-500">*</span>
                </label>
                {manualRegion ? (
                  <input
                    id="city"
                    type="text"
                    placeholder="City"
                    value={clinic.city}
                    onChange={(e) => setClinic((c) => ({ ...c, city: e.target.value }))}
                    className={inputClass}
                  />
                ) : (
                  <SearchableGeoSelect
                    id="city"
                    placeholder="Search city…"
                    value={clinic.city}
                    onChange={(name) => setClinic((c) => ({ ...c, city: name }))}
                    options={cityOptions}
                    loading={geoLoading.cities}
                    disabled={!clinic.stateCode}
                    getDisplayLabel={(c) => c.name}
                  />
                )}
              </div>
              <div>
                <label htmlFor="postal" className={labelClass}>Postal code</label>
                <input
                  id="postal"
                  type="text"
                  placeholder="Postal / ZIP"
                  value={clinic.postalCode}
                  onChange={(e) => setClinic((c) => ({ ...c, postalCode: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="address" className={labelClass}>Street address</label>
              <input
                id="address"
                type="text"
                placeholder="Building, street, suite…"
                value={clinic.address}
                onChange={(e) => setClinic((c) => ({ ...c, address: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="rounded-xl border border-dashed border-blue-200 bg-gradient-to-br from-blue-50/80 to-teal-50/40 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white shadow-md">
                  <MapPin className="w-5 h-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">Pin with GPS (optional)</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Adds coordinates for an approximate map location. We&apos;ll suggest address fields when
                    possible — you can always edit them.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePinWithGps}
                disabled={geoLoading.gps}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60 transition-colors"
              >
                {geoLoading.gps ? "Locating…" : "Use my current location"}
              </button>
              {(clinic.latitude || clinic.longitude) && (
                <p className="text-xs font-mono text-slate-600 break-all">
                  Saved pin: {clinic.latitude || "—"}, {clinic.longitude || "—"}
                </p>
              )}
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
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-700 to-teal-600 text-white font-bold hover:from-blue-800 hover:to-teal-700 transition-all shadow-lg shadow-blue-900/20 hover:-translate-y-0.5"
            >
              Next: Admin account
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="register-card-animate bg-white/95 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl shadow-black/20 p-6 sm:p-8 space-y-4"
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
                Phone (optional) — country code &amp; flag
              </label>
              <PhoneInputWithCountry
                id="admin-phone"
                value={admin.phone || undefined}
                onChange={(v) => {
                  setAdmin((a) => ({ ...a, phone: v ?? "" }));
                  setPhoneVerified(false);
                }}
                placeholder="e.g. 234 567 8900"
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
            {showSsoHint && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-blue-900">Single sign-on (SSO)</p>
                <p className="mt-1">
                  After your clinic is created, staff can use{" "}
                  <strong>Google</strong> or <strong>Microsoft</strong> on the login page when your
                  organization enables it — same verified identity, no extra password for day-to-day
                  sign-in. Two-factor authentication (2FA) is planned after SSO rollout.
                </p>
              </div>
            )}
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

            <div className="mt-8 space-y-2">
              <p className="text-center text-white/80 text-sm">Already have an account?</p>
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-white/40 bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
