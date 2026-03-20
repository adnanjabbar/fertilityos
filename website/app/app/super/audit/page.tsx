import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SuperAuditLogClient from "./SuperAuditLogClient";

export default async function SuperAuditPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "super_admin") {
    redirect("/app/dashboard");
  }
  return <SuperAuditLogClient />;
}
