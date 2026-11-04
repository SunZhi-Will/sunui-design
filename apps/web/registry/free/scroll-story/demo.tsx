"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { CountUp, ScrollStory, StoryPanel, useLoop, type ScrollStoryStep } from "./scroll-story";

// 排班系統首頁的功能故事：求解、最小擾動、可解釋、公平，四個循環場景。

const EMPLOYEES: Record<number, string> = { 1: "Alex", 2: "Mia", 3: "Jordan", 4: "Tina", 5: "Ken", 6: "Ivy", 7: "Leo" };
const EMPLOYEE_IDS = [1, 2, 3, 4, 5, 6, 7];
const PALETTE = [
  { bg: "#DBEAFE", fg: "#2563EB" },
  { bg: "#DCFCE7", fg: "#16A34A" },
  { bg: "#FEF3C7", fg: "#D97706" },
  { bg: "#FCE7F3", fg: "#DB2777" },
  { bg: "#EDE9FE", fg: "#7C3AED" },
  { bg: "#CFFAFE", fg: "#0891B2" },
  { bg: "#FFE4E6", fg: "#E11D48" },
  { bg: "#ECFCCB", fg: "#65A30D" },
];
const color = (id: number) => PALETTE[id % PALETTE.length];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SHIFTS = ["Early", "Mid", "Night"];
const PLAN = [
  [[1, 2], [3, 5], [2, 6], [4, 1], [5, 3]],
  [[3, 4], [1, 6], [1, 5], [2, 3], [6, 2]],
  [[5, 6], [2, 4], [3, 4], [6, 5], [1, 4]],
];
const NAIVE_PLAN = [
  [[3, 5], [1, 2], [7, 1], [2, 6], [1, 6]],
  [[1, 6], [3, 4], [3, 6], [1, 5], [4, 5]],
  [[2, 4], [5, 6], [4, 5], [3, 4], [2, 3]],
];
// 小美週三早班請假，由宗翰補上
const MINIMAL_PLAN = PLAN.map((row, s) => row.map((ids, d) => (s === 0 && d === 2 ? ids.map((id) => (id === 2 ? 7 : id)) : ids)));

function countChanges(a: number[][][], b: number[][][]) {
  let changes = 0;
  a.forEach((row, s) =>
    row.forEach((ids, d) => {
      const other = new Set(b[s][d]);
      changes += ids.filter((id) => !other.has(id)).length;
    }),
  );
  return changes;
}
const NAIVE_COUNT = countChanges(NAIVE_PLAN, PLAN);
const MINIMAL_COUNT = countChanges(MINIMAL_PLAN, PLAN);

const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

/* ---------- 1. 求解：候選組合閃爍，最後收斂成最佳解 ---------- */

