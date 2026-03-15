import { auth } from "@/auth";
import { redirect } from "next/navigation";
import IntegrationsClient from "./IntegrationsClient";

export default async function IntegrationsSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") {
    redirect("/app/dashboard");
  }

  return <IntegrationsClient />;
}
