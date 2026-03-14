"use client";

import { useState, useEffect } from "react";
import { UserPlus, Users, Mail, Copy, Check } from "lucide-react";

const ROLES = [
  { value: "doctor", label: "Doctor / Fertility Specialist" },
  { value: "nurse", label: "Nurse" },
  { value: "embryologist", label: "Embryologist" },
  { value: "lab_tech", label: "Lab Technician" },
  { value: "reception", label: "Reception" },
  { value: "radiologist", label: "Radiologist" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Administrator" },
] as const;

type Invitation = {
  id: string;
  email: string;
  roleSlug: string;
  expiresAt: string;
  createdAt: string;
};

type UserRow = {
  id: string;
  email: string;
  fullName: string;
  roleSlug: string;
  createdAt: string;
};

export default function TeamClient() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("staff");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    try {
      const [invRes, usersRes] = await Promise.all([
        fetch("/api/app/invitations"),
        fetch("/api/app/users"),
      ]);
      if (invRes.ok) setInvitations(await invRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteError(null);
    setLastInviteLink(null);
    setInviteLoading(true);
    try {
      const res = await fetch("/api/app/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim().toLowerCase(), roleSlug: inviteRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInviteError(data.error || "Failed to create invitation.");
        return;
      }
      setLastInviteLink(data.inviteLink ?? null);
      setInviteEmail("");
      fetchData();
    } finally {
      setInviteLoading(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });

  if (loading) {
    return <div className="text-slate-600">Loading…</div>;
  }

  return (
    <div className="space-y-10">
      {/* Invite form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-700" />
          Invite a team member
        </h2>
        <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="invite-email" className="block text-sm font-semibold text-slate-700 mb-1">
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              placeholder="colleague@clinic.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div className="w-[200px]">
            <label htmlFor="invite-role" className="block text-sm font-semibold text-slate-700 mb-1">
              Role
            </label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={inviteLoading}
            className="px-6 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors disabled:opacity-60"
          >
            {inviteLoading ? "Creating…" : "Send invite"}
          </button>
        </form>
        {inviteError && (
          <p className="mt-3 text-sm text-red-600">{inviteError}</p>
        )}
        {lastInviteLink && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={lastInviteLink}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm"
            />
            <button
              type="button"
              onClick={() => copyLink(lastInviteLink)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-300"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        )}
      </div>

      {/* Pending invitations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-amber-600" />
          Pending invitations
        </h2>
        {invitations.length === 0 ? (
          <p className="text-slate-500 text-sm">No pending invitations.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {invitations.map((inv) => (
              <li key={inv.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="font-medium text-slate-900">{inv.email}</span>
                  <span className="text-slate-500 text-sm ml-2">
                    ({inv.roleSlug.replace("_", " ")}) · expires {formatDate(inv.expiresAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Team members */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-600" />
          Team members
        </h2>
        <ul className="divide-y divide-slate-100">
          {users.map((u) => (
            <li key={u.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-900">{u.fullName}</span>
                <span className="text-slate-500 text-sm ml-2">{u.email}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                {u.roleSlug.replace("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
