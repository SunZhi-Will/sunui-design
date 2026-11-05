"use client";

import { RecapKeywordCloud, type RecapKeyword } from "./recap-keyword-cloud";

// 一年貼文裡最常出現的字，依次數由多到少
const keywords: RecapKeyword[] = [
  { word: "coffee", count: 64 },
  { word: "design", count: 52 },
  { word: "Taipei", count: 41 },
  { word: "cats", count: 33 },
  { word: "side project", count: 24 },
  { word: "rain", count: 17 },
  { word: "ramen", count: 11 },
  { word: "books", count: 8 },
];

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

// 年度回顧裡的「關鍵字」那一張，放在 9:16 的限時動態卡片裡
export default function RecapKeywordCloudDemo() {
  return (
    <div className="mx-auto w-full max-w-[340px] min-w-0 rounded-3xl bg-[#0f0f0f] p-2">
      <ProgressStrip current={4} total={12} />
      <div className="aspect-[9/16] w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
        <RecapKeywordCloud keywords={keywords} />
      </div>
    </div>
  );
}
