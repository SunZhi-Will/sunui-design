"use client";

import { BillSplitRows, type SplitItem } from "./bill-split-rows";

const members = [
  { id: "m1", name: "Amy" },
  { id: "m2", name: "Ben" },
  { id: "m3", name: "Chloe" },
];

const items: SplitItem[] = [{ id: "i1", name: "Bubble tea", price: "70", qty: "2", eaters: ["m1", "m3"] }];

/** 型錄卡片：一道菜，點選誰吃了，下方即時算出每人分攤。 */
export default function BillSplitRowsCard() {
  return (
    <div className="mx-auto w-[300px]">
      <BillSplitRows members={members} defaultItems={items} />
    </div>
  );
}
