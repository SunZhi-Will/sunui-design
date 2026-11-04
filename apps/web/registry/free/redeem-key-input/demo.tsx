"use client";

import { useState } from "react";

import { RedeemKeyInput, type LicenseState, type RedeemOutcome } from "./redeem-key-input";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// 模擬的授權後端：12 碼兌換碼本機比對，UUID 交給 Lemon Squeezy
const SUPPORTER_CODES = new Set(["K7QM4XPR2HND"]);
const PRO_KEYS: Record<string, RedeemOutcome> = {
  "3f2a9c1e-7b4d-4e8a-9c21-5d6e7f8a9b0c": { ok: true },
};

const pricing = { current: "$59", strike: "$89", basic: "$19", earlyBird: true, competitorYearly: "$229" };

export default function RedeemKeyInputDemo() {
  const [license, setLicense] = useState<LicenseState>({ tier: "trial", trialDaysLeft: 9 });

  return (
    <div className="flex w-full min-w-0 justify-center rounded-xl bg-[#111111] p-3 sm:p-6">
      <RedeemKeyInput
        state={license}
        pricing={pricing}
        onActivate={async (code, kind) => {
          await wait(800);
          if (kind === "supporter") {
            if (!SUPPORTER_CODES.has(code)) return { ok: false, error: "invalid" };
            setLicense({ tier: "supporter" });
            return { ok: true };
          }
          const r = PRO_KEYS[code.toLowerCase()] ?? { ok: false, error: "not_found" };
          if (r.ok) setLicense({ tier: "pro", hasKey: true, status: "active", maskedKey: "3F2A····9B0C", customerName: "Lin Wei" });
          return r;
        }}
        onDeactivate={async () => {
          await wait(600);
          setLicense({ tier: "free", freeExportsRemaining: 2, freeExportLimit: 3 });
        }}
        footer={
          <div className="mt-1 flex items-center gap-2 border-t border-white/[0.06] pt-3">
            <span className="text-[11px] text-[#8a8a8a]">Version v1.8.2</span>
            <span className="ml-auto text-[11px] text-[#a3a3a3]">Up to date</span>
          </div>
        }
      />
    </div>
  );
}
