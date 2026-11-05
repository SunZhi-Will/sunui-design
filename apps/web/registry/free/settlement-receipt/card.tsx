"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { SettlementReceipt, type SettlementPerson, type SettlementTransfer } from "./settlement-receipt";

const sample = {
  en: { amy: "Amy", ben: "Ben", chloe: "Chloe", noodles: "Beef noodles", carbonara: "Carbonara", tea: "Bubble tea", description: "Dinner for three, 10% service fee." },
  "zh-TW": { amy: "小美", ben: "阿彬", chloe: "可樂", noodles: "牛肉麵", carbonara: "培根蛋麵", tea: "珍珠奶茶", description: "三人聚餐，加 10% 服務費。" },
  "zh-CN": { amy: "小美", ben: "阿彬", chloe: "可乐", noodles: "牛肉面", carbonara: "培根蛋面", tea: "珍珠奶茶", description: "三人聚餐，加收 10% 服务费。" },
  ja: { amy: "アミ", ben: "ベン", chloe: "クロエ", noodles: "牛肉麺", carbonara: "カルボナーラ", tea: "タピオカミルクティー", description: "3 人で食事、サービス料 10%。" },
};

/** 型錄卡片：結算收據，每人應付與轉帳方向，按「Copy to LINE」複製整份帳，可在框內捲動。 */
export default function SettlementReceiptCard() {
  const locale = useDemoLocale();
  const n = useDemoText(sample);

  // 三人聚餐加 10% 服務費
  const people: SettlementPerson[] = [
    { id: "m1", name: n.amy, lines: [{ name: n.noodles, amount: 180 }], fee: 18, owe: 198 },
    { id: "m2", name: n.ben, lines: [{ name: n.carbonara, amount: 220 }], fee: 22, owe: 242 },
    { id: "m3", name: n.chloe, lines: [{ name: n.tea, amount: 70 }], fee: 7, owe: 77 },
  ];

  const transfers: SettlementTransfer[] = [
    { from: n.ben, fromIndex: 1, to: n.amy, amount: 242 },
    { from: n.chloe, fromIndex: 2, to: n.amy, amount: 77 },
  ];

  return (
    <div className="mx-auto h-[230px] w-72 overflow-y-auto pr-1">
      <SettlementReceipt
        locale={locale}
        people={people}
        transfers={transfers}
        payer={n.amy}
        subtotal={470}
        fee={47}
        grand={517}
        counted={3}
        fixed={false}
        onPrint={() => {}}
        labels={{ description: n.description }}
      />
    </div>
  );
}
