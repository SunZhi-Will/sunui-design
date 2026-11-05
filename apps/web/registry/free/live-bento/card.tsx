"use client";

import { BentoTile, LiveBento, useTicker } from "./live-bento";

const POOL = [
  { name: "Alex", color: "#2563EB" },
  { name: "Jordan", color: "#D97706" },
  { name: "Tina", color: "#DB2777" },
  { name: "Ken", color: "#7C3AED" },
  { name: "Ivy", color: "#0891B2" },
  { name: "Leo", color: "#E11D48" },
];

// 同 demo 的鎖定格：其他人輪替，鎖住的 Mia 不動
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

/** 型錄卡片：一格會自己動的 bento 方塊，鎖住的班表不動、其他人持續輪替。 */
export default function LiveBentoCard() {
  return (
    <LiveBento className="mx-auto w-72 grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
      <BentoTile title="Locked shifts" body="Locked shifts stay put when you reshuffle.">
        <LockGrid />
      </BentoTile>
    </LiveBento>
  );
}
