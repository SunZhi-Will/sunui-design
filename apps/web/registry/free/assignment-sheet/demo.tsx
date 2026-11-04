"use client";

import { useState } from "react";

import { AssignmentExplainSheet, type AssignmentExplanation, type ReplacementCandidates } from "./assignment-sheet";

const explanation: AssignmentExplanation = {
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
};

const replacement: ReplacementCandidates = {
  candidates: [
    { id: 3, name: "Ava", recommendation: "RECOMMENDED", label: "Recommended", reasons: [{ type: "positive", message: "Free all day" }] },
    { id: 2, name: "Leo", recommendation: "OVERTIME_RISK", label: "May go overtime", reasons: [{ type: "negative", message: "Would pass 40 hours this week" }] },
  ],
  excluded: [{ id: 4, name: "Noah", message: "On leave that day" }],
};

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function AssignmentSheetDemo() {
  const [open, setOpen] = useState(true);
  const [locked, setLocked] = useState(false);
  const [found, setFound] = useState<ReplacementCandidates | null>(null);

  return (
    <div className="flex w-full max-w-md min-w-0 flex-col gap-3">
      {open ? null : (
        <button type="button" onClick={() => setOpen(true)} className="w-fit rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground hover:bg-muted">
          Mia, Thu 9/24 Evening
        </button>
      )}
      <AssignmentExplainSheet
        open={open}
        onOpenChange={setOpen}
        title="Mia"
        dateLabel="9/24 (Thu)"
        explanation={{ ...explanation, locked }}
        canEdit
        onToggleLock={async (next) => {
          await wait(300);
          setLocked(next);
        }}
        onFindReplacement={() => {
          setFound(null);
          setTimeout(() => setFound(replacement), 700);
        }}
        replacement={found}
        onAssign={() => wait(500)}
        onRemove={async () => {
          await wait(400);
          setOpen(false);
        }}
      />
    </div>
  );
}
