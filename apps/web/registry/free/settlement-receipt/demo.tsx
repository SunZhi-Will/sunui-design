"use client";

import { SettlementReceipt, type SettlementPerson, type SettlementTransfer } from "./settlement-receipt";

// 四人聚餐，加 10% 服務費；炸薯條 90 分給四人，零頭由前兩位補
const people: SettlementPerson[] = [
  { id: "m1", name: "Amy", lines: [{ name: "Beef noodles", amount: 180 }, { name: "Fries", amount: 23 }], fee: 21, owe: 224 },
  { id: "m2", name: "Ben", lines: [{ name: "Carbonara", amount: 220 }, { name: "Fries", amount: 23 }], fee: 24, owe: 267 },
  { id: "m3", name: "Chloe", lines: [{ name: "Bubble tea", amount: 70 }, { name: "Fries", amount: 22 }], fee: 9, owe: 101 },
  { id: "m4", name: "Dev", lines: [{ name: "Bubble tea", amount: 70 }, { name: "Fries", amount: 22 }], fee: 9, owe: 101 },
];

const transfers: SettlementTransfer[] = [
  { from: "Ben", fromIndex: 1, to: "Amy", amount: 267 },
  { from: "Chloe", fromIndex: 2, to: "Amy", amount: 101 },
  { from: "Dev", fromIndex: 3, to: "Amy", amount: 101 },
];

export default function SettlementReceiptDemo() {
  return (
    <div className="w-full max-w-5xl min-w-0">
      <SettlementReceipt
        people={people}
        transfers={transfers}
        payer="Amy"
        subtotal={630}
        fee={63}
        discount={0}
        grand={693}
        counted={4}
        oddments={[{ item: "Fries", people: ["Amy", "Ben"] }]}
        onPrint={() => window.print()}
        fixed={false}
      />
    </div>
  );
}
