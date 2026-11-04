"use client";

import type { CSSProperties, Ref } from "react";

import { cn } from "@/lib/utils";

import {
  CheckIcon,
  CountUp,
  DemoMetric,
  DemoNotice,
  DemoPopover,
  DemoProgress,
  DemoStatus,
  ScriptedDemo,
  SpinnerIcon,
  TypedLog,
  useScriptedDemo,
  type DemoTone,
  type ScriptedDemoChapter,
  type ScriptedDemoScene,
} from "./scripted-demo";

// 排班系統的首頁 Demo：輸入限制 → 求解 → 臨時請假 → 最小擾動重排 → 點開解釋。

const EMPLOYEES: Record<number, string> = { 1: "Alex", 2: "Mia", 3: "Jordan", 4: "Tina", 5: "Ken", 6: "Ivy", 7: "Leo" };
const DOT = ["#2563EB", "#16A34A", "#D97706", "#DB2777", "#7C3AED", "#0891B2", "#E11D48", "#65A30D"];

const DAYS = [
  { label: "Mon", date: "9/28" },
  { label: "Tue", date: "9/29" },
  { label: "Wed", date: "9/30" },
  { label: "Thu", date: "10/1" },
  { label: "Fri", date: "10/2" },
];
const SHIFTS = [
  { label: "Early", time: "07-15" },
  { label: "Mid", time: "15-23" },
  { label: "Night", time: "23-07" },
];
// PLAN[shift][day] = 員工 id
const PLAN = [
  [[1, 2], [3, 5], [2, 6], [4, 1], [5, 3]],
  [[3, 4], [1, 6], [1, 5], [2, 3], [6, 2]],
  [[5, 6], [2, 4], [3, 4], [6, 5], [1, 4]],
];
const LEAVE = { shift: 0, day: 2, from: 2, to: 7 };

const CONSTRAINTS = [
  { code: "H1", label: "Staff per shift" },
  { code: "H2", label: "Availability" },
  { code: "H3", label: "One shift a day" },
  { code: "H4", label: "Weekly cap" },
  { code: "S1", label: "Preferences" },
  { code: "S2", label: "Fair share" },
];

const SOLVER_LOG = ["Built 105 boolean decision variables", "Added hard rules H1 to H6", "Searching for a feasible plan", "Optimising preference and fairness"];

type Key = "input" | "solving" | "solved" | "leave" | "reschedule" | "explain";

const SCENES: ScriptedDemoScene<Key>[] = [
  { key: "input", duration: 2600, chapter: 0, cursor: "button" },
  { key: "solving", duration: 2600, chapter: 0, cursor: "button", click: true },
  { key: "solved", duration: 2600, chapter: 0, cursor: "metrics" },
  { key: "leave", duration: 2800, chapter: 1, cursor: "button" },
  { key: "reschedule", duration: 3000, chapter: 2, cursor: "button", click: true },
  { key: "explain", duration: 5200, chapter: 3, cursor: "chip", click: true, clickDelay: 500, popover: "chip" },
];

const CHAPTERS: ScriptedDemoChapter[] = [
  { title: "One-click schedule", caption: "Enter the rules, the solver finds the best plan in 0.4 s" },
  { title: "Sudden leave", caption: "Mia calls in sick for Wednesday morning, leaving a gap" },
  { title: "Minimal reshuffle", caption: "Only 1 slot changes, the other 29 stay put" },
  { title: "Every slot explained", caption: "Open any shift to see why that person is on it" },
];

function Chip({ id, state = "normal", className, style, chipRef }: { id: number; state?: "normal" | "leave" | "changed"; className?: string; style?: CSSProperties; chipRef?: Ref<HTMLSpanElement> }) {
  return (
    <span
      ref={chipRef}
      style={style}
      className={cn(
        "flex h-6 w-full min-w-0 items-center justify-center gap-1 rounded-md border bg-card px-1 text-[11px] font-medium whitespace-nowrap sm:justify-start sm:gap-1.5 sm:px-2 sm:text-xs",
        state === "normal" && "border-border text-foreground",
        state === "leave" && "sd-shake border-dashed border-destructive/70 bg-destructive/10 text-destructive line-through",
        state === "changed" && "sd-glow border-(--sd-warning) text-foreground ring-1 ring-(--sd-warning)",
        className,
      )}
    >
      <span aria-hidden className="hidden size-1.5 shrink-0 rounded-full sm:block" style={{ backgroundColor: state === "leave" ? "currentColor" : DOT[id % DOT.length] }} />
      <span className="truncate">{EMPLOYEES[id]}</span>
    </span>
  );
}

