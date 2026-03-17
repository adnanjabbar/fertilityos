"use client";

import { useState } from "react";

export default function DataPrivacyBlock() {
  const [exportStatus, setExportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [exportMessage, setExportMessage] = useState("");
  const [deletionStatus, setDeletionStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [deletionMessage, setDeletionMessage] = useState("");

  const handleExport = async () => {
    setExportStatus("loading");
    setExportMessage("");
    try {
      const res = await fetch("/api/portal/export-my-data", { method: "GET" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setExportStatus("error");
        setExportMessage(data.error ?? "Export failed. Please try again.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/i);
      const filename = filenameMatch?.[1]?.trim() ?? "my-data-export.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus("success");
      setExportMessage("Download started.");
    } catch {
      setExportStatus("error");
      setExportMessage("Something went wrong. Please try again.");
    }
  };

  const handleRequestDeletion = async () => {
    setDeletionStatus("loading");
    setDeletionMessage("");
    try {
      const res = await fetch("/api/portal/request-deletion", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeletionStatus("error");
        setDeletionMessage(data.error ?? "Request failed. Please try again.");
        return;
      }
      setDeletionStatus("success");
      setDeletionMessage(data.message ?? "Your request has been recorded. The clinic will process it and contact you if needed.");
    } catch {
      setDeletionStatus("error");
      setDeletionMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Data & privacy</h2>
        <p className="text-sm text-slate-600 mb-4">
          You can export a copy of your data or request account deletion. The clinic will process deletion requests and contact you if needed.
        </p>

        <div className="space-y-4">
          <div>
            {exportMessage && (
              <p className={`text-sm mb-2 ${exportStatus === "error" ? "text-red-600" : "text-slate-600"}`}>
                {exportMessage}
              </p>
            )}
            <button
              type="button"
              onClick={handleExport}
              disabled={exportStatus === "loading"}
              className="py-2 px-4 rounded-xl bg-slate-100 text-slate-800 font-medium hover:bg-slate-200 disabled:opacity-60"
            >
              {exportStatus === "loading" ? "Preparing…" : "Export my data"}
            </button>
          </div>

          <div>
            {deletionMessage && (
              <p className={`text-sm mb-2 ${deletionStatus === "error" ? "text-red-600" : "text-slate-600"}`}>
                {deletionMessage}
              </p>
            )}
            <button
              type="button"
              onClick={handleRequestDeletion}
              disabled={deletionStatus === "loading"}
              className="py-2 px-4 rounded-xl bg-slate-100 text-slate-800 font-medium hover:bg-slate-200 disabled:opacity-60"
            >
              {deletionStatus === "loading" ? "Submitting…" : "Request account deletion"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
