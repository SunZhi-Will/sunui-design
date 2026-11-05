"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { TierProgress, type MembershipTier } from "./tier-progress";

const copy = {
  en: { add: "+pts", names: ["Member", "Silver", "Gold", "Black"] },
  "zh-TW": { add: "+點數", names: ["一般會員", "銀卡", "金卡", "黑卡"] },
  "zh-CN": { add: "+积分", names: ["普通会员", "银卡", "金卡", "黑卡"] },
  ja: { add: "+pt", names: ["メンバー", "シルバー", "ゴールド", "ブラック"] },
};

const base = [
  { id: "member", min: 0 },
  { id: "silver", min: 1000 },
  { id: "gold", min: 3000 },
  { id: "black", min: 8000 },
];

const steps = [420, 1760, 3400, 9150];

/** 型錄卡片：按 +pts 累積點數，半圓弧與指針彈到下一級，最高級蓋上朱紅章。 */
export default function TierProgressCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [step, setStep] = useState(1);
  const tiers: MembershipTier[] = base.map((tier, i) => ({ ...tier, name: t.names[i] }));
  return (
    <div className="relative mx-auto w-64">
      <TierProgress
        tiers={tiers}
        points={steps[step]}
        locale={locale}
        labels={{ eyebrow: "" }}
        className="max-w-none p-4 [&>div:first-of-type]:mt-0 [&>div:first-of-type]:max-w-[10rem]"
      />
      <button
        type="button"
        onClick={() => setStep((s) => (s + 1) % steps.length)}
        className="absolute top-3 left-3 rounded-md border border-border px-2 py-0.5 text-xs font-medium tabular-nums outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t.add}
      </button>
    </div>
  );
}
