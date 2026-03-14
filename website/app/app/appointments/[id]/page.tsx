import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AppointmentDetailClient from "./AppointmentDetailClient";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  return (
    <div className="space-y-6">
      <AppointmentDetailClient appointmentId={id} />
    </div>
  );
}
