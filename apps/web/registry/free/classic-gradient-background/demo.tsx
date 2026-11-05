"use client";

import { useDemoText } from "@/lib/demo-locale";

import { GradientBackground } from "./classic-gradient-background";

const copy = {
  en: { title: "Build interfaces that glow", body: "An animated radial gradient with two breathing glow layers and a fine grid overlay.", start: "Get started", browse: "Browse components" },
  "zh-TW": { title: "打造會發光的介面", body: "動態放射漸層，兩層呼吸般的光暈，再疊上一層細網格。", start: "開始使用", browse: "瀏覽元件" },
  "zh-CN": { title: "打造会发光的界面", body: "动态径向渐变，两层呼吸般的光晕，再叠上一层细网格。", start: "开始使用", browse: "浏览组件" },
  ja: { title: "光をまとうインターフェースを", body: "アニメーションする放射グラデーションに、呼吸するような 2 層の光と細かなグリッドを重ねます。", start: "はじめる", browse: "コンポーネントを見る" },
};

export default function GradientBackgroundDemo() {
  const t = useDemoText(copy);
  // 首頁 hero：背景填滿 section
  return (
    <section className="relative isolate w-full max-w-5xl min-w-0 overflow-hidden rounded-2xl px-6 py-16 text-center text-white sm:py-24">
      <GradientBackground />
      <div className="relative">
        <p className="text-sm font-medium tracking-widest text-blue-300 uppercase">SunUI Design</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{t.title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-blue-100/80">
          {t.body}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#get-started" className="rounded-lg bg-blue-500 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition-colors hover:bg-blue-400">
            {t.start}
          </a>
          <a href="#components" className="rounded-lg border border-white/20 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-white/10">
            {t.browse}
          </a>
        </div>
      </div>
    </section>
  );
}
