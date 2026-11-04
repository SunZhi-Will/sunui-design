"use client";

import { ScanStats } from "./scan-stats";

export default function ScanStatsDemo() {
  return (
    <div className="w-full min-w-0">
      <ScanStats
        issuesFound={4}
        filesScanned={214}
        linesOfCode={18342}
        scanType="full"
        healthScore={72}
        healthScoreReason="One critical security issue and repeated N+1 query patterns lower the score."
      />
    </div>
  );
}
