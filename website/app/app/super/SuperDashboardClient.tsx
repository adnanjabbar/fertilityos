"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  UserPlus,
  UserCircle,
  FlaskConical,
  Mail,
  Package,
  Server,
  TrendingUp,
} from "lucide-react";

type Overview = {
  clinicsOnboarded: number;
  totalUsers: number;
  pendingInvitations: number;
  patientsServed: number;
  ivfCyclesSupported: number;
};

type Stats = {
  overview: Overview;
  usersByRole: { role: string; count: number }[];
  recentTenants: {
    id: string;
    name: string;
    slug: string;
    country: string;
    createdAt: string;
  }[];
  tenantUserCounts: { tenantId: string; userCount: number }[];
  pendingInvitations: {
    id: string;
    email: string;
    roleSlug: string;
    expiresAt: string;
    tenantName: string;
  }[];
  modules: Record<string, string>;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  doctor: "Doctor",
  nurse: "Nurse",
  embryologist: "Embryologist",
  lab_tech: "Lab Tech",
  reception: "Reception",
  radiologist: "Radiologist",
  staff: "Staff",
  super_admin: "Super Admin",
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SuperDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/app/super/stats")
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? "Forbidden" : "Failed to load");
        return res.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Loading platform stats…
      </div>
    );
  }
  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        {error === "Forbidden"
          ? "You don’t have access to the Super Dashboard."
          : "Could not load stats. Try again later."}
      </div>
    );
  }

  const o = stats.overview;
  const userCountByTenant = Object.fromEntries(
    stats.tenantUserCounts.map((t) => [t.tenantId, t.userCount])
  );

  const kpis = [
    {
      label: "Clinics onboarded",
      value: o.clinicsOnboarded,
      icon: Building2,
      color: "blue",
    },
    {
      label: "Total users",
      value: o.totalUsers,
      icon: Users,
      color: "teal",
    },
    {
      label: "Pending invitations",
      value: o.pendingInvitations,
      icon: UserPlus,
      color: "amber",
    },
    {
      label: "Patients served",
      value: o.patientsServed,
      icon: UserCircle,
      color: "violet",
    },
    {
      label: "IVF cycles supported",
      value: o.ivfCyclesSupported,
      icon: FlaskConical,
      color: "pink",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Overview KPIs */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-slate-600" />
          Platform overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">{k.label}</span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      k.color === "blue"
                        ? "bg-blue-50 text-blue-700"
                        : k.color === "teal"
                        ? "bg-teal-50 text-teal-700"
                        : k.color === "amber"
                        ? "bg-amber-50 text-amber-700"
                        : k.color === "violet"
                        ? "bg-violet-50 text-violet-700"
                        : "bg-pink-50 text-pink-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">{k.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-600" />
          Users by role
        </h2>
        <div className="flex flex-wrap gap-3">
          {stats.usersByRole.map((r) => (
            <span key={r.role} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm font-medium">
              {ROLE_LABELS[r.role] ?? r.role}: {r.count}
            </span>
          ))}
          {stats.usersByRole.length === 0 && <p className="text-slate-500 text-sm">No clinic users yet.</p>}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-slate-600" />
          Recent clinics
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600 font-medium">
                <th className="pb-3 pr-4">Clinic</th>
                <th className="pb-3 pr-4">Slug</th>
                <th className="pb-3 pr-4">Country</th>
                <th className="pb-3 pr-4">Users</th>
                <th className="pb-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTenants.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">{t.name}</td>
                  <td className="py-3 pr-4 text-slate-600">{t.slug}</td>
                  <td className="py-3 pr-4 text-slate-600">{t.country}</td>
                  <td className="py-3 pr-4 text-slate-600">{userCountByTenant[t.id] ?? 0}</td>
                  <td className="py-3 text-slate-500">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.recentTenants.length === 0 && <p className="text-slate-500 py-4">No clinics yet.</p>}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-slate-600" />
          Pending invitations
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600 font-medium">
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Clinic</th>
                <th className="pb-3">Expires</th>
              </tr>
            </thead>
            <tbody>
              {stats.pendingInvitations.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">{inv.email}</td>
                  <td className="py-3 pr-4 text-slate-600">{inv.roleSlug}</td>
                  <td className="py-3 pr-4 text-slate-600">{inv.tenantName}</td>
                  <td className="py-3 text-slate-500">{formatDate(inv.expiresAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.pendingInvitations.length === 0 && <p className="text-slate-500 py-4">No pending invitations.</p>}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-slate-600" />
          Module status
        </h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(stats.modules).map(([key, status]) => (
            <span
              key={key}
              className={status === "active" ? "px-4 py-2 rounded-xl text-sm font-medium bg-teal-50 text-teal-800" : "px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-600"}
            >
              {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}: {status}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-slate-100 rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Server className="w-5 h-5 text-slate-600" />
          Platform
        </h2>
        <p className="text-sm text-slate-600">
          Multi-tenant SaaS · Next.js · PostgreSQL · DigitalOcean App Platform. This dashboard reflects live data across all tenants.
        </p>
      </section>
    </div>
  );
}
</think>
