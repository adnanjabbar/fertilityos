import Link from "next/link";
import { signOut } from "@/auth";
import { User, Calendar, FileText, LayoutDashboard, LogOut } from "lucide-react";

export default function PortalAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/portal" className="font-bold text-slate-900 text-lg">
            Patient Portal
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/portal"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/portal/profile"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm"
            >
              <User className="w-4 h-4" />
              My profile
            </Link>
            <Link
              href="/portal/appointments"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm"
            >
              <Calendar className="w-4 h-4" />
              Appointments
            </Link>
            <Link
              href="/portal/invoices"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm"
            >
              <FileText className="w-4 h-4" />
              Invoices
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/portal/login" });
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
