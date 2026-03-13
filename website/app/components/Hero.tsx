import { ArrowRight, CheckCircle } from "lucide-react";

const highlights = [
  "Purpose-built for fertility clinics",
  "IVF lab & embryology workflows",
  "Multi-tenant, white-label ready",
  "HIPAA-compliant architecture",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-32 pb-24 sm:pt-40 sm:pb-32">
      {/* Background gradient decoration */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-blue-50 opacity-60 blur-3xl" />
        <div className="absolute top-60 -left-40 w-[500px] h-[500px] rounded-full bg-pink-50 opacity-50 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-teal-50 opacity-40 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Now accepting early access applications
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
            The Operating System
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-teal-600 to-pink-500">
              for Fertility Care
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-slate-600 leading-relaxed mb-10 max-w-3xl mx-auto">
            FertilityOS is the world&apos;s first comprehensive platform built
            specifically for fertility clinics and reproductive health centers.
            Manage every step — from patient intake to embryo transfer — in one
            place.
          </p>

          {/* Highlight bullets */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-12">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-center gap-1.5 text-sm text-slate-700"
              >
                <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#waitlist"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-700 text-white font-bold text-lg hover:bg-blue-800 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
            >
              Get Early Access
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#modules"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-bold text-lg hover:border-blue-300 hover:text-blue-700 transition-all"
            >
              Explore Modules
            </a>
          </div>
        </div>

        {/* Product illustration / mockup placeholder */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-200 border border-slate-200">
            {/* Browser chrome */}
            <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-3 py-1.5 text-xs text-slate-400 font-mono">
                  app.fertilityo.com / dashboard
                </div>
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="bg-slate-50 p-6 min-h-[360px]">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Active Patients", value: "247", color: "blue" },
                  { label: "IVF Cycles Today", value: "12", color: "teal" },
                  { label: "Embryos in Culture", value: "38", color: "pink" },
                  { label: "Appointments Today", value: "31", color: "purple" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
                  >
                    <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                    <p
                      className={`text-2xl font-bold ${
                        stat.color === "blue"
                          ? "text-blue-700"
                          : stat.color === "teal"
                          ? "text-teal-600"
                          : stat.color === "pink"
                          ? "text-pink-500"
                          : "text-purple-600"
                      }`}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    IVF Cycle Overview — March 2026
                  </p>
                  <div className="flex items-end gap-2 h-24">
                    {[65, 80, 45, 90, 70, 55, 85, 60, 75, 95, 50, 70].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-gradient-to-t from-blue-600 to-blue-400 opacity-80"
                          style={{ height: `${h}%` }}
                        />
                      )
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    Today&apos;s Schedule
                  </p>
                  <div className="space-y-2">
                    {[
                      { time: "09:00", name: "Sarah M.", type: "Retrieval" },
                      { time: "10:30", name: "Emma K.", type: "Consultation" },
                      { time: "14:00", name: "Aisha R.", type: "Transfer" },
                    ].map((appt) => (
                      <div
                        key={appt.time}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="text-slate-400 w-10 shrink-0">
                          {appt.time}
                        </span>
                        <span className="font-medium text-slate-700 flex-1">
                          {appt.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                          {appt.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-400 mb-6 uppercase tracking-wider font-medium">
            Trusted by fertility specialists worldwide
          </p>
          <div className="flex items-center justify-center gap-10 flex-wrap">
            {[
              "Advanced Fertility Center",
              "ReproMed Institute",
              "IVF Solutions",
              "BabyHope Clinic",
              "FertileLife Center",
            ].map((name) => (
              <span
                key={name}
                className="text-slate-300 font-semibold text-sm tracking-tight"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
