import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { prescriptions, prescriptionLines, medications, medicationGroups, medicationGroupItems, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default async function PortalPrescriptionsPage() {
  const session = await auth();
  if (!session?.user?.patientId) {
    redirect("/portal/login");
  }

  const list = await db
    .select({
      id: prescriptions.id,
      status: prescriptions.status,
      prescriptionNumber: prescriptions.prescriptionNumber,
      startDate: prescriptions.startDate,
      endDate: prescriptions.endDate,
      notes: prescriptions.notes,
      createdAt: prescriptions.createdAt,
      prescribedByName: users.fullName,
    })
    .from(prescriptions)
    .innerJoin(users, eq(prescriptions.prescribedById, users.id))
    .where(eq(prescriptions.patientId, session.user.patientId))
    .orderBy(desc(prescriptions.createdAt))
    .limit(100);

  const listWithLines = await Promise.all(
    list.map(async (rx) => {
      const lines = await db
        .select({
          id: prescriptionLines.id,
          medicationId: prescriptionLines.medicationId,
          medicationGroupId: prescriptionLines.medicationGroupId,
          quantity: prescriptionLines.quantity,
          durationDays: prescriptionLines.durationDays,
          frequency: prescriptionLines.frequency,
          instructionsOverride: prescriptionLines.instructionsOverride,
        })
        .from(prescriptionLines)
        .where(eq(prescriptionLines.prescriptionId, rx.id));

      const linesWithDetails = await Promise.all(
        lines.map(async (line) => {
          if (line.medicationId) {
            const [med] = await db
              .select({ brandName: medications.brandName, genericName: medications.genericName, dosage: medications.dosage, form: medications.form })
              .from(medications)
              .where(eq(medications.id, line.medicationId))
              .limit(1);
            return { ...line, medication: med ?? null, groupName: null as string | null, groupItems: null };
          }
          if (line.medicationGroupId) {
            const [group] = await db
              .select({ name: medicationGroups.name })
              .from(medicationGroups)
              .where(eq(medicationGroups.id, line.medicationGroupId))
              .limit(1);
            const items = await db
              .select({
                brandName: medications.brandName,
                genericName: medications.genericName,
                dosage: medications.dosage,
                form: medications.form,
              })
              .from(medicationGroupItems)
              .innerJoin(medications, eq(medicationGroupItems.medicationId, medications.id))
              .where(eq(medicationGroupItems.medicationGroupId, line.medicationGroupId))
              .orderBy(medicationGroupItems.sortOrder);
            return { ...line, medication: null, groupName: group?.name ?? null, groupItems: items };
          }
          return { ...line, medication: null, groupName: null, groupItems: null };
        })
      );
      return { ...rx, lines: linesWithDetails };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My prescriptions</h1>
      {listWithLines.length === 0 ? (
        <p className="text-slate-600">You have no prescriptions on file.</p>
      ) : (
        <div className="space-y-4">
          {listWithLines.map((rx) => (
            <div
              key={rx.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-slate-900">
                    {rx.prescriptionNumber ? `Prescription #${rx.prescriptionNumber}` : formatDate(rx.createdAt)}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Prescribed by {rx.prescribedByName} · {formatDate(rx.createdAt)}
                  </p>
                </div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
                    rx.status === "prescribed"
                      ? "bg-amber-100 text-amber-800"
                      : rx.status === "dispensed"
                        ? "bg-blue-100 text-blue-800"
                        : rx.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {rx.status}
                </span>
              </div>
              {(rx.startDate || rx.endDate) && (
                <p className="text-sm text-slate-600 mt-2">
                  {rx.startDate && `Start: ${formatDate(rx.startDate)}`}
                  {rx.startDate && rx.endDate && " · "}
                  {rx.endDate && `End: ${formatDate(rx.endDate)}`}
                </p>
              )}
              <ul className="mt-3 space-y-1">
                {rx.lines.map((line) => (
                  <li key={line.id} className="text-sm text-slate-700">
                    {line.medication
                      ? `${line.medication.brandName} (${line.medication.genericName}) — ${line.medication.dosage} · ${line.quantity} · ${line.frequency ?? "—"}`
                      : line.groupName
                        ? `${line.groupName} · ${line.quantity} · ${line.frequency ?? "—"}`
                        : "—"}
                    {line.instructionsOverride && (
                      <span className="block text-slate-600 mt-0.5">{line.instructionsOverride}</span>
                    )}
                  </li>
                ))}
              </ul>
              {rx.notes && (
                <p className="text-sm text-slate-600 mt-2 border-t border-slate-100 pt-2">{rx.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
