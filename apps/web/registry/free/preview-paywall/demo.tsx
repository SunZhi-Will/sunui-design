"use client";

import { PreviewPaywall } from "./preview-paywall";

export default function PreviewPaywallDemo() {
  return (
    <div className="relative aspect-video w-full max-w-xl min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#111113]">
      {/* 試看到第三張，付費牆蓋在投影片上 */}
      <div className="flex h-full flex-col justify-between p-5 text-white">
        <p className="text-xs text-white/50 tabular-nums">Slide 3 / 24</p>
        <p className="text-lg font-bold sm:text-2xl">Name the format</p>
        <div className="h-1 w-full rounded-full bg-white/10" />
      </div>
      <PreviewPaywall previewCount={3} href="#" />
    </div>
  );
}
