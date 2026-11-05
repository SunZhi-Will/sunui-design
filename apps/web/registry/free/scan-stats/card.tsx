"use client";

import { ScanStats } from "./scan-stats";

/** 型錄卡片：兩張統計卡，問題數與健康分數加上扣分原因。 */
export default function ScanStatsCard() {
  return (
    <div className="mx-auto w-64 [&>div]:mb-0">
      <ScanStats
        issuesFound={4}
        healthScore={72}
        healthScoreReason="One critical security issue and repeated N+1 query patterns lower the score."
      />
    </div>
  );
}
