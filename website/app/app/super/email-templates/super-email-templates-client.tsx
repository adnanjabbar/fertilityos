"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { extractPlaceholderKeys } from "@/lib/platform-email-template-test-vars";

type Template = {
  id: string;
  templateKey: string;
  name: string;
  subject: string;
  html: string;
  text: string | null;
  updatedAt: string;
};

/** Seeded when missing — keys must match `templateKeySchema` on the API. */
const DEFAULT_LIBRARY: Array<{
  templateKey: string;
  name: string;
  subject: string;
  html: string;
  text: string;
}> = [
  {
    templateKey: "staff_forgot_password",
    name: "Staff/Admin — Forgot password",
    subject: "Reset your {{brandName}} password",
    html: `
<div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #f8fafc; padding: 28px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
    <div style="padding: 18px 20px; background: linear-gradient(135deg, #2563eb 0%, #14b8a6 100%); color: #fff;">
      <div style="font-weight: 800; font-size: 18px; letter-spacing: -0.01em;">{{brandName}}</div>
      <div style="opacity: 0.95; font-size: 13px; margin-top: 2px;">Password reset</div>
    </div>
    <div style="padding: 22px 20px; color: #0f172a;">
      <h1 style="margin: 0 0 10px; font-size: 20px; line-height: 1.2;">Reset your password</h1>
      <p style="margin: 0 0 14px; color: #334155; font-size: 14px; line-height: 1.6;">
        Hi {{name}}, click the button below to set a new password for your {{brandName}} account. This link expires in 1 hour.
      </p>
      <p style="margin: 18px 0;">
        <a href="{{resetUrl}}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 16px; border-radius: 12px;">
          Set new password
        </a>
      </p>
      <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.6;">
        Or copy and paste this link:<br />
        <span style="color: #2563eb;">{{resetUrl}}</span>
      </p>
    </div>
    <div style="padding: 14px 20px; background: #f1f5f9; color: #475569; font-size: 12px; line-height: 1.6;">
      If you didn’t request this, you can ignore this email.
      <div style="margin-top: 8px; font-weight: 700; color: #0f172a;">TheFertilityOS</div>
    </div>
  </div>
</div>
  `.trim(),
    text:
      "Hi {{name}},\n\nReset your {{brandName}} password using this link:\n{{resetUrl}}\n\nThis link expires in 1 hour.\n\n— TheFertilityOS",
  },
  {
    templateKey: "clinic_register_verification",
    name: "Customer — Clinic registration verification",
    subject: "Your {{brandName}} verification code",
    html: `
<div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p style="margin: 0 0 12px; color: #0f172a; font-size: 16px;">Your verification code is:</p>
  <p style="margin: 0 0 16px; font-size: 28px; font-weight: 800; letter-spacing: 0.08em; color: #2563eb;">{{code}}</p>
  <p style="margin: 0; color: #64748b; font-size: 14px;">It expires in {{expiresMinutes}} minutes. If you didn’t request this, you can ignore this email.</p>
  <p style="margin: 20px 0 0; color: #94a3b8; font-size: 12px;">— {{brandName}}</p>
</div>
  `.trim(),
    text: "Your {{brandName}} verification code is {{code}}. It expires in {{expiresMinutes}} minutes.",
  },
  {
    templateKey: "customer_welcome",
    name: "Customer — Welcome",
    subject: "Welcome to {{brandName}}, {{name}}",
    html: `
<div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">Welcome, {{name}}</h1>
  <p style="margin: 0 0 12px; color: #334155; font-size: 15px; line-height: 1.6;">Thanks for joining {{brandName}}. You can sign in anytime with the email you used to register.</p>
  <p style="margin: 0;"><a href="{{verifyUrl}}" style="color: #2563eb; font-weight: 600;">Confirm your email</a></p>
</div>
  `.trim(),
    text: "Welcome to {{brandName}}, {{name}}.\n\nConfirm your email: {{verifyUrl}}",
  },
  {
    templateKey: "appointment_reminder",
    name: "Customer — Appointment reminder",
    subject: "{{subjectLine}}",
    html: `
<div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p style="margin: 0 0 8px; font-weight: 700; color: #0f172a;">Hi {{patientName}},</p>
  <p style="margin: 0 0 12px; color: #334155;">This is a reminder about your <strong>{{appointmentType}}</strong> at <strong>{{clinicName}}</strong>.</p>
  <p style="margin: 0 0 16px; font-size: 16px; color: #2563eb; font-weight: 700;">{{appointmentDate}}</p>
  <p style="margin: 0;"><a href="{{detailsUrl}}" style="color: #2563eb;">View details</a></p>
</div>
  `.trim(),
    text: "Reminder: {{appointmentType}} at {{clinicName}} on {{appointmentDate}}. Details: {{detailsUrl}}",
  },
  {
    templateKey: "invoice_receipt",
    name: "Customer — Invoice / receipt",
    subject: "Receipt {{invoiceNumber}} — {{brandName}}",
    html: `
<div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p style="margin: 0 0 8px; color: #0f172a;">Hi {{name}},</p>
  <p style="margin: 0 0 12px; color: #334155;">Thank you for your payment of <strong>{{amount}}</strong> (invoice {{invoiceNumber}}).</p>
  <p style="margin: 0;"><a href="{{detailsUrl}}" style="color: #2563eb;">View invoice</a></p>
</div>
  `.trim(),
    text: "Payment {{amount}} received for invoice {{invoiceNumber}}. {{detailsUrl}}",
  },
];

