"use client";

import { useDemoText } from "@/lib/demo-locale";

import { GradientBackground } from "./classic-gradient-background";

const copy = {
  en: { title: "Ship the release notes on time", body: "A soft tonal wash and a fine grid that fades out, quiet enough to sit behind any headline.", start: "Start a draft", browse: "See past releases" },
  "zh-TW": { title: "準時發出這一版的更新說明", body: "一層淡淡的色調加上往下淡出的細網格，夠安靜，放在任何標題後面都不搶戲。", start: "開始草稿", browse: "看過去的版本" },
  "zh-CN": { title: "准时发出这一版的更新说明", body: "一层淡淡的色调加上往下淡出的细网格，够安静，放在任何标题后面都不抢戏。", start: "开始草稿", browse: "看过去的版本" },
  ja: { title: "リリースノートを予定どおりに", body: "淡いトーンと下へ消えていく細いグリッド。どんな見出しの後ろに置いても邪魔をしない静かな背景です。", start: "下書きを始める", browse: "過去のリリース" },
};

export default function GradientBackgroundDemo() {
  const t = useDemoText(copy);
  // 首頁 hero：背景填滿 section
  return (
    <section className="relative isolate w-full max-w-5xl min-w-0 overflow-hidden rounded-xl border border-border px-6 py-16 text-center text-foreground sm:py-24">
      <GradientBackground />
      <div className="relative">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">SunUI Design</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{t.title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">{t.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#get-started" className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            {t.start}
          </a>
          <a href="#components" className="rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            {t.browse}
          </a>
        </div>
      </div>
    </section>
  );
}
