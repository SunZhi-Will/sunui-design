"use client";

import { SettlementReceipt, type SettlementPerson, type SettlementTransfer } from "./settlement-receipt";

// 三人聚餐加 10% 服務費
const people: SettlementPerson[] = [
  { id: "m1", name: "Amy", lines: [{ name: "Beef noodles", amount: 180 }], fee: 18, owe: 198 },
  { id: "m2", name: "Ben", lines: [{ name: "Carbonara", amount: 220 }], fee: 22, owe: 242 },
  { id: "m3", name: "Chloe", lines: [{ name: "Bubble tea", amount: 70 }], fee: 7, owe: 77 },
];

const transfers: SettlementTransfer[] = [
  { from: "Ben", fromIndex: 1, to: "Amy", amount: 242 },
  { from: "Chloe", fromIndex: 2, to: "Amy", amount: 77 },
];

/** 型錄卡片：結算收據，每人應付與轉帳方向，按「Copy to LINE」複製整份帳，可在框內捲動。 */
export default function SettlementReceiptCard() {
  return (
    <div className="mx-auto h-[230px] w-72 overflow-y-auto pr-1">
      <SettlementReceipt
        people={people}
        transfers={transfers}
        payer="Amy"
        subtotal={470}
        fee={47}
        grand={517}
        counted={3}
        fixed={false}
        onPrint={() => {}}
        labels={{ description: "Dinner for three, 10% service fee." }}
      />
    </div>
  );
}