const NEW_TEMPLATE_KEY_REGEX = /^[a-z][a-z0-9_]{0,63}$/;

export default function SuperEmailTemplatesClient() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const selected = useMemo(
    () => templates.find((t) => t.templateKey === selectedKey) ?? null,
    [templates, selectedKey]
  );

  const placeholderHints = useMemo(
    () => extractPlaceholderKeys(subject, html, text),
    [subject, html, text]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/app/super/email-templates");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load templates");
      let rows: Template[] = data.templates ?? [];

      for (const def of DEFAULT_LIBRARY) {
        if (!rows.some((t) => t.templateKey === def.templateKey)) {
          const put = await fetch("/api/app/super/email-templates", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(def),
          });
          if (!put.ok) {
            const err = await put.json().catch(() => ({}));
            console.warn("Seed template failed", def.templateKey, err);
          }
        }
      }

      const again = await fetch("/api/app/super/email-templates");
      const againData = await again.json().catch(() => ({}));
      if (again.ok) rows = againData.templates ?? rows;
      setTemplates(rows);

      setSelectedKey((prev) => {
        if (prev && rows.some((r) => r.templateKey === prev)) return prev;
        return rows[0]?.templateKey ?? "";
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    setName(selected.name);
    setSubject(selected.subject);
    setHtml(selected.html);
    setText(selected.text ?? "");
  }, [selected?.id, selected?.templateKey]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/app/super/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: selected.templateKey,
          name: name.trim() || selected.name,
          subject,
          html,
          text,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setMessage("Saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!selected) return;
    if (!testTo.trim()) {
      setError("Enter a test recipient email.");
      return;
    }
    setTesting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/app/super/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: selected.templateKey,
          to: testTo.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send test email");
      setMessage("Test email sent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send test email");
    } finally {
      setTesting(false);
    }
  };

  const removeTemplate = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete template "${selected.templateKey}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/app/super/email-templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey: selected.templateKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setMessage("Template deleted.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const submitCreate = async () => {
    const key = newKey.trim().toLowerCase();
    setCreateError(null);
    if (!NEW_TEMPLATE_KEY_REGEX.test(key)) {
      setCreateError("Key: lowercase letter first, then letters, numbers, underscores (max 64).");
      return;
    }
    const label = newName.trim() || key;
    setSaving(true);
    try {
      const res = await fetch("/api/app/super/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: key,
          name: label,
          subject: `Message from {{brandName}}`,
          html: `<p>Hello {{name}},</p>\n<p>Edit this template in Super Admin.</p>`,
          text: "Hello {{name}},\n\nEdit this template in Super Admin.",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create");
      setCreateOpen(false);
      setNewKey("");
      setNewName("");
      setSelectedKey(key);
      await load();
      setMessage("Template created.");
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-600">Loading templates…</div>;
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-semibold">{loadError}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 px-4 py-2 rounded-xl bg-red-700 text-white text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!templates.length) {
    return (
      <div className="text-slate-600">
        No templates found.{" "}
        <button type="button" className="text-blue-700 underline font-semibold" onClick={() => void load()}>
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="text-sm font-bold text-slate-900 mb-3">Templates</div>
        <select
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
        >
          {templates.map((t) => (
            <option key={t.templateKey} value={t.templateKey}>
              {t.name} ({t.templateKey})
            </option>
          ))}
        </select>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setCreateOpen(true);
              setCreateError(null);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold"
          >
            New template
          </button>
          <button
            type="button"
            onClick={() => void removeTemplate()}
            disabled={!selected || deleting}
            className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm font-semibold disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
        <div className="mt-4 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Placeholders in this template:</span>{" "}
          {placeholderHints.length ? (
            placeholderHints.map((k) => (
              <code key={k} className="mr-1 text-slate-700">
                {`{{${k}}}`}
              </code>
            ))
          ) : (
            <span>None detected — use {"{{name}}"} style in subject/HTML/text.</span>
          )}
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="text-sm font-bold text-slate-900 mb-2">Send test</div>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="to@example.com"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
          />
          <button
            type="button"
            onClick={() => void sendTest()}
            disabled={testing || !selected}
            className="mt-3 w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm disabled:opacity-60"
          >
            {testing ? "Sending…" : "Send test email"}
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        {message && (
          <div className="mb-3 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {selected && (
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-1">Template key</div>
              <div className="text-sm font-mono text-slate-600 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                {selected.templateKey}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-1">Display name</div>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-1">Subject</div>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-1">HTML</div>
              <textarea
                className="w-full min-h-[260px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-1">Text (optional)</div>
              <textarea
                className="w-full min-h-[120px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="w-full px-4 py-3 rounded-xl bg-blue-700 text-white font-bold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save template"}
            </button>
          </div>
        )}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg max-w-md w-full p-5">
            <div className="text-lg font-bold text-slate-900 mb-3">New template</div>
            <p className="text-sm text-slate-600 mb-4">
              Use a unique key (snake_case). You can edit subject and HTML after creation.
            </p>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Template key</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono mb-3"
              placeholder="e.g. lab_results_ready"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
            <label className="block text-sm font-semibold text-slate-700 mb-1">Display name</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mb-3"
              placeholder="Customer — Lab results ready"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            {createError && <div className="text-sm text-red-700 mb-3">{createError}</div>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-800 font-semibold text-sm"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold text-sm disabled:opacity-60"
                disabled={saving}
                onClick={() => void submitCreate()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
