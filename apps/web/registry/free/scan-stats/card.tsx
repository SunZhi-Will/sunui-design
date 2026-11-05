"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ScanStats } from "./scan-stats";

const reasons = {
  en: "One critical security issue and repeated N+1 query patterns lower the score.",
  "zh-TW": "一個嚴重的資安問題，加上反覆出現的 N+1 查詢，拉低了分數。",
  "zh-CN": "一个严重的安全问题，加上反复出现的 N+1 查询，拉低了评分。",
  ja: "重大なセキュリティ問題が1件と、繰り返される N+1 クエリがスコアを下げています。",
};

/** 型錄卡片：兩張統計卡，問題數與健康分數加上扣分原因。 */
export default function ScanStatsCard() {
  const locale = useDemoLocale();
  const reason = useDemoText(reasons);
  return (
    <div className="mx-auto w-64 [&>div]:mb-0">
      <ScanStats locale={locale} issuesFound={4} healthScore={72} healthScoreReason={reason} />
    </div>
  );
}
