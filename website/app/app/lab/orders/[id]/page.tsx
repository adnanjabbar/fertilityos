import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LabOrderDetailClient from "./LabOrderDetailClient";

export default async function LabOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allowed =
    session.user.roleSlug === "admin" ||
    session.user.roleSlug === "lab_tech" ||
    session.user.roleSlug === "embryologist" ||
    session.user.roleSlug === "doctor";
  if (!allowed) redirect("/app/dashboard");

  const { id } = await params;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Lab order</h1>
      <LabOrderDetailClient orderId={id} />
    </div>
  );
}
