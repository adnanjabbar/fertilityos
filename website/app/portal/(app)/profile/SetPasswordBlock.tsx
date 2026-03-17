"use client";

import { useState } from "react";

export default function SetPasswordBlock() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSendLink = async () => {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/portal/send-set-password-link", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong");
        return;
      }
      setStatus("success");
      setMessage(data.message ?? "Check your email for a link to set your password.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Sign-in with password</h2>
        <p className="text-sm text-slate-600 mb-4">
          You can set a password to sign in with your email and password instead of using a link each time.
        </p>
        {message && (
          <p className={`text-sm mb-4 ${status === "error" ? "text-red-600" : "text-slate-600"}`}>
            {message}
          </p>
        )}
        <button
          type="button"
          onClick={handleSendLink}
          disabled={status === "loading"}
          className="py-2 px-4 rounded-xl bg-slate-100 text-slate-800 font-medium hover:bg-slate-200 disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : "Email me a link to set my password"}
        </button>
      </div>
    </div>
  );
}
