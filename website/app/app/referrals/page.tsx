import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ReferralsClient from "./ReferralsClient";

export default async function ReferralsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") {
    redirect("/app/dashboard");
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Referrals</h1>
      <p className="text-slate-600 mb-8">
        Share referral links with other clinics. When someone registers using your link, their signup is attributed to your code.
      </p>
      <ReferralsClient />
    </div>
  );
}
