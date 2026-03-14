import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default async function PortalInvoicesPage() {
  const session = await auth();
  if (!session?.user?.patientId) {
    redirect("/portal/login");
  }

  const list = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      totalAmount: invoices.totalAmount,
      currency: invoices.currency,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
    })
    .from(invoices)
    .where(eq(invoices.patientId, session.user.patientId))
    .orderBy(desc(invoices.createdAt))
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My invoices</h1>
      {list.length === 0 ? (
        <p className="text-slate-600">You have no invoices on file.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Number</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Amount</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Due date</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Paid</th>
              </tr>
            </thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-4 text-slate-900 font-medium">{i.invoiceNumber}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {i.currency} {i.totalAmount}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        i.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : i.status === "draft"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{formatDate(i.dueDate)}</td>
                  <td className="px-6 py-4 text-slate-600">{formatDate(i.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-sm text-slate-500 mt-4">To pay an invoice, please contact your clinic.</p>
    </div>
  );
}
