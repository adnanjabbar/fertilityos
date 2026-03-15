import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LetterheadClient from "./LetterheadClient";

export default async function LetterheadSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") {
    redirect("/app/dashboard");
  }

  return <LetterheadClient />;
}
