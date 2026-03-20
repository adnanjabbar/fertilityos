"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import SuperTenantControls from "./SuperTenantControls";
import {
  ArrowLeft,
  Building2,
  Calendar,
  FlaskConical,
  Receipt,
  Users,
} from "lucide-react";

type DeepDive = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    country: string;
    city: string | null;
    state: string | null;
    defaultCurrency: string;
    enabledModules: string | null;
    createdAt: string;
  };
  subscription: {
    billingPlan: string;
    status: string;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    currentPeriodEnd: string | null;
    stripePriceId: string | null;
    updatedAt: string;
  };
  counts: {
    users: number;
    patients: number;
    appointments: number;
    ivfCycles: number;
    invoices: number;
  };
  usersByRole: { role: string; count: number }[];
  ivfCyclesByStatus: { status: string; count: number }[];
  invoiceRollups: {
    currency: string;
    paidTotal: string;
    outstandingTotal: string;
    paidCount: number;
    outstandingCount: number;
  }[];
};

export default function TenantDeepDiveClient({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<DeepDive | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/app/super/tenants/${tenantId}`)
      .then((res) => {
        if (res.status === 404) throw new Error("Clinic not found");
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Loading clinic snapshot…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        {error ?? "Could not load clinic."}
      </div>
    );
  }

  const { tenant, subscription, counts } = data;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/super/clinics"
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          All clinics
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-700" />
          {tenant.name}
        </h1>
        <p className="text-slate-600 mt-1">
          <span className="font-mono text-slate-500">{tenant.slug}</span>
          {" · "}
          {[tenant.city, tenant.state, tenant.country].filter(Boolean).join(", ") ||
            tenant.country}
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Aggregate metrics only — open this clinic as an admin to see patient-level detail.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Users", value: counts.users, icon: Users },
          { label: "Patients", value: counts.patients, icon: Users },
          { label: "Appointments", value: counts.appointments, icon: Calendar },
          { label: "IVF cycles", value: counts.ivfCycles, icon: FlaskConical },
          { label: "Invoices", value: counts.invoices, icon: Receipt },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <k.icon className="w-5 h-5 text-slate-500 mb-2" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {k.label}
            </p>
            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>

      <SuperTenantControls
        tenantId={tenantId}
        initialBillingPlan={subscription.billingPlan}
        initialStatus={subscription.status}
        initialEnabledModules={tenant.enabledModules}
        onRefresh={loadData}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Stripe linkage (read-only)</h2>
        <dl className="grid sm:grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-slate-500">Current period end</dt>
            <dd className="font-medium text-slate-800">
              {subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleString()
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Stripe customer</dt>
            <dd className="font-mono text-xs text-slate-600 break-all">
              {subscription.stripeCustomerId ?? "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Stripe subscription</dt>
            <dd className="font-mono text-xs text-slate-600 break-all">
              {subscription.stripeSubscriptionId ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Users by role</h2>
        <div className="flex flex-wrap gap-2">
          {data.usersByRole.map((r) => (
            <span
              key={r.role}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-sm font-medium"
            >
              {r.role}: {r.count}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-3">IVF cycles by status</h2>
        <div className="flex flex-wrap gap-2">
          {data.ivfCyclesByStatus.length === 0 ? (
            <p className="text-slate-500 text-sm">No cycles recorded.</p>
          ) : (
            data.ivfCyclesByStatus.map((r) => (
              <span
                key={r.status}
                className="px-3 py-1.5 rounded-lg bg-violet-50 text-violet-900 text-sm font-medium"
              >
                {r.status}: {r.count}
              </span>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Invoice totals by currency</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-600">
                <th className="pb-2 pr-4">Currency</th>
                <th className="pb-2 pr-4">Paid total</th>
                <th className="pb-2 pr-4">Outstanding</th>
                <th className="pb-2 pr-4">Paid #</th>
                <th className="pb-2">Outstanding #</th>
              </tr>
            </thead>
            <tbody>
              {data.invoiceRollups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-slate-500">
                    No invoices yet.
                  </td>
                </tr>
              ) : (
                data.invoiceRollups.map((r) => (
                  <tr key={r.currency} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium">{r.currency}</td>
                    <td className="py-2 pr-4">{r.paidTotal}</td>
                    <td className="py-2 pr-4">{r.outstandingTotal}</td>
                    <td className="py-2 pr-4">{r.paidCount}</td>
                    <td className="py-2">{r.outstandingCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
