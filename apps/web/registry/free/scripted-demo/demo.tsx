"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { DemoStatus, Pop, ScriptedDemo, SpinnerIcon, useScriptedDemo, type DemoTone, type ScriptedDemoChapter, type ScriptedDemoScene } from "./scripted-demo";

// 排班系統的首頁 Demo：草稿 → 求解 → 排好。

type Key = "input" | "solving" | "solved";

const TONES: Record<Key, DemoTone> = { input: "muted", solving: "brand", solved: "success" };

const SCENES: ScriptedDemoScene<Key>[] = [
  { key: "input", duration: 2400, chapter: 0, cursor: "button" },
  { key: "solving", duration: 2200, chapter: 1, cursor: "button", click: true },
  { key: "solved", duration: 3000, chapter: 2, cursor: "grid" },
];

const copy: Record<
  "en" | "zh-TW" | "zh-CN" | "ja",
  { days: string[]; plan: string[][]; status: Record<Key, string>; chapters: ScriptedDemoChapter[]; week: string; range: string; button: string }
> = {
  en: {
    days: ["Mon", "Tue", "Wed"],
    plan: [["Alex", "Jordan", "Mia"], ["Tina", "Alex", "Ken"]],
    status: { input: "Draft", solving: "Solving", solved: "OPTIMAL · 0.42 s" },
    chapters: [
      { title: "Enter the rules", caption: "Staff, shifts and weekly caps" },
      { title: "One click", caption: "The solver searches every combination" },
      { title: "Best plan", caption: "Every hard rule met in 0.4 s" },
    ],
    week: "This week",
    range: "Sep 28 to Sep 30 · 5 staff",
    button: "Auto-schedule",
  },
  "zh-TW": {
    days: ["週一", "週二", "週三"],
    plan: [["家豪", "雅婷", "怡君"], ["志明", "家豪", "冠宇"]],
    status: { input: "草稿", solving: "求解中", solved: "最佳解 · 0.42 秒" },
    chapters: [
      { title: "輸入規則", caption: "人員、班別與每週上限" },
      { title: "按一下", caption: "求解器搜尋所有組合" },
      { title: "最佳班表", caption: "0.4 秒內滿足所有硬性規則" },
    ],
    week: "本週",
    range: "9 月 28 日至 9 月 30 日 · 5 位員工",
    button: "自動排班",
  },
  "zh-CN": {
    days: ["周一", "周二", "周三"],
    plan: [["子轩", "思琪", "梓涵"], ["浩然", "子轩", "俊杰"]],
    status: { input: "草稿", solving: "求解中", solved: "最优解 · 0.42 秒" },
    chapters: [
      { title: "输入规则", caption: "人员、班次与每周上限" },
      { title: "点一下", caption: "求解器搜索所有组合" },
      { title: "最优排班", caption: "0.4 秒内满足所有硬性规则" },
    ],
    week: "本周",
    range: "9 月 28 日至 9 月 30 日 · 5 名员工",
    button: "自动排班",
  },
  ja: {
    days: ["月", "火", "水"],
    plan: [["佐藤", "鈴木", "高橋"], ["田中", "佐藤", "伊藤"]],
    status: { input: "下書き", solving: "計算中", solved: "最適解 · 0.42 秒" },
    chapters: [
      { title: "ルールを入力", caption: "スタッフ、シフト、週の上限" },
      { title: "ワンクリック", caption: "ソルバーがすべての組み合わせを探索" },
      { title: "最適なシフト", caption: "0.4 秒ですべての必須ルールを満たす" },
    ],
    week: "今週",
    range: "9月28日〜9月30日 · スタッフ 5 名",
    button: "自動作成",
  },
};

function ScheduleScene() {
  const { sceneKey, loop, target } = useScriptedDemo();
  const t = useDemoText(copy);
  const key = sceneKey as Key;
  return (
    <div className="p-3 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold sm:text-base">{t.week}</p>
          <p className="text-xs text-muted-foreground">{t.range}</p>
        </div>
        <div className="flex items-center gap-2">
          <DemoStatus text={t.status[key]} tone={TONES[key]} />
          <button ref={target("button")} type="button" tabIndex={-1} aria-hidden className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-all duration-300", sceneKey === "solving" && "scale-95")}>
            {sceneKey === "solving" ? <SpinnerIcon className="size-3.5" /> : null}
            {t.button}
          </button>
        </div>
      </div>
      <div ref={target("grid")} className="mt-4 grid grid-cols-3 gap-1.5">
        {t.days.map((d) => <p key={d} className="text-center text-xs text-muted-foreground">{d}</p>)}
        {t.plan.flat().map((name, i) => (
          <div key={i} className={cn("flex h-10 min-w-0 items-center justify-center rounded-lg border p-1 transition-colors duration-500", sceneKey === "input" ? "border-dashed border-border/80 bg-muted/30" : "border-border bg-background")}>
            {sceneKey !== "input" ? <Pop key={loop} delay={250 + i * 120} className="block truncate text-xs font-medium">{name}</Pop> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScriptedDemoDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-3xl min-w-0">
      <ScriptedDemo scenes={SCENES} chapters={t.chapters} url="shiftboard.app/schedule" locale={locale}>
        <ScheduleScene />
      </ScriptedDemo>
    </div>
  );
}
