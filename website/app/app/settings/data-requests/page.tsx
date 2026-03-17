import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DataRequestsClient from "./DataRequestsClient";

export default async function DataRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug === "patient") {
    redirect("/app/dashboard");
  }
  if (session.user.roleSlug !== "admin") {
    redirect("/app/dashboard");
  }

  return <DataRequestsClient />;
}
