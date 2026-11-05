"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { BillSplitRows, type SplitItem } from "./bill-split-rows";

const copy = {
  en: {
    heading: "Dishes",
    intro: "Enter each price and quantity, then tap who ate it. Shared dishes split evenly.",
    names: ["Amy", "Ben", "Chloe", "Dev"],
    dishes: ["Beef noodles", "Bubble tea", "Fries", "Dumplings"],
  },
  "zh-TW": {
    heading: "餐點",
    intro: "輸入每道的價格與數量，再點選誰吃了。共享的餐點平均分攤。",
    names: ["小美", "阿斌", "可欣", "大偉"],
    dishes: ["牛肉麵", "珍珠奶茶", "薯條", "水餃"],
  },
  "zh-CN": {
    heading: "菜品",
    intro: "输入每道菜的价格和数量，再点选谁吃了。共享的菜品平均分摊。",
    names: ["小美", "阿斌", "可欣", "大伟"],
    dishes: ["牛肉面", "珍珠奶茶", "薯条", "水饺"],
  },
  ja: {
    heading: "料理",
    intro: "料理ごとに価格と数量を入力し、食べた人をタップします。シェアした料理は均等に割り勘します。",
    names: ["美咲", "健太", "千夏", "大輔"],
    dishes: ["牛肉麺", "タピオカミルクティー", "フライドポテト", "水餃子"],
  },
};

export default function BillSplitRowsDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const members = ["m1", "m2", "m3", "m4"].map((id, k) => ({ id, name: t.names[k] }));
  // 最後一道還沒選誰吃，會標紅、不算進總額
  const items: SplitItem[] = [
    { id: "i1", name: t.dishes[0], price: "180", qty: "1", eaters: ["m1"] },
    { id: "i2", name: t.dishes[1], price: "70", qty: "2", eaters: ["m3", "m4"] },
    { id: "i3", name: t.dishes[2], price: "90", qty: "1", eaters: ["m1", "m2", "m3", "m4"] },
    { id: "i4", name: t.dishes[3], price: "120", qty: "1", eaters: [] },
  ];

  return (
    <div className="w-full max-w-3xl min-w-0">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{t.heading}</h2>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </div>
      <BillSplitRows key={locale} locale={locale} members={members} defaultItems={items} />
    </div>
  );
}
