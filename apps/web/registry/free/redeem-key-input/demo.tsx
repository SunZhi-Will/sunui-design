"use client";

import { RedeemKeyInput, type RedeemKeyFormat } from "./redeem-key-input";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const formats: RedeemKeyFormat[] = [
  { name: "Gift card", test: (raw) => raw.startsWith("GIFT") },
  { name: "License key", test: (raw) => raw.startsWith("SUNL") },
  { name: "Promo code", test: (raw) => raw.startsWith("SALE") },
];

const valid: Record<string, { title: string; detail: string }> = {
  "GIFT-2026-SUNU": { title: "$50 store credit", detail: "Added to your balance. Applies at checkout automatically." },
  "SUNL-PRO1-YEAR": { title: "Pro plan, 1 year", detail: "Active until Nov 5, 2027 on this account." },
};

export default function RedeemKeyInputDemo() {
  return (
    <section aria-labelledby="redeem-heading" className="w-full max-w-[52rem] space-y-5">
      <div>
        <h2 id="redeem-heading" className="text-xl font-semibold tracking-tight">
          Gift cards and codes
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Try GIFT-2026-SUNU or SUNL-PRO1-YEAR. Letters and numbers only, dashes are added for you.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <RedeemKeyInput
          formats={formats}
          onRedeem={async (code) => {
            await wait(700);
            const hit = valid[code];
            if (!hit) throw new Error("This code isn't valid. Check for typos or contact support.");
            return hit;
          }}
        />
        <RedeemKeyInput
          labels={{ title: "Redeemed on Oct 28" }}
          defaultRedeemed
          defaultCode="GIFT-HOLI-DAY5"
          result={{ title: "$25 store credit", detail: "Holiday gift from Mia. $11.40 remaining." }}
        />
      </div>
    </section>
  );
}
