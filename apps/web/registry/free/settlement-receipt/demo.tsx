"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { SettlementReceipt, type SettlementPerson, type SettlementTransfer } from "./settlement-receipt";

const sample = {
  en: { amy: "Amy", ben: "Ben", chloe: "Chloe", dev: "Dev", noodles: "Beef noodles", carbonara: "Carbonara", tea: "Bubble tea", fries: "Fries" },
  "zh-TW": { amy: "小美", ben: "阿彬", chloe: "可樂", dev: "大衛", noodles: "牛肉麵", carbonara: "培根蛋麵", tea: "珍珠奶茶", fries: "炸薯條" },
  "zh-CN": { amy: "小美", ben: "阿彬", chloe: "可乐", dev: "大卫", noodles: "牛肉面", carbonara: "培根蛋面", tea: "珍珠奶茶", fries: "炸薯条" },
  ja: { amy: "アミ", ben: "ベン", chloe: "クロエ", dev: "デヴ", noodles: "牛肉麺", carbonara: "カルボナーラ", tea: "タピオカミルクティー", fries: "フライドポテト" },
};

export default function SettlementReceiptDemo() {
  const locale = useDemoLocale();
  const n = useDemoText(sample);

  // 四人聚餐，加 10% 服務費；炸薯條 90 分給四人，零頭由前兩位補
  const people: SettlementPerson[] = [
    { id: "m1", name: n.amy, lines: [{ name: n.noodles, amount: 180 }, { name: n.fries, amount: 23 }], fee: 21, owe: 224 },
    { id: "m2", name: n.ben, lines: [{ name: n.carbonara, amount: 220 }, { name: n.fries, amount: 23 }], fee: 24, owe: 267 },
    { id: "m3", name: n.chloe, lines: [{ name: n.tea, amount: 70 }, { name: n.fries, amount: 22 }], fee: 9, owe: 101 },
    { id: "m4", name: n.dev, lines: [{ name: n.tea, amount: 70 }, { name: n.fries, amount: 22 }], fee: 9, owe: 101 },
  ];

  const transfers: SettlementTransfer[] = [
    { from: n.ben, fromIndex: 1, to: n.amy, amount: 267 },
    { from: n.chloe, fromIndex: 2, to: n.amy, amount: 101 },
    { from: n.dev, fromIndex: 3, to: n.amy, amount: 101 },
  ];

  return (
    <div className="w-full max-w-5xl min-w-0">
      <SettlementReceipt
        locale={locale}
        people={people}
        transfers={transfers}
        payer={n.amy}
        subtotal={630}
        fee={63}
        discount={0}
        grand={693}
        counted={4}
        oddments={[{ item: n.fries, people: [n.amy, n.ben] }]}
        onPrint={() => window.print()}
        fixed={false}
      />
    </div>
  );
}
