import { Activity } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Modules", href: "#modules" },
    { label: "Pricing", href: "#pricing" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Roadmap", href: "#" },
  ],
  Company: [
    { label: "About", href: "#about" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#waitlist" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "HIPAA Policy", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
  Support: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Status Page", href: "#" },
    { label: "Help Center", href: "#" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600">
                <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                Fertility<span className="text-teal-400">OS</span>
              </span>
            </a>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              The world&apos;s first operating system for fertility clinics and
              reproductive health centers.
            </p>
            <p className="text-slate-500 text-xs">
              Built by a Fertility Specialist.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-slate-400 text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Compliance badges */}
        <div className="flex flex-wrap gap-3 mb-10">
          {["HIPAA Ready", "GDPR Compliant", "SSL Secured", "SOC 2 (Planned)"].map(
            (badge) => (
              <span
                key={badge}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-medium"
              >
                {badge}
              </span>
            )
          )}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {year} FertilityOS. All rights reserved.
          </p>
          <p className="text-slate-600 text-xs">
            Designed for clinicians. Built for scale. Powered by the cloud.
          </p>
        </div>
      </div>
    </footer>
  );
}
