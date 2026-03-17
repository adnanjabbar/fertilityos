import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SecurityReportClient from "./SecurityReportClient";

export default async function SecurityReportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") {
    redirect("/app/dashboard");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Security report</h1>
      <p className="text-sm text-slate-600 max-w-2xl">
        High-level security metrics for this tenant based on recent audit log activity. Use this view
        to monitor sign-ins, OTP usage, and potential lockouts.
      </p>
      <SecurityReportClient />
    </div>
  );
}

