import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re offline</h1>
      <p className="text-slate-600 mb-6 text-center max-w-sm">
        This page wasn&apos;t cached. Connect to the internet and try again, or go back to the dashboard.
      </p>
      <Link
        href="/app/dashboard"
        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
      >
        Dashboard
      </Link>
    </div>
  );
}
