import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DevelopersClient from "./DevelopersClient";

export default async function DevelopersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") {
    redirect("/app/dashboard");
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
        API keys
      </h1>
      <p className="text-slate-600 mb-8">
        Create and manage API keys for programmatic access. Use keys in the
        Authorization header when calling FertilityOS APIs. Store keys securely
        and never share them.
      </p>
      <DevelopersClient />
    </div>
  );
}
