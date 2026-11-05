"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { HoldToRedeem } from "./hold-to-redeem";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const COST = 300;

const copy = {
  en: { shards: (n: number) => `${n} shards`, label: "Break the altar seal", short: (n: number) => `${n} more shards needed` },
  "zh-TW": { shards: (n: number) => `${n} 碎晶`, label: "打破祭壇封印", short: (n: number) => `還差 ${n} 碎晶` },
  "zh-CN": { shards: (n: number) => `${n} 碎晶`, label: "打破祭坛封印", short: (n: number) => `还差 ${n} 碎晶` },
  ja: { shards: (n: number) => `${n} 欠片`, label: "祭壇の封印を解く", short: (n: number) => `欠片があと ${n} 個必要` },
};

export default function HoldToRedeemDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [shards, setShards] = useState(320);
  const short = COST - shards;

  return (
    <div className="w-full max-w-xs min-w-0 bg-[#070a12] p-4 text-[#e8edf5] shadow-[0_0_0_1px_#000] sm:p-5">
      <p className="mb-3 text-right text-sm font-black text-[#f5c542] tabular-nums [text-shadow:1px_1px_0_#000]">{t.shards(shards)}</p>
      <div className="flex min-w-0">
        <HoldToRedeem
          locale={locale}
          label={t.label}
          cost={t.shards(COST)}
          holdMs={2200}
          warnFrom={0.72}
          result="SEAL-7Q4K"
          disabled={short > 0}
          disabledReason={short > 0 ? t.short(short) : undefined}
          onConfirm={async () => {
            await wait(500);
            setShards((s) => s - COST);
          }}
        />
      </div>
    </div>
  );
}
