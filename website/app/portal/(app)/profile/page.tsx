import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { eq } from "drizzle-orm";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default async function PortalProfilePage() {
  const session = await auth();
  if (!session?.user?.patientId) {
    redirect("/portal/login");
  }

  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, session.user.patientId))
    .limit(1);

  if (!patient) {
    return (
      <div>
        <p className="text-red-600">Profile not found.</p>
      </div>
    );
  }

  const fields = [
    { label: "First name", value: patient.firstName },
    { label: "Last name", value: patient.lastName },
    { label: "Date of birth", value: formatDate(patient.dateOfBirth) },
    { label: "Email", value: patient.email ?? "—" },
    { label: "Phone", value: patient.phone ?? "—" },
    { label: "Address", value: patient.address ?? "—" },
    { label: "City", value: patient.city ?? "—" },
    { label: "State", value: patient.state ?? "—" },
    { label: "Country", value: patient.country ?? "—" },
    { label: "Postal code", value: patient.postalCode ?? "—" },
    { label: "Gender", value: patient.gender ?? "—" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My profile</h1>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <dl className="divide-y divide-slate-200">
          {fields.map(({ label, value }) => (
            <div key={label} className="px-6 py-4 flex flex-col sm:flex-row sm:gap-4">
              <dt className="text-sm font-medium text-slate-500 sm:w-40">{label}</dt>
              <dd className="mt-0.5 sm:mt-0 text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="text-sm text-slate-500 mt-4">To update your details, please contact your clinic.</p>
    </div>
  );
}
