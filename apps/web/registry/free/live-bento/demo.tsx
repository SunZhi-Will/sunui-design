"use client";

import { useDemoText } from "@/lib/demo-locale";

import { BentoTile, LiveBento, useTicker } from "./live-bento";

// 排班系統首頁的「更多功能」格子。每格的小動畫用 useTicker 只在畫面內重播。

// 身分色只上在 6px 的點，低彩度、不用紫與粉
const COLORS = ["#2563EB", "#B45309", "#0F766E", "#78716C", "#0E7490", "#A16207"];

const copy = {
  en: {
    pool: ["Alex", "Jordan", "Tina", "Ken", "Ivy", "Leo"],
    locked: "Mia",
    runs: ["Run 1", "Run 2"],
    identical: "Identical result",
    myShifts: "Alex's shifts",
    shifts: [["Mon", "Early"], ["Tue", "Mid"], ["Wed", "Mid"], ["Thu", "Early"], ["Fri", "Night"]],
    tiles: [
      ["Deterministic", "No randomness. The same input always gives the same schedule."],
      ["Locked shifts", "Lock the important shifts first. They stay put when you reshuffle."],
      ["Staff view", "Staff sign in to see only their own shifts and set their availability."],
    ],
  },
  "zh-TW": {
    pool: ["家豪", "佳穎", "婷婷", "志明", "怡君", "冠宇"],
    locked: "美玲",
    runs: ["第 1 次", "第 2 次"],
    identical: "結果完全相同",
    myShifts: "家豪的班表",
    shifts: [["週一", "早班"], ["週二", "中班"], ["週三", "中班"], ["週四", "早班"], ["週五", "夜班"]],
    tiles: [
      ["結果可預測", "沒有隨機性，同樣的輸入永遠排出同樣的班表。"],
      ["鎖定班次", "先鎖住重要的班次，重新排班時它們不會被動到。"],
      ["員工視角", "員工登入後只看到自己的班表，也能填寫可上班時間。"],
    ],
  },
  "zh-CN": {
    pool: ["浩然", "佳怡", "婷婷", "子轩", "欣怡", "宇航"],
    locked: "美玲",
    runs: ["第 1 次", "第 2 次"],
    identical: "结果完全相同",
    myShifts: "浩然的排班",
    shifts: [["周一", "早班"], ["周二", "中班"], ["周三", "中班"], ["周四", "早班"], ["周五", "夜班"]],
    tiles: [
      ["结果可预期", "没有随机性，同样的输入永远排出同样的班表。"],
      ["锁定班次", "先锁定重要的班次，重新排班时它们保持不变。"],
      ["员工视角", "员工登录后只看到自己的排班，也能填写可上班时间。"],
    ],
  },
  ja: {
    pool: ["翔太", "陽菜", "結衣", "健", "葵", "蓮"],
    locked: "美緒",
    runs: ["1 回目", "2 回目"],
    identical: "結果は完全に一致",
    myShifts: "翔太のシフト",
    shifts: [["月", "早番"], ["火", "中番"], ["水", "中番"], ["木", "早番"], ["金", "夜勤"]],
    tiles: [
      ["決定的な結果", "ランダム性はなく、同じ入力からは常に同じシフト表ができます。"],
      ["シフトの固定", "重要なシフトを先に固定すれば、組み直しても動きません。"],
      ["スタッフ画面", "スタッフはログインすると自分のシフトだけを確認し、希望を登録できます。"],
    ],
  },
};

function MatchingRuns() {
  const { ref, tick } = useTicker(5200);
  const t = useDemoText(copy);
  return (
    <div ref={ref} className="w-full">
      <div key={tick} className="w-full space-y-2 font-mono text-xs">
        {t.runs.map((label, i) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
            <span className="font-sans text-muted-foreground">{label}</span>
            <span className="lb-type" style={{ animationDelay: `${i * 900}ms` }}>9f3a2c1e</span>
          </div>
        ))}
        <p className="lb-swap-in pt-1 text-center font-sans text-sm text-(--lb-success)" style={{ animationDelay: "2000ms" }}>
          {t.identical}
        </p>
      </div>
    </div>
  );
}

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

function PhoneList() {
  const { ref, tick } = useTicker(900);
  const t = useDemoText(copy);
  const current = tick % t.shifts.length;
  return (
    <div ref={ref} className="w-44 rounded-xl border-[5px] border-foreground/85 bg-background p-2.5 shadow-sm">
      <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-foreground/15" />
      <p className="px-1 text-[11px] font-semibold">{t.myShifts}</p>
      <ul className="mt-2 space-y-1">
        {t.shifts.map(([day, shift], i) => (
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
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-5xl min-w-0">
      <LiveBento>
        <BentoTile title={t.tiles[0][0]} body={t.tiles[0][1]}>
          <MatchingRuns />
        </BentoTile>
        <BentoTile title={t.tiles[1][0]} body={t.tiles[1][1]} delay={80}>
          <LockGrid />
        </BentoTile>
        <BentoTile title={t.tiles[2][0]} body={t.tiles[2][1]} delay={160}>
          <PhoneList />
        </BentoTile>
      </LiveBento>
    </div>
  );
}