function ScheduleScene() {
  const { scene, sceneKey, loop, target } = useScriptedDemo();
  const filled = scene >= 1;
  const solvedOnce = scene >= 2;
  const leaveState = sceneKey === "leave";
  const replaced = scene >= 4;

  const status: { text: string; tone: DemoTone } =
    sceneKey === "input"
      ? { text: "Draft", tone: "muted" }
      : sceneKey === "solving"
        ? { text: "Solving", tone: "brand" }
        : sceneKey === "solved"
          ? { text: "OPTIMAL · 0.42 s", tone: "success" }
          : sceneKey === "leave"
            ? { text: "Change pending", tone: "warning" }
            : { text: "v2 · rescheduled", tone: "success" };

  let chipIndex = 0;

  return (
    <>
      <div className="p-3 sm:p-5">
        {/* 頁首 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold sm:text-base">This week</p>
            <p className="text-xs text-muted-foreground">Sep 28 to Oct 2 · 7 staff</p>
          </div>
          <div className="flex items-center gap-2">
            <DemoStatus text={status.text} tone={status.tone} />
            <button
              ref={target("button")}
              type="button"
              tabIndex={-1}
              aria-hidden
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-all duration-300",
                (sceneKey === "solving" || sceneKey === "reschedule") && "scale-95",
              )}
            >
              {sceneKey === "solving" ? (
                <SpinnerIcon className="size-3.5" />
              ) : scene >= 3 ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("size-3.5", sceneKey === "reschedule" && "sd-spin")}>
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-3.5">
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                  <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
                </svg>
              )}
              {scene >= 3 ? "Reshuffle" : "Auto-schedule"}
            </button>
          </div>
        </div>

        {/* 限制條件 */}
        <div className="mt-3 flex min-h-7 flex-wrap items-center gap-1.5">
          {CONSTRAINTS.map((c, i) => (
            <span
              key={`${loop}-${c.code}`}
              className={cn(
                "sd-pop inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] transition-colors duration-500 sm:text-[11px]",
                solvedOnce ? "border-(--sd-success)/30 bg-(--sd-success)/5 text-(--sd-success)" : "border-border bg-background text-muted-foreground",
              )}
              style={{ animationDelay: `${i * 160}ms` }}
            >
              {solvedOnce ? <CheckIcon className="size-3" /> : <span className="font-mono">{c.code}</span>}
              <span className={cn(solvedOnce && "hidden sm:inline")}>{c.label}</span>
              {solvedOnce ? <span className="sm:hidden">{c.code}</span> : null}
            </span>
          ))}
        </div>

        <TypedLog
          lines={SOLVER_LOG}
          running={sceneKey === "solving"}
          idle={
            sceneKey === "input" ? (
              <p className="sd-fade-up">› Loaded 7 staff, 15 shifts, 6 rules</p>
            ) : (
              <p className="sd-fade-up">
                <span className="text-(--sd-success)">✓</span> All hard rules met, objective at optimum
              </p>
            )
          }
        />
        <DemoProgress running={sceneKey === "solving"} done={solvedOnce} />

        {/* 班表 */}
        <div className="mt-3 grid grid-cols-[2.4rem_repeat(5,minmax(0,1fr))] gap-1 sm:grid-cols-[3.5rem_repeat(5,minmax(0,1fr))] sm:gap-1.5">
          <div />
          {DAYS.map((d, i) => (
            <div
              key={d.label}
              className={cn(
                "rounded-md py-1 text-center text-[11px] leading-tight transition-colors duration-500 sm:text-xs",
                i === LEAVE.day && (leaveState || scene === 4) ? "bg-(--sd-warning)/10 text-(--sd-warning)" : "text-muted-foreground",
              )}
            >
              <div className="font-medium">{d.label}</div>
              <div className="font-mono text-[10px] opacity-70">{d.date}</div>
            </div>
          ))}
          {SHIFTS.map((shift, s) => (
            <div key={shift.label} className="contents">
              <div className="flex min-w-0 flex-col justify-center text-[11px] leading-tight text-muted-foreground sm:text-xs">
                <span className="truncate font-medium text-foreground">{shift.label}</span>
                <span className="font-mono text-[10px] opacity-70">{shift.time}</span>
              </div>
              {DAYS.map((_, d) => (
                <div
                  key={d}
                  className={cn(
                    "flex min-h-[3.6rem] min-w-0 flex-col gap-1 rounded-lg border p-1 transition-colors duration-500 sm:p-1.5",
                    filled ? "border-border bg-background" : "border-dashed border-border/80 bg-muted/30",
                  )}
                >
                  {filled
                    ? PLAN[s][d].map((id) => {
                        const index = chipIndex++;
                        const isLeaveSlot = s === LEAVE.shift && d === LEAVE.day && id === LEAVE.from;
                        if (isLeaveSlot && replaced) {
                          return <Chip key={`${loop}-r`} id={LEAVE.to} state="changed" className="sd-pop" chipRef={target("chip")} />;
                        }
                        return (
                          <Chip
                            key={`${loop}-${id}`}
                            id={id}
                            state={isLeaveSlot && leaveState ? "leave" : "normal"}
                            chipRef={isLeaveSlot ? target("chip") : undefined}
                            className={sceneKey === "solving" ? "sd-pop" : undefined}
                            style={sceneKey === "solving" ? { animationDelay: `${250 + index * 55}ms` } : undefined}
                          />
                        );
                      })
                    : null}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 指標 */}
        <div ref={target("metrics")} className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
          <DemoMetric label="Fairness" start={solvedOnce}>
            <CountUp key={`f-${replaced}`} to={replaced ? 0.94 : 0.96} decimals={2} start={solvedOnce} />
          </DemoMetric>
          <DemoMetric label="Preferences met" start={solvedOnce}>
            <CountUp key={`p-${replaced}`} to={replaced ? 90 : 91} suffix="%" start={solvedOnce} />
          </DemoMetric>
          <DemoMetric label="Changed" start={solvedOnce} highlight={replaced}>
            {replaced ? <CountUp to={3.3} decimals={1} suffix="%" /> : <span className="tabular-nums">0.0%</span>}
          </DemoMetric>
        </div>

        {/* 最小擾動摘要 */}
        <div className="mt-2 h-8">
          {replaced ? (
            <div
              key={`sum-${loop}`}
              className="sd-fade-up flex h-8 items-center justify-between gap-2 rounded-lg border border-(--sd-warning)/30 bg-(--sd-warning)/5 px-2.5 text-[11px] sm:text-xs"
            >
              <span className="truncate">
                <span className="font-medium text-(--sd-warning)">Only 1 / 30 slots changed</span>
                <span className="text-muted-foreground">, the other 29 stay put</span>
              </span>
              <span className="hidden shrink-0 text-muted-foreground sm:inline">Full redo: 29 slots</span>
            </div>
          ) : null}
        </div>
      </div>

      {sceneKey === "leave" || sceneKey === "reschedule" ? (
        <DemoNotice
          noticeKey={sceneKey}
          tone={sceneKey === "leave" ? "warning" : "success"}
          icon={
            sceneKey === "leave" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-3.5">
                <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                <path d="M22 8c0-2.3-.8-4.3-2-6" />
                <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
                <path d="M4 2C2.8 3.7 2 5.7 2 8" />
              </svg>
            ) : (
              <CheckIcon className="size-3.5" />
            )
          }
          title={sceneKey === "leave" ? "Last-minute change" : "Reshuffle complete"}
          body={sceneKey === "leave" ? "Mia off Wed 9/30 (Early shift short 1)" : "Leo covers Wednesday early, saved as v2"}
        />
      ) : null}

      {sceneKey === "explain" ? (
        <DemoPopover
          title="Why Leo?"
          subtitle="Wed 9/30 · Early 07:00 to 15:00"
          reasons={[
            { ok: true, text: "Free on Wednesday and prefers early shifts" },
            { ok: true, text: "0 shifts this week, the fewest of anyone" },
            { ok: true, text: "Swapping 1 slot is the smallest change" },
            { ok: false, text: "Alex: already on the Mid shift that day" },
            { ok: false, text: "Tina: already on the Night shift that day" },
          ]}
        />
      ) : null}
    </>
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
