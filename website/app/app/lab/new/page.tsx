import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewLabOrderClient from "./NewLabOrderClient";

export default async function NewLabOrderPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allowed =
    session.user.roleSlug === "admin" ||
    session.user.roleSlug === "lab_tech" ||
    session.user.roleSlug === "embryologist" ||
    session.user.roleSlug === "pathologist" ||
    session.user.roleSlug === "doctor";
  if (!allowed) redirect("/app/dashboard");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">New lab order</h1>
      <NewLabOrderClient />
    </div>
  );
}
