import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function PortalDashboardPage() {
  const session = await auth();
  if (!session?.user?.patientId) {
    redirect("/portal/login");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
      <p className="text-slate-600 mb-6">
        Welcome, {session.user.name}. Use the links above to view your profile, appointments, and invoices.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <a
          href="/portal/profile"
          className="block p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
        >
          <h2 className="font-bold text-slate-900">My profile</h2>
          <p className="text-sm text-slate-600 mt-1">View your demographics and contact details</p>
        </a>
        <a
          href="/portal/appointments"
          className="block p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
        >
          <h2 className="font-bold text-slate-900">Appointments</h2>
          <p className="text-sm text-slate-600 mt-1">View your upcoming and past appointments</p>
        </a>
        <a
          href="/portal/prescriptions"
          className="block p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
        >
          <h2 className="font-bold text-slate-900">Prescriptions</h2>
          <p className="text-sm text-slate-600 mt-1">View your prescriptions</p>
        </a>
        <a
          href="/portal/invoices"
          className="block p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
        >
          <h2 className="font-bold text-slate-900">Invoices</h2>
          <p className="text-sm text-slate-600 mt-1">View your invoices and payment status</p>
        </a>
      </div>
    </div>
  );
}
