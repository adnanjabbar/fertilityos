import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SuperDashboardClient from "./SuperDashboardClient";

export default async function SuperDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "super_admin") {
    redirect("/app/dashboard");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Super Dashboard
        </h1>
        <p className="text-slate-600 mt-1">
          Platform-wide overview: clinics, users, modules, and deployments. Owner &amp; research view.
        </p>
      </div>
      <SuperDashboardClient />
    </div>
  );
}
