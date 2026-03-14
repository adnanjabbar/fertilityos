import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function formatDateTime(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default async function PortalAppointmentsPage() {
  const session = await auth();
  if (!session?.user?.patientId) {
    redirect("/portal/login");
  }

  const list = await db
    .select({
      id: appointments.id,
      title: appointments.title,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      type: appointments.type,
      status: appointments.status,
    })
    .from(appointments)
    .where(eq(appointments.patientId, session.user.patientId))
    .orderBy(desc(appointments.startAt))
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My appointments</h1>
      {list.length === 0 ? (
        <p className="text-slate-600">You have no appointments on file.</p>
      ) : (
        <div className="space-y-4">
          {list.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold text-slate-900 capitalize">{a.type}</h2>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    a.status === "scheduled"
                      ? "bg-blue-100 text-blue-800"
                      : a.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : a.status === "cancelled"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {a.status}
                </span>
              </div>
              {a.title && <p className="text-slate-600 mt-1">{a.title}</p>}
              <p className="text-sm text-slate-500 mt-2">
                {formatDateTime(a.startAt)} – {formatDateTime(a.endAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