function SolverVisual({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<"search" | "solved">("search");
  const [lit, setLit] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(0);

  useLoop(active, [2000, 3800], (i) => setPhase(i === 0 ? "search" : "solved"));

  useEffect(() => {
    if (!active || phase !== "search") return;
    setChecked(0);
    const began = performance.now();
    const timer = window.setInterval(() => {
      const next = new Set<string>();
      for (let n = 0; n < 34; n++) next.add(`${1 + Math.floor(Math.random() * 7)}-${Math.floor(Math.random() * 15)}`);
      setLit(next);
      setChecked(Math.round(((performance.now() - began) / 2000) * 18432));
    }, 90);
    return () => window.clearInterval(timer);
  }, [active, phase]);

  const solved = phase === "solved";

  return (
    <StoryPanel>
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-muted-foreground">CP-SAT</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-[11px] transition-colors duration-500",
            solved ? "bg-(--ss-success)/10 text-(--ss-success)" : "bg-muted text-muted-foreground",
          )}
        >
          {solved ? "OPTIMAL · 0.42s" : "SEARCHING"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[2.5rem_repeat(5,minmax(0,1fr))] gap-x-1.5 text-[10px] text-muted-foreground">
        <span />
        {DAYS.map((d) => (
          <span key={d} className="text-center">
            {d}
          </span>
        ))}
      </div>
      <div className="mt-1.5 space-y-1">
        {EMPLOYEE_IDS.map((e) => (
          <div key={e} className="grid grid-cols-[2.5rem_repeat(5,minmax(0,1fr))] items-center gap-x-1.5">
            <span className="truncate text-[11px]">{EMPLOYEES[e]}</span>
            {DAYS.map((_, d) => (
              <div key={d} className="grid grid-cols-3 gap-0.5">
                {SHIFTS.map((_, s) => {
                  const col = d * 3 + s;
                  const assigned = PLAN[s][d].includes(e);
                  const on = solved ? assigned : lit.has(`${e}-${col}`);
                  return (
                    <span
                      key={s}
                      className="h-4 rounded-[3px] transition-[background-color,transform] duration-300"
                      style={{
                        backgroundColor: on ? (solved ? color(e).fg : "color-mix(in oklab, var(--foreground) 22%, transparent)") : "var(--muted)",
                        transform: solved && assigned ? "scale(1)" : "scale(0.9)",
                        transitionDelay: solved ? `${col * 22 + e * 12}ms` : "0ms",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
        <div className="min-w-0">
          <p className="text-muted-foreground">Combos checked</p>
          <p className="mt-0.5 font-mono text-sm tabular-nums">{(solved ? 18432 : checked).toLocaleString("en-US")}</p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground">Hard rules</p>
          <p className={cn("mt-0.5 text-sm transition-colors", solved && "text-(--ss-success)")}>{solved ? "6 / 6 met" : "Checking"}</p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground">Per person</p>
          <p className="mt-0.5 text-sm">{solved ? "6 × 5 shifts" : "..."}</p>
        </div>
      </div>
    </StoryPanel>
  );
}

/* ---------- 2. 最小擾動：整張重排 vs 只改一格 ---------- */

function NameChip({ id, changed }: { id: number; changed?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-6 min-w-0 items-center justify-center gap-1 rounded-md border px-1 text-[11px] font-medium transition-colors duration-500 sm:justify-start sm:px-1.5",
        changed ? "ss-swap-in border-(--ss-warning)/60 bg-(--ss-warning)/10" : "border-border bg-background",
      )}
    >
      <span className="hidden size-1.5 shrink-0 rounded-full sm:block" style={{ backgroundColor: color(id).fg }} />
      <span className="truncate">{EMPLOYEES[id]}</span>
    </span>
  );
}

function DisruptionVisual({ active }: { active: boolean }) {
  const [mode, setMode] = useState<"naive" | "minimal">("naive");
  useLoop(active, [2800, 3400], (i) => setMode(i === 0 ? "naive" : "minimal"));
  const plan = mode === "naive" ? NAIVE_PLAN : MINIMAL_PLAN;

  return (
    <StoryPanel>
      <div className="flex items-center justify-between gap-3">
        <div className="relative grid grid-cols-2 rounded-lg bg-muted p-0.5 text-xs">
          <span
            aria-hidden
            className="absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-card shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{ transform: mode === "minimal" ? "translateX(100%)" : "none" }}
          />
          <span className={cn("relative px-3 py-1 text-center transition-colors", mode === "naive" ? "text-foreground" : "text-muted-foreground")}>Full redo</span>
          <span className={cn("relative px-3 py-1 text-center transition-colors", mode === "minimal" ? "text-foreground" : "text-muted-foreground")}>Minimal</span>
        </div>
        <p className="text-right text-xs text-muted-foreground">
          <span
            className={cn(
              "mr-1 inline-block min-w-[2ch] text-2xl font-semibold tabular-nums transition-colors duration-500",
              mode === "naive" ? "text-destructive" : "text-foreground",
            )}
          >
            <CountUp to={mode === "naive" ? NAIVE_COUNT : MINIMAL_COUNT} duration={700} start={active} />
          </span>
          changes
        </p>
      </div>

      <div className="mt-4 grid grid-cols-[2rem_repeat(5,minmax(0,1fr))] gap-1 text-[10px] text-muted-foreground">
        <span />
        {DAYS.map((d, i) => (
          <span key={d} className={cn("text-center", i === 2 && "font-medium text-(--ss-warning)")}>
            {d}
          </span>
        ))}
      </div>
      <div className="mt-1 space-y-1">
        {SHIFTS.map((shift, s) => (
          <div key={shift} className="grid grid-cols-[2rem_repeat(5,minmax(0,1fr))] gap-1">
            <span className="self-center text-[11px] text-muted-foreground">{shift.slice(0, 1)}</span>
            {DAYS.map((_, d) => {
              const original = new Set(PLAN[s][d]);
              return (
                <div key={d} className="min-w-0 space-y-1 rounded-lg border border-border bg-muted/40 p-1">
                  {plan[s][d].map((id) => {
                    const changed = !original.has(id);
                    return <NameChip key={changed ? `${mode}-${s}-${d}-${id}` : `${s}-${d}-${id}`} id={id} changed={changed} />;
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {mode === "naive"
          ? "Solving from scratch is valid, but almost everyone's shifts move."
          : "Start from the current plan and treat change as a cost: only Leo steps in on Wednesday."}
      </p>
    </StoryPanel>
  );
}

/* ---------- 3. 可解釋：理由逐條出現，其他候選人被劃掉 ---------- */

function ExplainVisual({ active }: { active: boolean }) {
  const [round, setRound] = useState(0);
  useLoop(active, [5200], () => setRound((r) => r + 1));

  const reasons = [
    { tone: "pos", text: "Free on Wednesday and prefers early shifts" },
    { tone: "pos", text: "0 shifts this week, the fairest pick" },
    { tone: "neu", text: "Swapping 1 slot covers the staffing need" },
  ];
  const others = [
    { id: 2, why: "Approved leave" },
    { id: 1, why: "On the Mid shift that day" },
    { id: 4, why: "On the Night shift that day" },
  ];

  return (
    <StoryPanel>
      <div key={round} className="space-y-4">
        <div className="ss-swap-in flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold" style={{ backgroundColor: color(7).bg, color: color(7).fg }}>
            L
          </span>
          <div className="min-w-0">
            <p className="font-semibold">Why Leo?</p>
            <p className="text-xs text-muted-foreground">Wed 9/30 · Early 07:00 to 15:00</p>
          </div>
        </div>

        <ul className="space-y-1.5">
          {reasons.map((r, i) => (
            <li key={r.text} className="ss-swap-in flex items-center gap-2.5 rounded-lg bg-muted/60 px-3 py-2 text-sm" style={{ animationDelay: `${300 + i * 220}ms` }}>
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full",
                  r.tone === "pos" ? "bg-(--ss-success) text-(--ss-success-fg)" : "bg-foreground/10 text-foreground",
                )}
              >
                {r.tone === "pos" ? (
                  <svg {...svg} className="size-3">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <span className="text-[10px]">·</span>
                )}
              </span>
              {r.text}
            </li>
          ))}
        </ul>

        <div>
          <p className="ss-swap-in text-xs text-muted-foreground" style={{ animationDelay: "1000ms" }}>
            Other candidates
          </p>
          <ul className="mt-1.5 divide-y divide-border">
            {others.map((o, i) => (
              <li key={o.id} className="ss-swap-in flex items-center justify-between gap-3 py-2 text-sm" style={{ animationDelay: `${1150 + i * 200}ms` }}>
                <span className="relative flex items-center gap-2">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: color(o.id).fg }} />
                  <span className="relative text-muted-foreground">
                    {EMPLOYEES[o.id]}
                    <span aria-hidden className="ss-strike absolute top-1/2 left-0 h-px w-full origin-left bg-muted-foreground" style={{ animationDelay: `${1500 + i * 200}ms` }} />
                  </span>
                </span>
                <span className="flex min-w-0 items-center gap-1 text-right text-xs text-muted-foreground">
                  <svg {...svg} className="size-3 shrink-0">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                  {o.why}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </StoryPanel>
  );
}

/* ---------- 4. 公平：班數長條從參差不齊變平均 ---------- */

const MANUAL_COUNTS = [8, 7, 5, 4, 3, 2, 1];
const FAIR_COUNTS = [5, 5, 5, 5, 5, 4, 1];

function FairnessVisual({ active }: { active: boolean }) {
  const [fair, setFair] = useState(false);
  useLoop(active, [2600, 3600], (i) => setFair(i === 1));
  const counts = fair ? FAIR_COUNTS : MANUAL_COUNTS;
  const max = 8;

  return (
    <StoryPanel>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{fair ? "Shiftboard schedule" : "Hand-made schedule"}</p>
          <p className="mt-0.5 text-sm font-medium">Shifts per person this week</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Fairness</p>
          <p className={cn("text-2xl font-semibold tabular-nums transition-colors duration-500", fair ? "text-(--ss-success)" : "text-destructive")}>
            <CountUp to={fair ? 0.96 : 0.58} decimals={2} duration={800} start={active} />
          </p>
        </div>
      </div>

      <div className="relative mt-5 h-44">
        <div aria-hidden className="absolute inset-x-0 border-t border-dashed border-muted-foreground/40" style={{ bottom: `${(30 / 7 / max) * 100}%` }}>
          <span className="absolute -top-4 right-0 text-[10px] text-muted-foreground">Avg 4.3</span>
        </div>
        <div className="absolute inset-0 grid grid-cols-7 items-end gap-2">
          {EMPLOYEE_IDS.map((id, i) => (
            <div key={id} className="flex h-full min-w-0 flex-col items-center justify-end gap-1">
              <span className="text-[11px] font-medium tabular-nums">{counts[i]}</span>
              <div
                className="w-full rounded-t-md transition-[height] duration-[900ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ height: `calc((100% - 1.25rem) * ${counts[i] / max})`, transitionDelay: `${i * 50}ms`, backgroundColor: color(id).fg, opacity: 0.85 }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2 text-center text-[11px] text-muted-foreground">
        {EMPLOYEE_IDS.map((id) => (
          <span key={id} className="truncate">
            {EMPLOYEES[id]}
          </span>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <svg {...svg} className="size-3 shrink-0">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Leo is part-time with a 3-shift cap, and fairness respects each cap.
      </p>
    </StoryPanel>
  );
}

const STEPS: ScrollStoryStep[] = [
  {
    key: "solve",
    tab: "Auto-schedule",
    title: "Write the rules as maths, let the solver find the best plan.",
    body: "Staffing needs, availability, one shift a day and weekly caps are hard rules that never break. CP-SAT searches tens of thousands of combinations for the one with the best preference and fairness scores.",
    Visual: SolverVisual,
  },
  {
    key: "disrupt",
    tab: "Minimal change",
    title: "Someone calls in sick, only the slot that must move does.",
    body: "Rescheduling starts from the current plan and counts every change as a cost. Everyone else keeps their shifts, and each reshuffle saves a new version with a change log.",
    Visual: DisruptionVisual,
  },
  {
    key: "explain",
    tab: "Explainable",
    title: "Every slot can answer: why this person?",
    body: "Open any shift to see the reasons for the pick, and why the other candidates were passed over. Managers can explain it, and staff can follow it.",
    Visual: ExplainVisual,
  },
  {
    key: "fair",
    tab: "Fair",
    title: "Even shift counts, nobody gets overloaded.",
    body: "Fairness is part of the objective. Shift counts stay as close as possible while respecting part-time caps, and the formula is public on the algorithm page.",
    Visual: FairnessVisual,
  },
];

export default function ScrollStoryDemo() {
  return (
    <div className="w-full max-w-6xl min-w-0">
      <ScrollStory steps={STEPS} labels={{ nav: "Feature story sections" }} />
    </div>
  );
}
