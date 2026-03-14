import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AppointmentsClient from "./AppointmentsClient";

export default async function AppointmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
      <AppointmentsClient />
    </div>
  );
}
