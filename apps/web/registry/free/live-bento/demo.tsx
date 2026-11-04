"use client";

import { BentoTile, LiveBento, useTicker } from "./live-bento";

// 排班系統首頁的「更多功能」格子。每格的小動畫用 useTicker 只在畫面內重播。

const POOL = [
  { name: "Alex", color: "#2563EB" },
  { name: "Jordan", color: "#D97706" },
  { name: "Tina", color: "#DB2777" },
  { name: "Ken", color: "#7C3AED" },
  { name: "Ivy", color: "#0891B2" },
  { name: "Leo", color: "#E11D48" },
];
const SHIFTS = [["Mon", "Early"], ["Tue", "Mid"], ["Wed", "Mid"], ["Thu", "Early"], ["Fri", "Night"]];

function MatchingRuns() {
  const { ref, tick } = useTicker(5200);
  return (
    <div ref={ref} className="w-full">
      <div key={tick} className="w-full space-y-2 font-mono text-xs">
        {["Run 1", "Run 2"].map((label, i) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
            <span className="font-sans text-muted-foreground">{label}</span>
            <span className="lb-type" style={{ animationDelay: `${i * 900}ms` }}>9f3a2c1e</span>
          </div>
        ))}
        <p className="lb-swap-in pt-1 text-center font-sans text-sm text-(--lb-success)" style={{ animationDelay: "2000ms" }}>
          Identical result
        </p>
      </div>
    </div>
  );
}

function LockGrid() {
  const { ref, tick } = useTicker(1400);
  return (
    <div ref={ref} className="grid w-full max-w-[14rem] grid-cols-3 gap-1.5">
      {Array.from({ length: 6 }, (_, i) => {
        if (i === 4) {
          return (
            <span key="locked" className="flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-foreground bg-foreground text-xs font-medium text-background">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="size-3 shrink-0">
                <rect width="18" height="11" x="3" y="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="truncate">Mia</span>
            </span>
          );
        }
        const p = POOL[(i + tick) % POOL.length];
        return (
          <span key={`${i}-${p.name}-${tick}`} className="lb-swap-in flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-xs font-medium" style={{ animationDelay: `${i * 40}ms` }}>
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="truncate">{p.name}</span>
          </span>
        );
      })}
    </div>
  );
}

function PhoneList() {
  const { ref, tick } = useTicker(900);
  const current = tick % SHIFTS.length;
  return (
    <div ref={ref} className="w-44 rounded-[28px] border-[5px] border-foreground/85 bg-background p-2.5 shadow-lg">
      <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-foreground/15" />
      <p className="px-1 text-[11px] font-semibold">Alex&apos;s shifts</p>
      <ul className="mt-2 space-y-1">
        {SHIFTS.map(([day, shift], i) => (
          <li key={day} className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-[11px] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${i === current ? "bg-foreground text-background" : "bg-muted/60"}`}>
            <span>{day}</span>
            <span className={i === current ? "" : "text-muted-foreground"}>{shift}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LiveBentoDemo() {
  return (
    <div className="w-full max-w-5xl min-w-0">
      <LiveBento>
        <BentoTile title="Deterministic" body="No randomness. The same input always gives the same schedule.">
          <MatchingRuns />
        </BentoTile>
        <BentoTile title="Locked shifts" body="Lock the important shifts first. They stay put when you reshuffle." delay={80}>
          <LockGrid />
        </BentoTile>
        <BentoTile title="Staff view" body="Staff sign in to see only their own shifts and set their availability." delay={160}>
          <PhoneList />
        </BentoTile>
      </LiveBento>
    </div>
  );
}
