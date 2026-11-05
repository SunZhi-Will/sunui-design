"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { ScrollStory, StoryPanel, useLoop, type ScrollStoryStep } from "./scroll-story";

// 排班系統首頁的功能故事：求解、最小擾動、公平，三個循環場景。

const PEOPLE = ["Alex", "Mia", "Jordan", "Tina", "Ken"];
const COLORS = ["#2563EB", "#16A34A", "#D97706", "#DB2777", "#7C3AED"];

const copy = {
  en: {
    nav: "Feature story sections",
    optimal: "OPTIMAL · 0.42s",
    searching: "SEARCHING",
    fullRedo: "Full redo",
    minimal: "Minimal",
    changes: "changes",
    minimalNote: "Start from the current plan: only Leo steps in on Wednesday.",
    redoNote: "Solving from scratch is valid, but almost everyone's shifts move.",
    fairness: "Fairness",
    steps: [
      { tab: "Auto-schedule", title: "Write the rules as maths, let the solver find the best plan.", body: "Staffing needs, availability and weekly caps are hard rules that never break." },
      { tab: "Minimal change", title: "Someone calls in sick, only the slot that must move does.", body: "Rescheduling starts from the current plan and counts every change as a cost." },
      { tab: "Fair", title: "Even shift counts, nobody gets overloaded.", body: "Fairness is part of the objective, and part-time caps are respected." },
    ],
  },
  "zh-TW": {
    nav: "功能故事段落",
    optimal: "最佳解 · 0.42s",
    searching: "搜尋中",
    fullRedo: "全部重排",
    minimal: "最小變動",
    changes: "處變動",
    minimalNote: "從目前的班表出發：只有 Leo 在週三補位。",
    redoNote: "從零求解也合法，但幾乎每個人的班都會動。",
    fairness: "公平度",
    steps: [
      { tab: "自動排班", title: "把規則寫成數學，讓求解器找出最佳班表。", body: "人力需求、可上班時段與每週上限都是硬性規則，絕不違反。" },
      { tab: "最小變動", title: "有人臨時請病假，只動非動不可的那一格。", body: "重排從目前的班表出發，每一處變動都算成本。" },
      { tab: "公平", title: "班數平均，沒有人被排爆。", body: "公平是目標的一部分，兼職的時數上限也會遵守。" },
    ],
  },
  "zh-CN": {
    nav: "功能故事段落",
    optimal: "最优解 · 0.42s",
    searching: "搜索中",
    fullRedo: "全部重排",
    minimal: "最小变动",
    changes: "处变动",
    minimalNote: "从当前的排班出发：只有 Leo 在周三顶班。",
    redoNote: "从零求解也成立，但几乎每个人的班都会变。",
    fairness: "公平度",
    steps: [
      { tab: "自动排班", title: "把规则写成数学，让求解器找出最优排班。", body: "人力需求、可上班时段和每周上限都是硬性规则，绝不违反。" },
      { tab: "最小变动", title: "有人临时请病假，只动必须动的那一格。", body: "重排从当前排班出发，每一处变动都计入成本。" },
      { tab: "公平", title: "班次平均，没有人超负荷。", body: "公平是目标的一部分，兼职的工时上限也会遵守。" },
    ],
  },
  ja: {
    nav: "機能紹介のセクション",
    optimal: "最適解 · 0.42s",
    searching: "探索中",
    fullRedo: "全面再作成",
    minimal: "最小変更",
    changes: "件の変更",
    minimalNote: "今のシフトから出発：水曜に Leo が入るだけ。",
    redoNote: "ゼロから解いても成立しますが、ほぼ全員のシフトが動きます。",
    fairness: "公平性",
    steps: [
      { tab: "自動シフト作成", title: "ルールを数式にして、ソルバーに最適なシフトを探させる。", body: "必要人数、出勤可能な時間、週の上限は決して破られない絶対ルールです。" },
      { tab: "最小変更", title: "急な病欠でも、動かすのは本当に必要な枠だけ。", body: "再作成は今のシフトから始まり、変更ひとつひとつをコストとして数えます。" },
      { tab: "公平", title: "シフト数はそろえて、誰にも偏らせない。", body: "公平性は目的関数の一部で、パートタイムの上限もきちんと守ります。" },
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
      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {Array.from({ length: 15 }, (_, i) => (
          <span key={i} className="h-6 rounded-md transition-colors duration-300" style={{ backgroundColor: solved ? COLORS[(i * 2) % 5] : "var(--muted)", transitionDelay: solved ? `${i * 40}ms` : "0ms" }} />
        ))}
      </div>
    </StoryPanel>
  );
}

function DisruptionVisual({ active }: { active: boolean }) {
  const t = useDemoText(copy);
  const [minimal, setMinimal] = useState(false);
  useLoop(active, [2800, 3400], (i) => setMinimal(i === 1));
  return (
    <StoryPanel>
      <div className="flex items-center justify-between gap-3">
        <div className="relative grid grid-cols-2 rounded-lg bg-muted p-0.5 text-xs">
          <span aria-hidden className="absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-card shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ transform: minimal ? "translateX(100%)" : "none" }} />
          <span className={cn("relative px-3 py-1 text-center transition-colors", minimal ? "text-muted-foreground" : "text-foreground")}>{t.fullRedo}</span>
          <span className={cn("relative px-3 py-1 text-center transition-colors", minimal ? "text-foreground" : "text-muted-foreground")}>{t.minimal}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className={cn("mr-1 text-2xl font-semibold tabular-nums transition-colors duration-500", minimal ? "text-foreground" : "text-destructive")}>{minimal ? 1 : 22}</span>
          {t.changes}
        </p>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{minimal ? t.minimalNote : t.redoNote}</p>
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
      <p className="text-xs text-muted-foreground">{t.fairness} <span className={cn("ml-1 font-semibold tabular-nums", fair ? "text-(--ss-success)" : "text-destructive")}>{fair ? "0.96" : "0.58"}</span></p>
      <div className="mt-4 grid h-32 grid-cols-5 items-end gap-2">
        {PEOPLE.map((name, i) => (
          <div key={name} className="w-full rounded-t-md opacity-85 transition-[height] duration-[900ms] ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ height: `${(counts[i] / 8) * 100}%`, transitionDelay: `${i * 50}ms`, backgroundColor: COLORS[i] }} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-2 text-center text-[11px] text-muted-foreground">
        {PEOPLE.map((name) => <span key={name} className="truncate">{name}</span>)}
      </div>
    </StoryPanel>
  );
}

const VISUALS = [
  { key: "solve", Visual: SolverVisual },
  { key: "disrupt", Visual: DisruptionVisual },
  { key: "fair", Visual: FairnessVisual },
];

export default function ScrollStoryDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const steps: ScrollStoryStep[] = VISUALS.map((v, i) => ({ ...v, ...t.steps[i] }));
  return (
    <div className="w-full max-w-6xl min-w-0">
      <ScrollStory steps={steps} locale={locale} labels={{ nav: t.nav }} />
    </div>
  );
}
