import { auth } from "@/auth";
import { redirect } from "next/navigation";
import InvoicesClient from "./InvoicesClient";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
      <InvoicesClient />
    </div>
  );
}
