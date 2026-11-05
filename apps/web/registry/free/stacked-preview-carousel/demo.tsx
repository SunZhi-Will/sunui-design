"use client";

import { StackedPreviewCarousel, type StackedPreviewItem } from "./stacked-preview-carousel";

// 示意封面：投影片風格的漸層與色塊，代替課程截圖
function SlideArt({ from, to, label }: { from: string; to: string; label: string }) {
  return (
    <svg viewBox="0 0 160 90" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`g-${label}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="160" height="90" fill={`url(#g-${label})`} />
      <circle cx="128" cy="22" r="34" fill="#fff" opacity="0.08" />
      <rect x="12" y="14" width="22" height="3" rx="1.5" fill="#fff" opacity="0.7" />
      <rect x="12" y="24" width="78" height="8" rx="2" fill="#fff" opacity="0.92" />
      <rect x="12" y="36" width="56" height="8" rx="2" fill="#fff" opacity="0.92" />
      <rect x="12" y="56" width="64" height="2.5" rx="1.25" fill="#fff" opacity="0.45" />
      <rect x="12" y="62" width="48" height="2.5" rx="1.25" fill="#fff" opacity="0.45" />
      <rect x="96" y="48" width="50" height="30" rx="4" fill="#000" opacity="0.25" />
      <rect x="102" y="54" width="22" height="3" rx="1.5" fill="#fff" opacity="0.6" />
      <rect x="102" y="61" width="36" height="2.5" rx="1.25" fill="#fff" opacity="0.35" />
    </svg>
  );
}

const items: StackedPreviewItem[] = [
  { key: "prompt", subtitle: "Free course", title: "Prompt design basics in AI Studio", cover: <SlideArt from="#1e3a8a" to="#7c3aed" label="prompt" /> },
  { key: "vision", subtitle: "Workshop", title: "Build a vision app with Gemini in one afternoon", cover: <SlideArt from="#0f766e" to="#0ea5e9" label="vision" /> },
  { key: "agents", subtitle: "Live session", title: "From chat to agents: tools, memory and evals", cover: <SlideArt from="#9a3412" to="#f59e0b" label="agents" /> },
  { key: "deploy", subtitle: "Free course", title: "Ship your prototype to the web", cover: <SlideArt from="#831843" to="#db2777" label="deploy" /> },
];

export default function StackedPreviewCarouselDemo() {
  return (
    <section
      className="grid w-full grid-cols-1 items-center gap-10 overflow-hidden rounded-2xl px-6 py-10 text-white md:grid-cols-2 md:px-10"
      style={{ background: "radial-gradient(120% 85% at 76% 6%, rgba(245,192,69,0.16), transparent 56%), linear-gradient(180deg, #0d0d11 0%, #08080b 100%)" }}
    >
      <div className="min-w-0">
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#F5C045]">AI Studio Academy</p>
        <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">Learn to build with AI, one short course at a time.</h1>
        <p className="mt-3 text-sm text-white/60">Slides, handouts and live sessions, all free to start.</p>
      </div>
      <div className="min-w-0 pb-6 pr-4">
        <StackedPreviewCarousel items={items} />
      </div>
    </section>
  );
}
