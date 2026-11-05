"use client";

import { HeroBillboardCarousel, type HeroBillboardSlide } from "./hero-billboard-carousel";

// 示意封面：活動主視覺風格的漸層與幾何光斑，代替真實海報
function PosterArt({ from, to, id }: { from: string; to: string; id: string }) {
  return (
    <svg viewBox="0 0 160 90" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`hb-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="160" height="90" fill={`url(#hb-${id})`} />
      <circle cx="122" cy="30" r="40" fill="#fff" opacity="0.1" />
      <circle cx="140" cy="70" r="22" fill="#000" opacity="0.18" />
      <path d="M0 72 C40 56 80 88 160 64 L160 90 L0 90 Z" fill="#000" opacity="0.22" />
    </svg>
  );
}

const slides: HeroBillboardSlide[] = [
  { key: "live", title: "Build your first Gemini agent, live", subtitle: "Free live session", overlayTitle: true, overlayColor: "#F5C045", cover: <PosterArt from="#3b0764" to="#c026d3" id="live" />, accentFrom: "#3b0764", accentTo: "#c026d3", badge: "Open", eyebrow: "Free live session", meta: "Wed, Oct 28, 8:30 to 10:30 PM", price: "Free", cta: "Register free", href: "#live" },
  { key: "prompt", title: "Prompt design basics in AI Studio", subtitle: "Free course", overlayTitle: true, overlayColor: "#7dd3fc", cover: <PosterArt from="#0c4a6e" to="#0ea5e9" id="prompt" />, accentFrom: "#0c4a6e", accentTo: "#0ea5e9", eyebrow: "Free course", meta: "6 lessons, 45 min", price: "Free", cta: "Start free", href: "#prompt" },
  { key: "vision", title: "Vision apps workshop: from photo to product", subtitle: "Workshop", overlayTitle: true, overlayColor: "#fdba74", cover: <PosterArt from="#7c2d12" to="#f59e0b" id="vision" />, accentFrom: "#7c2d12", accentTo: "#f59e0b", eyebrow: "Workshop", meta: "3 hours, hands-on", price: "$49", cta: "View course", href: "#vision" },
  { key: "deploy", title: "Ship your prototype to the web", subtitle: "Free course", overlayTitle: true, overlayColor: "#86efac", cover: <PosterArt from="#064e3b" to="#10b981" id="deploy" />, accentFrom: "#064e3b", accentTo: "#10b981", eyebrow: "Free course", meta: "4 lessons, 30 min", price: "Free", cta: "Start free", href: "#deploy" },
];

export default function HeroBillboardCarouselDemo() {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl">
      <HeroBillboardCarousel
        items={slides}
        intro={
          <>
            <h1 className="text-xl font-black md:text-2xl">Learn to build with AI</h1>
            <a href="#courses" className="text-[14px] font-bold text-white/60 no-underline underline-offset-4 hover:underline">
              Browse all courses →
            </a>
          </>
        }
      />
    </div>
  );
}
