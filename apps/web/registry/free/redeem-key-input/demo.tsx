"use client";

import { useState } from "react";

import { RedeemKeyInput, type LicenseState, type RedeemOutcome } from "./redeem-key-input";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// 模擬的授權後端：12 碼兌換碼本機比對，UUID 交給 Lemon Squeezy
const SUPPORTER_CODES = new Set(["K7QM4XPR2HND"]);
const PRO_KEYS: Record<string, RedeemOutcome> = {
  "3f2a9c1e-7b4d-4e8a-9c21-5d6e7f8a9b0c": { ok: true },
  "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d": { ok: false, error: "license_key activation limit reached" },
};

const pricing = {
  current: "$59",
  strike: "$89",
  basic: "$19",
  earlyBird: true,
  competitorYearly: "$229",
};

function Version() {
  return (
    <div className="pt-3 mt-1 border-t border-white/[0.06] flex items-center gap-2">
      <span className="text-[11px] text-[#8a8a8a]">Version v1.8.2</span>
      <span className="ml-auto text-[11px] text-[#a3a3a3]">Up to date</span>
    </div>
  );
}

export default function RedeemKeyInputDemo() {
  const [free, setFree] = useState<LicenseState>({ tier: "trial", trialDaysLeft: 9 });
  const [pro, setPro] = useState<LicenseState>({
    tier: "free",
    status: "grace",
    hasKey: true,
    maskedKey: "3F2A····9B0C",
    customerName: "Lin Wei",
  });

  return (
    <div className="grid w-full grid-cols-1 gap-6 rounded-xl bg-[#111111] p-3 sm:p-6 xl:grid-cols-2">
      <div className="min-w-0 flex justify-center">
        <RedeemKeyInput
          state={free}
          pricing={pricing}
          onActivate={async (code, kind) => {
            await wait(800);
            if (kind === "supporter") {
              if (!SUPPORTER_CODES.has(code)) return { ok: false, error: "invalid" };
              setFree({ tier: "supporter" });
              return { ok: true };
            }
            const r = PRO_KEYS[code.toLowerCase()] ?? { ok: false, error: "not_found" };
            if (r.ok) setFree({ tier: "pro", hasKey: true, status: "active", maskedKey: "3F2A····9B0C", customerName: "Lin Wei" });
            return r;
          }}
          onDeactivate={async () => {
            await wait(600);
            setFree({ tier: "free", freeExportsRemaining: 2, freeExportLimit: 3 });
          }}
          footer={<Version />}
        />
      </div>
      <div className="min-w-0 flex justify-center">
        <RedeemKeyInput
          state={pro}
          onActivate={() => ({ ok: true })}
          onRevalidate={async () => {
            await wait(900);
            setPro((s) => ({ ...s, tier: "pro", status: "active" }));
            return { ok: true };
          }}
          onDeactivate={async () => {
            await wait(600);
            setPro({ tier: "free", freeExportsRemaining: 3, freeExportLimit: 3 });
          }}
          footer={<Version />}
        />
      </div>
    </div>
  );
}
