"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Search, Users } from "lucide-react";
import { PhoneInputWithCountry } from "@/app/components/PhoneInputWithCountry";
import { SearchableGeoSelect, type GeoOption } from "@/app/components/SearchableGeoSelect";

type PatientRow = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { dateStyle: "medium" });
}

export default function PatientsClient() {
  const router = useRouter();
  const [list, setList] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    countryCode: "",
    stateCode: "",
    postalCode: "",
    gender: "",
    genderIdentity: "",
    relationshipStatus: "",
    coupleType: "",
    spouseFirstName: "",
    spouseLastName: "",
    spouseDateOfBirth: "",
    spouseEmail: "",
    spousePhone: "",
    notes: "",
  });
  const [countryOptions, setCountryOptions] = useState<GeoOption[]>([]);
  const [stateOptions, setStateOptions] = useState<GeoOption[]>([]);
  const [cityOptions, setCityOptions] = useState<GeoOption[]>([]);
  const [geoLoading, setGeoLoading] = useState({ countries: false, states: false, cities: false });
  const showSpouse = form.relationshipStatus === "partnered" || form.relationshipStatus === "married";
  const showCoupleType = showSpouse;

  useEffect(() => {
    if (!showAddForm) return;
    setGeoLoading((g) => ({ ...g, countries: true }));
    fetch("/api/app/geo/countries")
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => setCountryOptions(Array.isArray(arr) ? arr : []))
      .finally(() => setGeoLoading((g) => ({ ...g, countries: false })));
  }, [showAddForm]);

  useEffect(() => {
    if (!form.countryCode) {
      setStateOptions([]);
      setCityOptions([]);
      return;
    }
    setGeoLoading((g) => ({ ...g, states: true }));
    fetch(`/api/app/geo/states?country=${encodeURIComponent(form.countryCode)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => setStateOptions(Array.isArray(arr) ? arr : []))
      .finally(() => setGeoLoading((g) => ({ ...g, states: false })));
    setCityOptions([]);
  }, [form.countryCode]);

  useEffect(() => {
    if (!form.countryCode || !form.stateCode) {
      setCityOptions([]);
      return;
    }
    setGeoLoading((g) => ({ ...g, cities: true }));
    fetch(
      `/api/app/geo/cities?country=${encodeURIComponent(form.countryCode)}&state=${encodeURIComponent(form.stateCode)}`
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => setCityOptions(Array.isArray(arr) ? arr : []))
      .finally(() => setGeoLoading((g) => ({ ...g, cities: false })));
  }, [form.countryCode, form.stateCode]);

  const fetchList = useCallback(async () => {
    try {
      const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
      const res = await fetch(`/api/app/patients${q}`);
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(fetchList, 300);
    return () => clearTimeout(t);
  }, [fetchList]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setAddError("First name and last name are required.");
      return;
    }
    setAddError(null);
    setAddLoading(true);
    try {
      const res = await fetch("/api/app/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          dateOfBirth: form.dateOfBirth || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          country: form.country.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
          gender: form.gender.trim() || undefined,
          genderIdentity: form.genderIdentity.trim() || undefined,
          relationshipStatus: form.relationshipStatus.trim() || undefined,
          coupleType: form.coupleType.trim() || undefined,
          spouseFirstName: form.spouseFirstName.trim() || undefined,
          spouseLastName: form.spouseLastName.trim() || undefined,
          spouseDateOfBirth: form.spouseDateOfBirth || undefined,
          spouseEmail: form.spouseEmail.trim() || undefined,
          spousePhone: form.spousePhone.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || data.error;
        const details = data.details as Record<string, string[] | undefined> | undefined;
        const fromDetails = details
          ? Object.entries(details)
              .flatMap(([field, errs]) => (errs || []).map((e) => `${field}: ${e}`))
              .filter(Boolean)
              .join(". ")
          : "";
        setAddError(msg && fromDetails ? `${msg} — ${fromDetails}` : msg || fromDetails || "Failed to create patient.");
        return;
      }
      setShowAddForm(false);
      setForm({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
        countryCode: "",
        stateCode: "",
        postalCode: "",
        gender: "",
        genderIdentity: "",
        relationshipStatus: "",
        coupleType: "",
        spouseFirstName: "",
        spouseLastName: "",
        spouseDateOfBirth: "",
        spouseEmail: "",
        spousePhone: "",
        notes: "",
      });
      router.push(`/app/patients/${data.id}`);
      fetchList();
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass + " pl-10"}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Add patient
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">New patient</h2>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {addError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{addError}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={labelClass}>First name *</label>
                <input
                  id="firstName"
                  className={inputClass}
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>Last name *</label>
                <input
                  id="lastName"
                  className={inputClass}
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOfBirth" className={labelClass}>Date of birth</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  className={inputClass}
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>Email</label>
                <input
                  id="email"
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>Phone</label>
              <PhoneInputWithCountry
                id="phone"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v ?? "" }))}
                placeholder="e.g. 312 499 1701"
              />
            </div>
            <div>
              <label htmlFor="address" className={labelClass}>Address</label>
              <input
                id="address"
                className={inputClass}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="country" className={labelClass}>Country</label>
                <SearchableGeoSelect
                  id="country"
                  placeholder="Search country…"
                  value={form.country}
                  onChange={(name, code) =>
                    setForm((f) => ({ ...f, country: name, countryCode: code ?? "", state: "", stateCode: "", city: "" }))
                  }
                  options={countryOptions}
                  loading={geoLoading.countries}
                  getDisplayLabel={(c) => (c.flag ? `${c.flag} ${c.name}` : c.name)}
                />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>State / Province</label>
                <SearchableGeoSelect
                  id="state"
                  placeholder="Search state…"
                  value={form.state}
                  onChange={(name, code) =>
                    setForm((f) => ({ ...f, state: name, stateCode: code ?? "", city: "" }))
                  }
                  options={stateOptions}
                  loading={geoLoading.states}
                  disabled={!form.countryCode}
                  getDisplayLabel={(s) => s.name}
                />
              </div>
              <div>
                <label htmlFor="city" className={labelClass}>City</label>
                <SearchableGeoSelect
                  id="city"
                  placeholder="Search city…"
                  value={form.city}
                  onChange={(name) => setForm((f) => ({ ...f, city: name }))}
                  options={cityOptions}
                  loading={geoLoading.cities}
                  disabled={!form.stateCode}
                  getDisplayLabel={(c) => c.name}
                />
              </div>
              <div>
                <label htmlFor="postalCode" className={labelClass}>Postal code</label>
                <input
                  id="postalCode"
                  className={inputClass}
                  value={form.postalCode}
                  onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label htmlFor="genderIdentity" className={labelClass}>Gender identity</label>
              <select
                id="genderIdentity"
                className={inputClass}
                value={form.genderIdentity}
                onChange={(e) => setForm((f) => ({ ...f, genderIdentity: e.target.value, gender: e.target.value }))}
              >
                <option value="">Select (optional)</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
                <option value="self_describe">Prefer to self-describe</option>
                <option value="prefer_not_say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label htmlFor="relationshipStatus" className={labelClass}>Relationship status</label>
              <select
                id="relationshipStatus"
                className={inputClass}
                value={form.relationshipStatus}
                onChange={(e) => setForm((f) => ({ ...f, relationshipStatus: e.target.value }))}
              >
                <option value="">Select (optional)</option>
                <option value="single">Single</option>
                <option value="partnered">Partnered</option>
                <option value="married">Married</option>
                <option value="other">Other</option>
              </select>
            </div>
            {showCoupleType && (
              <div>
                <label htmlFor="coupleType" className={labelClass}>Couple type</label>
                <select
                  id="coupleType"
                  className={inputClass}
                  value={form.coupleType}
                  onChange={(e) => setForm((f) => ({ ...f, coupleType: e.target.value }))}
                >
                  <option value="">Select (optional)</option>
                  <option value="heterosexual">Heterosexual couple</option>
                  <option value="same_sex_male">Same-sex couple (male)</option>
                  <option value="same_sex_female">Same-sex couple (female)</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}
            {showSpouse && (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <h3 className="font-semibold text-slate-800">Spouse / partner information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="spouseFirstName" className={labelClass}>Partner first name</label>
                    <input id="spouseFirstName" className={inputClass} value={form.spouseFirstName} onChange={(e) => setForm((f) => ({ ...f, spouseFirstName: e.target.value }))} />
                  </div>
                  <div>
                    <label htmlFor="spouseLastName" className={labelClass}>Partner last name</label>
                    <input id="spouseLastName" className={inputClass} value={form.spouseLastName} onChange={(e) => setForm((f) => ({ ...f, spouseLastName: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="spouseDateOfBirth" className={labelClass}>Partner date of birth</label>
                    <input id="spouseDateOfBirth" type="date" className={inputClass} value={form.spouseDateOfBirth} onChange={(e) => setForm((f) => ({ ...f, spouseDateOfBirth: e.target.value }))} />
                  </div>
                  <div>
                    <label htmlFor="spouseEmail" className={labelClass}>Partner email</label>
                    <input id="spouseEmail" type="email" className={inputClass} value={form.spouseEmail} onChange={(e) => setForm((f) => ({ ...f, spouseEmail: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label htmlFor="spousePhone" className={labelClass}>Partner phone</label>
                  <PhoneInputWithCountry
                    id="spousePhone"
                    value={form.spousePhone}
                    onChange={(v) => setForm((f) => ({ ...f, spousePhone: v ?? "" }))}
                    placeholder="Partner phone number"
                  />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="notes" className={labelClass}>Notes</label>
              <textarea
                id="notes"
                rows={3}
                className={inputClass}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addLoading}
                className="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-60"
              >
                {addLoading ? "Creating…" : "Create patient"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No patients yet.</p>
            <p className="text-slate-500 text-sm mt-1">Add your first patient above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 font-medium">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">DOB</th>
                <th className="px-4 py-3">Added</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/patients/${p.id}`}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {p.firstName} {p.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.email ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(p.dateOfBirth)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
