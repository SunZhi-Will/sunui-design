"use client";

import { BillSplitRows, type SplitItem } from "./bill-split-rows";

const members = [
  { id: "m1", name: "Amy" },
  { id: "m2", name: "Ben" },
  { id: "m3", name: "Chloe" },
  { id: "m4", name: "Dev" },
];

// 最後一道還沒選誰吃，會標紅、不算進總額
const items: SplitItem[] = [
  { id: "i1", name: "Beef noodles", price: "180", qty: "1", eaters: ["m1"] },
  { id: "i2", name: "Bubble tea", price: "70", qty: "2", eaters: ["m3", "m4"] },
  { id: "i3", name: "Fries", price: "90", qty: "1", eaters: ["m1", "m2", "m3", "m4"] },
  { id: "i4", name: "Dumplings", price: "120", qty: "1", eaters: [] },
];

export default function BillSplitRowsDemo() {
  return (
    <div className="w-full max-w-3xl min-w-0">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Dishes</h2>
        <p className="text-sm text-muted-foreground">Enter each price and quantity, then tap who ate it. Shared dishes split evenly.</p>
      </div>
      <BillSplitRows members={members} defaultItems={items} />
    </div>
  );
}
