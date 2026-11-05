"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ScanStats } from "./scan-stats";

const copy = {
  en: { scanType: "full", reason: "One critical security issue and repeated N+1 query patterns lower the score." },
  "zh-TW": { scanType: "完整", reason: "一個嚴重的資安問題，加上反覆出現的 N+1 查詢，拉低了分數。" },
  "zh-CN": { scanType: "完整", reason: "一个严重的安全问题，加上反复出现的 N+1 查询，拉低了评分。" },
  ja: { scanType: "フル", reason: "重大なセキュリティ問題が1件と、繰り返される N+1 クエリがスコアを下げています。" },
};

export default function ScanStatsDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="w-full min-w-0">
      <ScanStats
        locale={locale}
        issuesFound={4}
        filesScanned={214}
        linesOfCode={18342}
        scanType={t.scanType}
        healthScore={72}
        healthScoreReason={t.reason}
      />
    </div>
  );
}
