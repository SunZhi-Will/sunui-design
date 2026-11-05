"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { ScrollStory, StoryPanel, useLoop, type ScrollStoryStep } from "./scroll-story";

const PEOPLE = ["Alex", "Mia", "Jordan", "Tina", "Ken"];
// 單一強調色的深淺，不用多色
const COLORS = [100, 78, 58, 42, 28].map((n) => `color-mix(in oklab, var(--primary) ${n}%, var(--muted))`);

const copy = {
  en: {
    nav: "Feature story sections",
    optimal: "OPTIMAL · 0.42s",
    searching: "SEARCHING",
    fairness: "Fairness",
    steps: [
      { tab: "Auto-schedule", title: "Let the solver find the best plan." },
      { tab: "Fair", title: "Even shift counts, nobody overloaded." },
    ],
  },
  "zh-TW": {
    nav: "功能故事段落",
    optimal: "最佳解 · 0.42s",
    searching: "搜尋中",
    fairness: "公平度",
    steps: [
      { tab: "自動排班", title: "讓求解器找出最佳班表。" },
      { tab: "公平", title: "班數平均，沒有人被排爆。" },
    ],
  },
  "zh-CN": {
    nav: "功能故事段落",
    optimal: "最优解 · 0.42s",
    searching: "搜索中",
    fairness: "公平度",
    steps: [
      { tab: "自动排班", title: "让求解器找出最优排班。" },
      { tab: "公平", title: "班次平均，没有人超负荷。" },
    ],
  },
  ja: {
    nav: "機能紹介のセクション",
    optimal: "最適解 · 0.42s",
    searching: "探索中",
    fairness: "公平性",
    steps: [
      { tab: "自動シフト作成", title: "最適なシフトはソルバーにおまかせ。" },
      { tab: "公平", title: "シフト数をそろえて、誰にも偏らせない。" },
    ],
  },
};

function SolverVisual({ active }: { active: boolean }) {
  const t = useDemoText(copy);
  const [solved, setSolved] = useState(false);
  useLoop(active, [2000, 3800], (i) => setSolved(i === 1));
  return (
    <StoryPanel>
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-muted-foreground">CP-SAT</span>
        <span className={cn("rounded-full px-2 py-0.5 font-mono text-[11px] transition-colors duration-500", solved ? "bg-(--ss-success)/10 text-(--ss-success)" : "bg-muted text-muted-foreground")}>
          {solved ? t.optimal : t.searching}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="h-5 rounded-md transition-colors duration-300" style={{ backgroundColor: solved ? COLORS[(i * 2) % 5] : "var(--muted)", transitionDelay: solved ? `${i * 40}ms` : "0ms" }} />
        ))}
      </div>
    </StoryPanel>
  );
}

function FairnessVisual({ active }: { active: boolean }) {
  const t = useDemoText(copy);
  const [fair, setFair] = useState(false);
  useLoop(active, [2600, 3600], (i) => setFair(i === 1));
  const counts = fair ? [5, 5, 5, 5, 4] : [8, 7, 5, 3, 1];
  return (
    <StoryPanel>
      <p className="text-xs text-muted-foreground">
        {t.fairness} <span className={cn("ml-1 font-semibold tabular-nums", fair ? "text-(--ss-success)" : "text-destructive")}>{fair ? "0.96" : "0.58"}</span>
      </p>
      <div className="mt-3 grid h-16 grid-cols-5 items-end gap-2">
        {PEOPLE.map((name, i) => (
          <div key={name} className="w-full rounded-t-md opacity-85 transition-[height] duration-[900ms] ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ height: `${(counts[i] / 8) * 100}%`, transitionDelay: `${i * 50}ms`, backgroundColor: COLORS[i] }} />
        ))}
      </div>
    </StoryPanel>
  );
}

const VISUALS = [
  { key: "solve", Visual: SolverVisual },
  { key: "fair", Visual: FairnessVisual },
];

/** 型錄卡片：在框內往下捲，每段文字淡入，下方場景進入畫面才開始循環播放。 */
export default function ScrollStoryCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const steps: ScrollStoryStep[] = VISUALS.map((v, i) => ({ ...v, ...t.steps[i] }));
  return (
    <div className="mx-auto h-[230px] w-72 overflow-y-auto px-1 [&_h3]:text-lg">
      <ScrollStory steps={steps} locale={locale} labels={{ nav: t.nav }} />
    </div>
  );
}
