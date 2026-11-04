"use client";

import { TierProgress, type MembershipTier } from "./tier-progress";

const tiers: MembershipTier[] = [
  { id: "member", name: "Member", min: 0 },
  { id: "silver", name: "Silver", min: 1000, perks: ["Free shipping on orders over $30", "Early access to sales"] },
  { id: "gold", name: "Gold", min: 3000, perks: ["Free shipping on every order", "Double points in your birthday month", "Free returns pickup"] },
  { id: "black", name: "Black", min: 8000, perks: ["Personal stylist appointments", "Members-only restocks"] },
];

export default function TierProgressDemo() {
  return (
    <section aria-labelledby="tier-heading" className="w-full max-w-[52rem] space-y-5">
      <div>
        <h2 id="tier-heading" className="text-xl font-semibold tracking-tight">
          Rewards
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Earn 1 point for every $1 spent. Tiers are based on points earned this year.</p>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-3">
        <TierProgress tiers={tiers} points={1760} footnote="Points reset on Dec 31, 2026." />
        <TierProgress tiers={tiers} points={420} />
        <TierProgress tiers={tiers} points={9150} />
      </div>
    </section>
  );
}
