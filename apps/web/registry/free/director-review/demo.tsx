"use client";

import { useState } from "react";

import { DirectorReviewPanel, type DirectorSuggestion } from "./director-review";

const suggestions: DirectorSuggestion[] = [
  { id: "zoom-4200", kind: "zoom", reasonCode: "click_focus", confidence: 0.92, risk: "safe", startMs: 4200 },
  { id: "cut-12800", kind: "cut", reasonCode: "silence_gap", confidence: 0.81, risk: "destructive", startMs: 12800, impactDurationDeltaMs: -3400 },
  { id: "zoom-21500", kind: "zoom", reasonCode: "typing_focus", confidence: 0.74, risk: "review", startMs: 21500 },
];

const applied: DirectorSuggestion["kind"][] = ["zoom", "cut"];

export default function DirectorReviewDemo() {
  const [seek, setSeek] = useState<number | null>(null);

  return (
    <div className="flex w-full max-w-xs min-w-0 flex-col gap-3">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {seek === null ? "Recording: onboarding walkthrough, 0:48" : `Previewing from ${seek.toFixed(1)}s`}
      </p>
      <DirectorReviewPanel suggestions={suggestions} appliedKinds={applied} onSeek={setSeek} />
    </div>
  );
}
