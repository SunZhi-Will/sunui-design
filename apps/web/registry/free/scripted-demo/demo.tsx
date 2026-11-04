"use client";

import { cn } from "@/lib/utils";

import { DemoStatus, Pop, ScriptedDemo, SpinnerIcon, useScriptedDemo, type DemoTone, type ScriptedDemoChapter, type ScriptedDemoScene } from "./scripted-demo";

// 排班系統的首頁 Demo：草稿 → 求解 → 排好。

const DAYS = ["Mon", "Tue", "Wed"];
const PLAN = [["Alex", "Jordan", "Mia"], ["Tina", "Alex", "Ken"]];
const STATUS: Record<Key, { text: string; tone: DemoTone }> = {
  input: { text: "Draft", tone: "muted" },
  solving: { text: "Solving", tone: "brand" },
  solved: { text: "OPTIMAL · 0.42 s", tone: "success" },
};

type Key = "input" | "solving" | "solved";

const SCENES: ScriptedDemoScene<Key>[] = [
  { key: "input", duration: 2400, chapter: 0, cursor: "button" },
  { key: "solving", duration: 2200, chapter: 1, cursor: "button", click: true },
  { key: "solved", duration: 3000, chapter: 2, cursor: "grid" },
];

const CHAPTERS: ScriptedDemoChapter[] = [
  { title: "Enter the rules", caption: "Staff, shifts and weekly caps" },
  { title: "One click", caption: "The solver searches every combination" },
  { title: "Best plan", caption: "Every hard rule met in 0.4 s" },
];

function ScheduleScene() {
  const { sceneKey, loop, target } = useScriptedDemo();
  const status = STATUS[sceneKey as Key];
  return (
    <div className="p-3 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold sm:text-base">This week</p>
          <p className="text-xs text-muted-foreground">Sep 28 to Sep 30 · 5 staff</p>
        </div>
        <div className="flex items-center gap-2">
          <DemoStatus text={status.text} tone={status.tone} />
          <button ref={target("button")} type="button" tabIndex={-1} aria-hidden className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-all duration-300", sceneKey === "solving" && "scale-95")}>
            {sceneKey === "solving" ? <SpinnerIcon className="size-3.5" /> : null}
            Auto-schedule
          </button>
        </div>
      </div>
      <div ref={target("grid")} className="mt-4 grid grid-cols-3 gap-1.5">
        {DAYS.map((d) => <p key={d} className="text-center text-xs text-muted-foreground">{d}</p>)}
        {PLAN.flat().map((name, i) => (
          <div key={i} className={cn("flex h-10 min-w-0 items-center justify-center rounded-lg border p-1 transition-colors duration-500", sceneKey === "input" ? "border-dashed border-border/80 bg-muted/30" : "border-border bg-background")}>
            {sceneKey !== "input" ? <Pop key={loop} delay={250 + i * 120} className="block truncate text-xs font-medium">{name}</Pop> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScriptedDemoDemo() {
  return (
    <div className="w-full max-w-3xl min-w-0">
      <ScriptedDemo scenes={SCENES} chapters={CHAPTERS} url="shiftboard.app/schedule">
        <ScheduleScene />
      </ScriptedDemo>
    </div>
  );
}
