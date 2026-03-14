import { auth } from "@/auth";
import { Users, Calendar, FileText, FlaskConical, UserPlus } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.roleSlug === "admin";

  const cards = [
    ...(isAdmin
      ? [
          {
            title: "Team",
            description: "Invite staff and manage roles",
            icon: UserPlus,
            href: "/app/team",
            comingSoon: false,
          },
        ]
      : []),
    {
      title: "Patients",
      description: "Manage patient records and demographics",
      icon: Users,
      href: "#",
      comingSoon: true,
    },
    {
      title: "Scheduling",
      description: "Appointments and calendar",
      icon: Calendar,
      href: "#",
      comingSoon: true,
    },
    {
      title: "Clinical notes",
      description: "EMR and SOAP notes",
      icon: FileText,
      href: "#",
      comingSoon: true,
    },
    {
      title: "IVF Lab",
      description: "Cycles, embryos, and lab workflows",
      icon: FlaskConical,
      href: "#",
      comingSoon: true,
    },
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
          is set up. Core modules will appear here as we build them.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className={`block bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-all ${
                item.comingSoon
                  ? "opacity-75 cursor-default pointer-events-none"
                  : "hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-blue-700" />
              </div>
              <h2 className="font-bold text-slate-900">{item.title}</h2>
              <p className="text-sm text-slate-600 mt-1">{item.description}</p>
              {item.comingSoon && (
                <span className="inline-block mt-3 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                  Coming in Phase 3
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
        <h2 className="font-bold text-blue-900 mb-2">What’s next?</h2>
        <p className="text-blue-800 text-sm">
          {isAdmin
            ? "Use Team to invite staff. Phase 3 will add Patient Management, Scheduling, EMR, IVF Lab, and Billing."
            : "Phase 3 will add Patient Management, Scheduling, EMR, IVF Lab, and Billing. Stay tuned."}
        </p>
      </div>
    </div>
  );
}
