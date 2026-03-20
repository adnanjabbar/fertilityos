import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SuperPromotionCodesClient from "./SuperPromotionCodesClient";

export default async function SuperPromotionCodesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "super_admin") redirect("/app/dashboard");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Checkout promo codes</h1>
        <p className="text-slate-600 mt-1">
          Create Stripe-backed discount codes for clinic subscription checkout (marketing campaigns).
          Clinics enter the code on the Billing page before starting Checkout.
        </p>
      </div>
      <SuperPromotionCodesClient />
    </div>
  );
}
