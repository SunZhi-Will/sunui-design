"use client";

import { useState } from "react";

import { HoldToRedeem } from "./hold-to-redeem";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const pts = (n: number) => `${new Intl.NumberFormat("en-US").format(n)} pts`;

export default function HoldToRedeemDemo() {
  const [balance, setBalance] = useState(640);
  const [voucherCode, setVoucherCode] = useState<string>();

  const rewards = [
    {
      id: "voucher",
      name: "$10 voucher",
      detail: "Applies to any order over $40.",
      cost: 500,
    },
    {
      id: "shipping",
      name: "Free shipping",
      detail: "One standard delivery, any order size.",
      cost: 200,
      redeemedCode: "SHIPFREE-29QX",
    },
    {
      id: "tote",
      name: "Canvas tote",
      detail: "Natural cotton, ships with your next order.",
      cost: 1200,
    },
  ];

  return (
    <section aria-labelledby="rewards-heading" className="w-full max-w-2xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="rewards-heading" className="text-xl font-semibold tracking-tight">
            Rewards
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Redeemed points can't be returned.</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Balance <span className="font-semibold text-foreground tabular-nums">{pts(balance)}</span>
        </p>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border bg-card text-card-foreground">
        {rewards.map((r) => {
          const short = r.cost - balance;
          return (
            <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{r.name}</p>
                <p className="text-sm text-muted-foreground">{r.detail}</p>
              </div>
              <HoldToRedeem
                className="sm:w-64 sm:shrink-0"
                cost={pts(r.cost)}
                defaultDone={Boolean(r.redeemedCode)}
                result={r.redeemedCode ?? (r.id === "voucher" ? voucherCode : undefined)}
                disabled={!r.redeemedCode && short > 0}
                disabledReason={short > 0 ? `Not enough points, ${pts(short)} more needed` : undefined}
                onConfirm={async () => {
                  await wait(700);
                  setBalance((b) => b - r.cost);
                  if (r.id === "voucher") setVoucherCode("SAVE10-H4KD");
                }}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
