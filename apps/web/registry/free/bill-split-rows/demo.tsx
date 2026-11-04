"use client";

import { BillSplitRows, type SplitItem } from "./bill-split-rows";

const people = [
  { id: "amy", name: "Amy" },
  { id: "ben", name: "Ben" },
  { id: "chloe", name: "Chloe" },
  { id: "dev", name: "Dev" },
];

const items: SplitItem[] = [
  { id: "noodles", name: "Beef noodles", amount: 18.5, sharedBy: ["amy", "ben"] },
  { id: "rice", name: "Fried rice", amount: 15, sharedBy: ["ben", "chloe"] },
  { id: "dumplings", name: "Dumplings", amount: 10, sharedBy: ["amy", "chloe", "dev"] },
  { id: "tofu", name: "Mapo tofu", amount: 16, sharedBy: ["dev"] },
  { id: "tea", name: "Iced tea", amount: 4, sharedBy: [] },
];

export default function BillSplitRowsDemo() {
  return (
    <section aria-labelledby="split-heading" className="w-full max-w-lg space-y-4">
      <div>
        <h2 id="split-heading" className="text-xl font-semibold tracking-tight">
          Friday dinner
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Tap who shared each dish. Totals update as you go.</p>
      </div>
      <BillSplitRows people={people} defaultItems={items} billTotal={63.5} />
    </section>
  );
}
