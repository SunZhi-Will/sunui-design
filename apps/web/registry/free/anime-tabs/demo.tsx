"use client";

import { useDemoText } from "@/lib/demo-locale";

import { AnimeTabs } from "./anime-tabs";

const copy = {
  en: { label: "Character", tabs: ["Profile", "Skills", "Gear"], body: ["A wandering swordsman who keeps a map of every town he has saved.", "Wind Cut, Guard Break and a counter that lands on the third parry.", "Iron blade, travel cloak and a charm from the northern shrine."] },
  "zh-TW": { label: "角色", tabs: ["簡介", "技能", "裝備"], body: ["四處流浪的劍士，留著每一座他救過的城鎮的地圖。", "風切、破防，以及第三次格擋時發動的反擊。", "鐵劍、旅行斗篷，還有北方神社的護身符。"] },
  "zh-CN": { label: "角色", tabs: ["简介", "技能", "装备"], body: ["四处流浪的剑士，留着每一座他救过的城镇的地图。", "风切、破防，以及第三次格挡时发动的反击。", "铁剑、旅行斗篷，还有北方神社的护身符。"] },
  ja: { label: "キャラクター", tabs: ["プロフィール", "スキル", "装備"], body: ["救った町の地図をすべて持ち歩く、さすらいの剣士。", "風斬り、ガードブレイク、三度目のパリィで決まるカウンター。", "鉄の剣、旅のマント、北の社のお守り。"] },
};

export default function AnimeTabsDemo() {
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-sm px-2 py-14">
      <AnimeTabs label={t.label} tabs={t.tabs.map((label, i) => ({ value: String(i), label, content: <p className="text-sm leading-relaxed text-muted-foreground">{t.body[i]}</p> }))} />
    </div>
  );
}
