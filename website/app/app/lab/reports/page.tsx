import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ReportsToApproveClient from "./ReportsToApproveClient";

export default async function LabReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allowed =
    session.user.roleSlug === "admin" || session.user.roleSlug === "pathologist";
  if (!allowed) redirect("/app/dashboard");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reports to approve</h1>
      <p className="text-slate-600">
        Lab orders that have been submitted for final approval. Approve to publish the report.
      </p>
      <ReportsToApproveClient />
    </div>
  );
}
