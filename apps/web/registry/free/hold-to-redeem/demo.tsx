"use client";

import { useState } from "react";

import { HoldToRedeem } from "./hold-to-redeem";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type Offering = { id: string; name: string; cost: number; warnFrom?: number; holdMs?: number; code?: string; flaky?: boolean };

const offerings: Offering[] = [
  { id: "lantern", name: "Spirit lantern", cost: 40, holdMs: 900 },
  { id: "saddle", name: "Wolf saddle", cost: 120, holdMs: 1400, flaky: true },
  { id: "seal", name: "Break the altar seal", cost: 300, holdMs: 2200, warnFrom: 0.72, code: "SEAL-7Q4K" },
];

export default function HoldToRedeemDemo() {
  const [shards, setShards] = useState(320);
  const [tries, setTries] = useState(0);

  return (
    <section
      aria-labelledby="altar-heading"
      className="w-full max-w-3xl bg-[#070a12] p-4 text-[#e8edf5] shadow-[0_0_0_1px_#000] sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 id="altar-heading" className="text-lg font-black tracking-[0.14em] text-white [text-shadow:2px_2px_0_#000]">
            SHATTERED ALTAR
          </h2>
          <p className="mt-1 text-sm font-bold text-[#8a97ab]">Offer shards to the altar. Let go early to keep them.</p>
        </div>
        <p className="text-sm font-black text-[#f5c542] tabular-nums [text-shadow:1px_1px_0_#000]">{shards} shards</p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {offerings.map((o) => {
          const short = o.cost - shards;
          return (
            <li key={o.id} className="flex min-w-0">
              <HoldToRedeem
                label={o.name}
                cost={`${o.cost} shards`}
                holdMs={o.holdMs}
                warnFrom={o.warnFrom}
                result={o.code}
                disabled={short > 0}
                disabledReason={short > 0 ? `${short} more shards needed` : undefined}
                onConfirm={async () => {
                  await wait(500);
                  // 鞍座第一次會失敗：示範圈圈變紅倒退
                  if (o.flaky && tries === 0) {
                    setTries(1);
                    throw new Error("The wolf shied away");
                  }
                  setShards((s) => s - o.cost);
                }}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
