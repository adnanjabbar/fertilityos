import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PatientDetailClient from "./PatientDetailClient";

const CUSTOM_DIAGNOSIS_ALLOWED_ROLES = ["admin", "doctor", "nurse"] as const;

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { patientId } = await params;
  const canAddCustomDiagnosis = CUSTOM_DIAGNOSIS_ALLOWED_ROLES.includes(
    session.user.roleSlug as (typeof CUSTOM_DIAGNOSIS_ALLOWED_ROLES)[number]
  );

  return (
    <div>
      <PatientDetailClient
        patientId={patientId}
        canAddCustomDiagnosis={canAddCustomDiagnosis}
      />
    </div>
  );
}
