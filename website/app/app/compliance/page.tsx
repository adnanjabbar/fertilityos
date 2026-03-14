import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ComplianceClient from "./ComplianceClient";
import { COMPLIANCE_CHECKLIST } from "@/lib/compliance-checklist";

export default async function CompliancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") {
    redirect("/app/dashboard");
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
        Compliance checklist
      </h1>
      <p className="text-slate-600 mb-8">
        HIPAA-style controls and how FertilityOS implements them. Read-only
        reference for admins. Full documentation:{" "}
        <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded">
          System-Architecture/Compliance/hipaa-checklist.md
        </code>{" "}
        in the repository.
      </p>
      <ComplianceClient sections={COMPLIANCE_CHECKLIST} />
    </div>
  );
}
