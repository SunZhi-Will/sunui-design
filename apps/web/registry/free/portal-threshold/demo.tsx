"use client";

import { useDemoText } from "@/lib/demo-locale";

import { PortalThreshold } from "./portal-threshold";

const copy = {
  en: {
    kicker: "Studio in preparation",
    title: "New dimensions, made into places you can enter.",
    lead: "We design interactive worlds, tools and sites where two planes line up into one doorway.",
    focus: "See our focus",
    about: "About us",
  },
  "zh-TW": {
    kicker: "工作室籌備中",
    title: "把新的維度，做成可以走進去的地方。",
    lead: "我們設計互動世界、工具與網站，讓兩個平面對齊成一道門。",
    focus: "看看我們的方向",
    about: "關於我們",
  },
  "zh-CN": {
    kicker: "工作室筹备中",
    title: "把新的维度，做成可以走进去的地方。",
    lead: "我们设计互动世界、工具与网站，让两个平面对齐成一扇门。",
    focus: "了解我们的方向",
    about: "关于我们",
  },
  ja: {
    kicker: "スタジオ準備中",
    title: "新しい次元を、入っていける場所に。",
    lead: "二つの平面が重なって一つの扉になる、インタラクティブな世界やツール、サイトをデザインしています。",
    focus: "私たちの取り組み",
    about: "私たちについて",
  },
};

export default function PortalThresholdDemo() {
  const t = useDemoText(copy);
  return (
    <section
      aria-labelledby="threshold-hero-title"
      className="w-full overflow-hidden rounded-xl px-5 py-12 sm:px-10"
      style={{ background: "#08080a", color: "#f7f5f0" }}
    >
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
        <div className="min-w-0 space-y-6">
          <p className="m-0 font-mono text-xs uppercase tracking-[0.14em]" style={{ color: "#8a8578" }}>
            {t.kicker}
          </p>
          <h1
            id="threshold-hero-title"
            className="m-0 text-4xl font-medium leading-[1.08] tracking-[-0.02em] sm:text-5xl"
          >
            {t.title}
          </h1>
          <p className="m-0 max-w-prose text-base leading-relaxed" style={{ color: "#a8a296" }}>
            {t.lead}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#focus"
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium max-md:w-full"
              style={{ background: "linear-gradient(135deg, #e8c874 0%, #d4af37 45%, #b8912c 100%)", color: "#08080a" }}
            >
              {t.focus}
            </a>
            <a
              href="#about"
              className="inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-medium"
              style={{ borderColor: "rgba(212, 175, 55, 0.34)", color: "#e8d4a0" }}
            >
              {t.about}
            </a>
          </div>
        </div>
        <div className="min-w-0">
          <PortalThreshold />
        </div>
      </div>
    </section>
  );
}
