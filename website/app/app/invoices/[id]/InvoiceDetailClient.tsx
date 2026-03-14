"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";

type InvoiceLine = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
};

type Invoice = {
  id: string;
  patientId: string;
  patientFirstName: string;
  patientLastName: string;
  invoiceNumber: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  totalAmount: string;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lines: InvoiceLine[];
};

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { dateStyle: "medium" });
}

export default function InvoiceDetailClient({ invoiceId }: { invoiceId: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    fetch(`/api/app/invoices/${invoiceId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setInvoice)
      .catch(() => setError("Invoice not found"))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const handleMarkPaid = async () => {
    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/app/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", paidAt: new Date().toISOString() }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
      }
    } finally {
      setMarkingPaid(false);
    }
  };

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (error || !invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error ?? "Invoice not found"}</p>
        <Link href="/app/invoices" className="text-blue-700 hover:underline mt-2 inline-block">Back to invoices</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link href="/app/invoices" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          Invoices
        </Link>
        {invoice.status !== "paid" && (
          <button
            type="button"
            onClick={handleMarkPaid}
            disabled={markingPaid}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-700 text-white font-medium hover:bg-green-800 disabled:opacity-60"
          >
            <CheckCircle className="w-4 h-4" />
            {markingPaid ? "Updating…" : "Mark paid"}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">{invoice.invoiceNumber}</h1>
          <p className="text-slate-600 mt-1">
            <Link href={`/app/patients/${invoice.patientId}`} className="text-blue-700 hover:underline">
              {invoice.patientFirstName} {invoice.patientLastName}
            </Link>
          </p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            <span><span className="text-slate-500">Status:</span> <span className={`font-medium ${invoice.status === "paid" ? "text-green-700" : "text-slate-700"}`}>{invoice.status}</span></span>
            <span><span className="text-slate-500">Due:</span> {formatDate(invoice.dueDate)}</span>
            {invoice.paidAt && <span><span className="text-slate-500">Paid:</span> {formatDate(invoice.paidAt)}</span>}
          </div>
        </div>
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600 font-medium">
                <th className="pb-2">Description</th>
                <th className="pb-2 w-20 text-right">Qty</th>
                <th className="pb-2 w-24 text-right">Unit price</th>
                <th className="pb-2 w-24 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={line.id} className="border-b border-slate-100">
                  <td className="py-2 text-slate-900">{line.description}</td>
                  <td className="py-2 text-right text-slate-600">{line.quantity}</td>
                  <td className="py-2 text-right text-slate-600">{invoice.currency} {line.unitPrice}</td>
                  <td className="py-2 text-right text-slate-900">{invoice.currency} {line.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <p className="text-lg font-bold text-slate-900">Total: {invoice.currency} {invoice.totalAmount}</p>
          </div>
          {invoice.notes && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">Notes</p>
              <p className="text-slate-900 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
