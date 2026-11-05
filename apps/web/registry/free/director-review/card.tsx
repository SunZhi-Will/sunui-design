"use client";

import { useDemoLocale } from "@/lib/demo-locale";

import { DirectorReviewPanel, type DirectorSuggestion } from "./director-review";

const suggestions: DirectorSuggestion[] = [
  { id: "zoom-4200", kind: "zoom", reasonCode: "click_focus", confidence: 0.92, risk: "safe", startMs: 4200 },
  { id: "cut-12800", kind: "cut", reasonCode: "silence_gap", confidence: 0.81, risk: "destructive", startMs: 12800, impactDurationDeltaMs: -3400 },
];

const applied: DirectorSuggestion["kind"][] = ["zoom", "cut"];

/** 型錄卡片：剪輯建議清單，逐條接受或略過，上方計畫摘要即時更新。 */
export default function DirectorReviewCard() {
  const locale = useDemoLocale();
  return (
    // 面板比卡片高，給一個內部捲動區
    <div className="mx-auto h-56 w-72 overflow-y-auto overscroll-contain">
      <DirectorReviewPanel locale={locale} suggestions={suggestions} appliedKinds={applied} />
    </div>
  );
}
