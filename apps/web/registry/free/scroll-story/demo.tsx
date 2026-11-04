"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { ScrollStory, StoryPanel, useLoop, type ScrollStoryStep } from "./scroll-story";

// 排班系統首頁的功能故事：求解、最小擾動、公平，三個循環場景。

const PEOPLE = ["Alex", "Mia", "Jordan", "Tina", "Ken"];
const COLORS = ["#2563EB", "#16A34A", "#D97706", "#DB2777", "#7C3AED"];

function SolverVisual({ active }: { active: boolean }) {
  const [solved, setSolved] = useState(false);
  useLoop(active, [2000, 3800], (i) => setSolved(i === 1));
  return (
    <StoryPanel>
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-muted-foreground">CP-SAT</span>
        <span className={cn("rounded-full px-2 py-0.5 font-mono text-[11px] transition-colors duration-500", solved ? "bg-(--ss-success)/10 text-(--ss-success)" : "bg-muted text-muted-foreground")}>
          {solved ? "OPTIMAL · 0.42s" : "SEARCHING"}
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
  const [minimal, setMinimal] = useState(false);
  useLoop(active, [2800, 3400], (i) => setMinimal(i === 1));
  return (
    <StoryPanel>
      <div className="flex items-center justify-between gap-3">
        <div className="relative grid grid-cols-2 rounded-lg bg-muted p-0.5 text-xs">
          <span aria-hidden className="absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-card shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ transform: minimal ? "translateX(100%)" : "none" }} />
          <span className={cn("relative px-3 py-1 text-center transition-colors", minimal ? "text-muted-foreground" : "text-foreground")}>Full redo</span>
          <span className={cn("relative px-3 py-1 text-center transition-colors", minimal ? "text-foreground" : "text-muted-foreground")}>Minimal</span>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className={cn("mr-1 text-2xl font-semibold tabular-nums transition-colors duration-500", minimal ? "text-foreground" : "text-destructive")}>{minimal ? 1 : 22}</span>
          changes
        </p>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        {minimal ? "Start from the current plan: only Leo steps in on Wednesday." : "Solving from scratch is valid, but almost everyone's shifts move."}
      </p>
    </StoryPanel>
  );
}

function FairnessVisual({ active }: { active: boolean }) {
  const [fair, setFair] = useState(false);
  useLoop(active, [2600, 3600], (i) => setFair(i === 1));
  const counts = fair ? [5, 5, 5, 5, 4] : [8, 7, 5, 3, 1];
  return (
    <StoryPanel>
      <p className="text-xs text-muted-foreground">Fairness <span className={cn("ml-1 font-semibold tabular-nums", fair ? "text-(--ss-success)" : "text-destructive")}>{fair ? "0.96" : "0.58"}</span></p>
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

const STEPS: ScrollStoryStep[] = [
  { key: "solve", tab: "Auto-schedule", title: "Write the rules as maths, let the solver find the best plan.", body: "Staffing needs, availability and weekly caps are hard rules that never break.", Visual: SolverVisual },
  { key: "disrupt", tab: "Minimal change", title: "Someone calls in sick, only the slot that must move does.", body: "Rescheduling starts from the current plan and counts every change as a cost.", Visual: DisruptionVisual },
  { key: "fair", tab: "Fair", title: "Even shift counts, nobody gets overloaded.", body: "Fairness is part of the objective, and part-time caps are respected.", Visual: FairnessVisual },
];

export default function ScrollStoryDemo() {
  return (
    <div className="w-full max-w-6xl min-w-0">
      <ScrollStory steps={STEPS} labels={{ nav: "Feature story sections" }} />
    </div>
  );
}
