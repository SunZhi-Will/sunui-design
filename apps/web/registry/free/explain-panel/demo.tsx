"use client";

import { useState } from "react";

import {
  AssignmentExplainSheet,
  DirectorReviewPanel,
  type AssignmentExplanation,
  type DirectorSuggestion,
  type ReplacementCandidates,
} from "./explain-panel";

const explanations: Record<string, AssignmentExplanation> = {
  Mia: {
    shift: "Evening",
    shiftTime: "15:00-23:00",
    locked: false,
    reasons: [
      { type: "positive", message: "Marked this evening as preferred" },
      { type: "positive", message: "Only 3 shifts so far this week, below the team average" },
      { type: "neutral", message: "Has the barista skill this shift needs" },
    ],
    candidates: [
      { id: 2, name: "Leo", status: "warning", reasons: ["Would reach 5 shifts this week"] },
      { id: 3, name: "Ava", status: "available", reasons: ["Available, no preference set"] },
      { id: 4, name: "Noah", status: "excluded", reasons: ["On leave that day"] },
    ],
  },
  Leo: {
    shift: "Morning",
    shiftTime: "07:00-15:00",
    locked: true,
    reasons: [
      { type: "positive", message: "Opening needs a key holder" },
      { type: "negative", message: "Worked the night shift two days before" },
    ],
    candidates: [{ id: 5, name: "Iris", status: "excluded", reasons: ["Not a key holder"] }],
  },
};

const replacement: ReplacementCandidates = {
  candidates: [
    {
      id: 3,
      name: "Ava",
      recommendation: "RECOMMENDED",
      label: "Recommended",
      reasons: [
        { type: "positive", message: "Free all day" },
        { type: "positive", message: "Fewest hours this week" },
      ],
    },
    {
      id: 2,
      name: "Leo",
      recommendation: "OVERTIME_RISK",
      label: "May go overtime",
      reasons: [
        { type: "positive", message: "Knows the evening routine" },
        { type: "negative", message: "Would pass 40 hours this week" },
      ],
    },
  ],
  excluded: [{ id: 4, name: "Noah", message: "On leave that day" }],
};

const suggestions: DirectorSuggestion[] = [
  { id: "zoom-4200", kind: "zoom", reasonCode: "click_focus", confidence: 0.92, risk: "safe", startMs: 4200 },
  { id: "cut-12800", kind: "cut", reasonCode: "silence_gap", confidence: 0.81, risk: "destructive", startMs: 12800, impactDurationDeltaMs: -3400 },
  { id: "zoom-21500", kind: "zoom", reasonCode: "typing_focus", confidence: 0.74, risk: "review", startMs: 21500 },
  { id: "shortcut-33100", kind: "shortcut", reasonCode: "shortcut_used", confidence: 0.88, risk: "safe", startMs: 33100 },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ExplainPanelDemo() {
  const [person, setPerson] = useState<"Mia" | "Leo">("Mia");
  const [open, setOpen] = useState(true);
  const [locked, setLocked] = useState<Record<string, boolean>>({ Mia: false, Leo: true });
  const [found, setFound] = useState<ReplacementCandidates | null>(null);
  const [seek, setSeek] = useState<number | null>(null);

  const base = explanations[person];
  const explanation = { ...base, locked: locked[person] ?? base.locked };

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 items-start gap-6 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Thu 9/24:</span>
          {(["Mia", "Leo"] as const).map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={open && person === name}
              onClick={() => {
                setPerson(name);
                setFound(null);
                setOpen(true);
              }}
              className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-card px-2 font-medium text-foreground transition-colors hover:bg-muted aria-pressed:ring-2 aria-pressed:ring-foreground aria-pressed:ring-offset-1 aria-pressed:ring-offset-card"
            >
              <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: name === "Mia" ? "#2563EB" : "#16A34A" }} />
              {name}
            </button>
          ))}
        </div>
        <AssignmentExplainSheet
          open={open}
          onOpenChange={setOpen}
          title={person}
          dateLabel="9/24 (Thu)"
          explanation={explanation}
          canEdit
          onToggleLock={async (next) => {
            await wait(300);
            setLocked((m) => ({ ...m, [person]: next }));
          }}
          onFindReplacement={() => {
            setFound(null);
            setTimeout(() => setFound(replacement), 700);
          }}
          replacement={found}
          onAssign={async () => {
            await wait(500);
          }}
          onRemove={async () => {
            await wait(400);
            setOpen(false);
          }}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {seek === null ? "Recording: onboarding walkthrough, 0:48" : `Previewing from ${seek.toFixed(1)}s`}
        </p>
        <DirectorReviewPanel suggestions={suggestions} onSeek={setSeek} />
      </div>
    </div>
  );
}
