import type { Metadata } from "next";
import FertilityOSStoryReel from "@/app/components/FertilityOSStoryReel";

export const metadata: Metadata = {
  title: "Brand reel — The Fertility OS",
  description: "9:16 motion storyboard for marketing capture.",
  robots: { index: false, follow: false },
};

export default function ReelPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <p className="text-white/50 text-xs mb-4 text-center max-w-md">
        9:16 preview — fullscreen record or high-DPR capture for 2K+ exports. See{" "}
        <code className="text-white/70">docs/MARKETING-VIDEO-SPEC.md</code>.
      </p>
      <FertilityOSStoryReel className="w-full max-w-[420px]" />
    </div>
  );
}
