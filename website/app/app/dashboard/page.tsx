import { auth } from "@/auth";
import { Users, Calendar, FileText, FlaskConical, UserPlus, BarChart3, Package } from "lucide-react";
import Link from "next/link";
import LowStockCard from "./LowStockCard";

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.roleSlug === "admin";

  const cards = [
    { title: "Patients", description: "Manage patient records and demographics", icon: Users, href: "/app/patients" },
    { title: "Appointments", description: "Scheduling and calendar", icon: Calendar, href: "/app/appointments" },
    { title: "Clinical notes", description: "EMR and SOAP notes (from patient)", icon: FileText, href: "/app/patients" },
    { title: "IVF Lab", description: "Cycles and embryos (from patient)", icon: FlaskConical, href: "/app/patients" },
    { title: "Reports", description: "Analytics and overview", icon: BarChart3, href: "/app/reports" },
    ...(isAdmin
      ? [
          { title: "Inventory", description: "Lab consumables and stock", icon: Package, href: "/app/inventory" },
          { title: "Team", description: "Invite staff and manage roles", icon: UserPlus, href: "/app/team" },
        ]
      : []),
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Dashboard
        </h1>
        <p className="text-slate-600 mt-1">
          Welcome back, {session?.user?.name}. Your clinic{" "}
          <span className="font-semibold text-slate-900">
            {session?.user?.tenantName ?? "Clinic"}
          </span>{" "}
          is set up.
        </p>
      </div>

      <div className="mb-6">
        <LowStockCard />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-blue-700" />
              </div>
              <h2 className="font-bold text-slate-900">{item.title}</h2>
              <p className="text-sm text-slate-600 mt-1">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
