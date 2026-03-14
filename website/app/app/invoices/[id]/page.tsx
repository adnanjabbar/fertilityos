import { auth } from "@/auth";
import { redirect } from "next/navigation";
import InvoiceDetailClient from "./InvoiceDetailClient";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  return (
    <div className="space-y-6">
      <InvoiceDetailClient invoiceId={id} />
    </div>
  );
}
