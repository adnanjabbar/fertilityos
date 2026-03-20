"use client";

import { Activity } from "lucide-react";

/**
 * 9:16 vertical storyboard (~9s loop) for marketing.
 * Record at high DPR or use browser zoom + screen capture for 2K–4K exports.
 */
export default function FertilityOSStoryReel({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative mx-auto overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl ${className}`}
      style={{ aspectRatio: "9 / 16", maxHeight: "min(92vh, 920px)" }}
      role="img"
      aria-label="The Fertility OS product story animation"
    >
      <div
        className="absolute inset-0 opacity-90 reel-bg-drift"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(59,130,246,0.38), transparent), radial-gradient(ellipse 70% 50% at 82% 62%, rgba(236,72,153,0.22), transparent), linear-gradient(165deg, #020617 0%, #0f172a 42%, #042f2e 100%)",
        }}
      />

      <div className="absolute inset-0 reel-chapters">
        <div className="reel-chapter flex flex-col justify-center gap-3 p-[6%] text-white">
          <p className="text-[clamp(0.65rem,2.8vw,0.85rem)] font-bold uppercase tracking-[0.2em] text-cyan-300/90">
            One platform
          </p>
          <h2 className="text-[clamp(1.35rem,6vw,2.25rem)] font-black leading-tight">
            Patients · Lab · Billing · Compliance
          </h2>
          <p className="text-[clamp(0.8rem,3.2vw,1rem)] text-white/75 leading-snug max-w-[95%]">
            Orchestrate the full fertility journey with a single, secure operating system built for real
            clinics.
          </p>
        </div>

        <div className="reel-chapter flex flex-col justify-center gap-3 p-[6%] text-white">
          <div className="flex flex-wrap gap-2">
            {["EMR", "IVF lab", "Scheduling", "Portal"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[clamp(0.65rem,2.5vw,0.8rem)] font-semibold text-white/90"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-[clamp(0.85rem,3.4vw,1.05rem)] font-semibold text-teal-200">
            Built by clinicians. Ready for scale.
          </p>
        </div>

        <div className="reel-chapter flex flex-col items-center justify-center gap-4 p-[6%] text-center text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-pink-500 shadow-lg shadow-pink-500/30 ring-2 ring-white/20">
            <Activity className="h-9 w-9 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[clamp(1.5rem,7vw,2.5rem)] font-black tracking-tight">
              The Fertility{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-400">OS</span>
            </p>
            <p className="reel-tagline-shimmer mt-2 text-[clamp(0.75rem,3vw,0.95rem)] font-semibold max-w-[24ch] mx-auto leading-snug">
              The Fertility Services Management System You Need
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
