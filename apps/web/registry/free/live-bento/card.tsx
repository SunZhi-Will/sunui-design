"use client";

import { useDemoText } from "@/lib/demo-locale";

import { BentoTile, LiveBento, useTicker } from "./live-bento";

// 身分色只上在 6px 的點，低彩度、不用紫與粉
const COLORS = ["#2563EB", "#B45309", "#0F766E", "#78716C", "#0E7490", "#A16207"];

const copy = {
  en: { pool: ["Alex", "Jordan", "Tina", "Ken", "Ivy", "Leo"], locked: "Mia", title: "Locked shifts", body: "Locked shifts stay put when you reshuffle." },
  "zh-TW": { pool: ["家豪", "佳穎", "婷婷", "志明", "怡君", "冠宇"], locked: "美玲", title: "鎖定班次", body: "鎖住的班次在重新排班時不會被動到。" },
  "zh-CN": { pool: ["浩然", "佳怡", "婷婷", "子轩", "欣怡", "宇航"], locked: "美玲", title: "锁定班次", body: "锁定的班次在重新排班时保持不变。" },
  ja: { pool: ["翔太", "陽菜", "結衣", "健", "葵", "蓮"], locked: "美緒", title: "シフトの固定", body: "固定したシフトは組み直しても動きません。" },
};

// 同 demo 的鎖定格：其他人輪替，鎖住的人不動
function LockGrid() {
  const { ref, tick } = useTicker(1400);
  const t = useDemoText(copy);
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
              <span className="truncate">{t.locked}</span>
            </span>
          );
        }
        const k = (i + tick) % t.pool.length;
        const p = { name: t.pool[k], color: COLORS[k] };
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
  const t = useDemoText(copy);
  return (
    <LiveBento className="mx-auto w-72 grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
      <BentoTile title={t.title} body={t.body}>
        <LockGrid />
      </BentoTile>
    </LiveBento>
  );
}
