"use client";

import { TiltedMarqueeBackground } from "./tilted-marquee-background";

// 沒有圖片時沿用原站封面磚的漸層畫法：兩顆模糊光球加漸層標題
const COURSES = [
  { title: "Prompt Craft Basics", sub: "Starter", from: "#da7756", to: "#f4c7a1" },
  { title: "Agents in Practice", sub: "Workshop", from: "#6366f1", to: "#a5b4fc" },
  { title: "Vibe Coding a Landing Page", sub: "Hands-on", from: "#10b981", to: "#a7f3d0" },
  { title: "Data Stories with AI", sub: "Analytics", from: "#f59e0b", to: "#fde68a" },
  { title: "Voice and Video Tools", sub: "Creator", from: "#ec4899", to: "#fbcfe8" },
  { title: "Automate Your Week", sub: "Productivity", from: "#0ea5e9", to: "#bae6fd" },
];

const covers = COURSES.map((c) => ({
  key: c.title,
  content: (
    <>
      <div className="absolute" style={{ top: "-25%", right: "-12%", width: "60%", paddingTop: "60%", borderRadius: "50%", background: `radial-gradient(circle, ${c.from}66 0%, transparent 65%)`, filter: "blur(28px)" }} />
      <div className="absolute" style={{ bottom: "-25%", left: "-12%", width: "45%", paddingTop: "45%", borderRadius: "50%", background: `radial-gradient(circle, ${c.to}4d 0%, transparent 65%)`, filter: "blur(24px)" }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
        <div className="mb-1.5 text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: c.from, opacity: 0.9 }}>{c.sub}</div>
        <div className="text-[19px] leading-tight font-black" style={{ background: `linear-gradient(135deg, #fff 0%, ${c.to} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{c.title}</div>
      </div>
    </>
  ),
}));

export default function TiltedMarqueeBackgroundDemo() {
  return (
    <section className="relative flex min-h-[30rem] w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl bg-black px-5 py-16">
      <TiltedMarqueeBackground covers={covers} />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]" style={{ background: "radial-gradient(ellipse 70% 56% at 50% 42%, rgba(0,0,0,0.65) 0%, transparent 68%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]" style={{ background: "linear-gradient(to bottom, #000, transparent 10%, transparent 90%, #000)" }} />
      <div className="relative z-10 mx-auto max-w-md min-w-0 text-center">
        <h1 className="mb-3 text-[28px] leading-tight font-black text-white/95 sm:text-[32px]">
          Every course, one membership
        </h1>
        <p className="mb-6 text-[15px] leading-relaxed text-white/60">
          Unlock every paid course, replays and handouts, plus everything we publish next.
        </p>
        <a href="#" className="inline-flex rounded-xl bg-[#E0A100] px-6 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90">
          Become a member
        </a>
      </div>
    </section>
  );
}
