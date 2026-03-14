import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/auth";
import { Activity, LogOut, LayoutDashboard } from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/app/dashboard" className="flex items-center gap-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-700">
                  <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-xl text-slate-900 tracking-tight">
                  Fertility<span className="text-teal-600">OS</span>
                </span>
              </Link>
              <nav className="hidden sm:flex items-center gap-4">
                <Link
                  href="/app/dashboard"
                  className="text-sm font-medium text-slate-600 hover:text-blue-700"
                >
                  Dashboard
                </Link>
                {session.user.roleSlug === "admin" && (
                  <Link
                    href="/app/team"
                    className="text-sm font-medium text-slate-600 hover:text-blue-700"
                  >
                    Team
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 hidden sm:block">
                <span className="font-medium text-slate-900">
                  {session.user.tenantName ?? "Clinic"}
                </span>
                {" · "}
                {session.user.name}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
