"use client";

import { useState } from "react";

import { HoldToRedeem } from "./hold-to-redeem";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const COST = 300;

export default function HoldToRedeemDemo() {
  const [shards, setShards] = useState(320);
  const short = COST - shards;

  return (
    <div className="w-full max-w-xs min-w-0 bg-[#070a12] p-4 text-[#e8edf5] shadow-[0_0_0_1px_#000] sm:p-5">
      <p className="mb-3 text-right text-sm font-black text-[#f5c542] tabular-nums [text-shadow:1px_1px_0_#000]">{shards} shards</p>
      <div className="flex min-w-0">
        <HoldToRedeem
          label="Break the altar seal"
          cost={`${COST} shards`}
          holdMs={2200}
          warnFrom={0.72}
          result="SEAL-7Q4K"
          disabled={short > 0}
          disabledReason={short > 0 ? `${short} more shards needed` : undefined}
          onConfirm={async () => {
            await wait(500);
            setShards((s) => s - COST);
          }}
        />
      </div>
    </div>
  );
}
