"use client";

import { RecapActiveMonth } from "./recap-active-month";

// 限時動態上方的進度條：已看過的填滿，目前這張填一半
function ProgressStrip({ current, total }: { current: number; total: number }) {
  return (
    <div aria-hidden className="mb-2 flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/30">
          <div className="h-full bg-white" style={{ width: i < current ? "100%" : i === current ? "50%" : "0%" }} />
        </div>
      ))}
    </div>
  );
}

// 年度回顧裡的「最活躍月份」那一張，放在 9:16 的限時動態卡片裡
export default function RecapActiveMonthDemo() {
  return (
    <div className="mx-auto w-full max-w-[340px] min-w-0 rounded-3xl bg-[#0f0f0f] p-2">
      <ProgressStrip current={6} total={12} />
      <div className="aspect-[9/16] w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
        <RecapActiveMonth data={{ monthIndex: 9, count: 38 }} />
      </div>
    </div>
  );
}
