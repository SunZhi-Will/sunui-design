"use client";

import { useState } from "react";

import { TierProgress, type MembershipTier } from "./tier-progress";

const tiers: MembershipTier[] = [
  { id: "member", name: "Member", min: 0 },
  { id: "silver", name: "Silver", min: 1000 },
  { id: "gold", name: "Gold", min: 3000 },
  { id: "black", name: "Black", min: 8000 },
];

const steps = [420, 1760, 3400, 9150];

/** 型錄卡片：按 +pts 累積點數，半圓弧與指針彈到下一級，最高級蓋上朱紅章。 */
export default function TierProgressCard() {
  const [step, setStep] = useState(1);
  return (
    <div className="relative mx-auto w-64">
      <TierProgress
        tiers={tiers}
        points={steps[step]}
        labels={{ eyebrow: "" }}
        className="max-w-none p-4 [&>div:first-of-type]:mt-0 [&>div:first-of-type]:max-w-[10rem]"
      />
      <button
        type="button"
        onClick={() => setStep((s) => (s + 1) % steps.length)}
        className="absolute top-3 left-3 rounded-md border border-border px-2 py-0.5 text-xs font-medium tabular-nums outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        +pts
      </button>
    </div>
  );
}
