"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { DirectorReviewPanel, type DirectorSuggestion } from "./director-review";

const suggestions: DirectorSuggestion[] = [
  { id: "zoom-4200", kind: "zoom", reasonCode: "click_focus", confidence: 0.92, risk: "safe", startMs: 4200 },
  { id: "cut-12800", kind: "cut", reasonCode: "silence_gap", confidence: 0.81, risk: "destructive", startMs: 12800, impactDurationDeltaMs: -3400 },
  { id: "zoom-21500", kind: "zoom", reasonCode: "typing_focus", confidence: 0.74, risk: "review", startMs: 21500 },
];

const applied: DirectorSuggestion["kind"][] = ["zoom", "cut"];

const copy = {
  en: { idle: "Recording: onboarding walkthrough, 0:48", seeking: (s: string) => `Previewing from ${s}s` },
  "zh-TW": { idle: "錄影：新手導覽，0:48", seeking: (s: string) => `從 ${s} 秒開始預覽` },
  "zh-CN": { idle: "录屏：新手引导，0:48", seeking: (s: string) => `从 ${s} 秒开始预览` },
  ja: { idle: "録画：オンボーディングの手順紹介、0:48", seeking: (s: string) => `${s} 秒からプレビュー中` },
};

export default function DirectorReviewDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [seek, setSeek] = useState<number | null>(null);

  return (
    <div className="flex w-full max-w-xs min-w-0 flex-col gap-3">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {seek === null ? t.idle : t.seeking(seek.toFixed(1))}
      </p>
      <DirectorReviewPanel locale={locale} suggestions={suggestions} appliedKinds={applied} onSeek={setSeek} />
    </div>
  );
}
