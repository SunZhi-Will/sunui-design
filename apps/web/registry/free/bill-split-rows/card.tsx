"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { BillSplitRows, type SplitItem } from "./bill-split-rows";

const copy = {
  en: { names: ["Amy", "Ben", "Chloe"], dish: "Bubble tea" },
  "zh-TW": { names: ["小美", "阿斌", "可欣"], dish: "珍珠奶茶" },
  "zh-CN": { names: ["小美", "阿斌", "可欣"], dish: "珍珠奶茶" },
  ja: { names: ["美咲", "健太", "千夏"], dish: "タピオカ" },
};

/** 型錄卡片：一道菜，點選誰吃了，下方即時算出每人分攤。 */
export default function BillSplitRowsCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const members = ["m1", "m2", "m3"].map((id, k) => ({ id, name: t.names[k] }));
  const items: SplitItem[] = [{ id: "i1", name: t.dish, price: "70", qty: "2", eaters: ["m1", "m3"] }];

  return (
    <div className="mx-auto w-[300px]">
      <BillSplitRows key={locale} locale={locale} members={members} defaultItems={items} />
    </div>
  );
}
