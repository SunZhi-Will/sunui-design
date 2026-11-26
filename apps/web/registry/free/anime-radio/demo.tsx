"use client";

import { useDemoText } from "@/lib/demo-locale";

import { AnimeRadioGroup } from "./anime-radio";

const copy = {
  en: { legend: "Pick your starting class", options: ["Swordsman", "Mage", "Archer"] },
  "zh-TW": { legend: "選擇起始職業", options: ["劍士", "法師", "弓手"] },
  "zh-CN": { legend: "选择起始职业", options: ["剑士", "法师", "弓手"] },
  ja: { legend: "最初のクラスを選ぶ", options: ["剣士", "魔法使い", "弓使い"] },
};

export default function AnimeRadioDemo() {
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-xs px-2 py-14">
      <AnimeRadioGroup legend={t.legend} name="class" defaultValue="sword" options={["sword", "mage", "archer"].map((value, i) => ({ value, label: t.options[i] }))} />
    </div>
  );
}
