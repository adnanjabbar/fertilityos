import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TeamClient from "./TeamClient";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") {
    redirect("/app/dashboard");
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Team</h1>
      <p className="text-slate-600 mb-8">
        Invite staff and manage roles. Share the invite link with new users.
      </p>
      <TeamClient />
    </div>
  );
}
