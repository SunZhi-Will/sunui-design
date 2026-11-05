"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ChoiceCards, type ChoiceRow } from "./choice-cards";

// 簡化的像素圖示：錨、握手、水晶
const glyph = (d: string, fill: string) => <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true"><path d={d} fill={fill} /></svg>;

const art = {
  stop: glyph("M5 1h2v2H5zM5 3h2v7H5zM3 4h6v1H3zM1 7h1v2h1v1h6V9h1V7h1v3h-1v1H2v-1H1z", "#e5e7eb"),
  talk: glyph("M1 3h2v2h1v1h4V5h1V3h2v4h-1v1H9v1H3V8H2V7H1z", "#34d399"),
  take: glyph("M5 0h2v1h1v1h1v4H8v1H7v1H5V7H4V6H3V2h1V1h1zM2 8h8v3H2z", "#f87171"),
};

interface Copy {
  name: string;
  intro: string;
  leave: string;
  closed: string;
  replies: Record<"stop" | "talk", string>;
  rows: Record<"stop" | "talk" | "take", { label: string; brief: string; gain: string; cost: string }>;
  reason: string;
}

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", Copy> = {
  en: {
    name: "Shattered Altar",
    intro: "The altar hums under your boots. Three ways to end this. Pick one, or walk away for now.",
    leave: "Leave it for now",
    closed: "You step back. The altar keeps humming, patient.",
    replies: {
      stop: "You grip the anchor and pull. The ground sighs, then goes still.",
      talk: "You kneel and speak low. The cracks stop spreading.",
    },
    rows: {
      stop: { label: "Make it stop", brief: "Pull the anchor out", gain: "The tremors end for good", cost: "The altar goes dark forever" },
      talk: { label: "Talk it down", brief: "Loosen it just enough", gain: "The wolves stay friendly", cost: "Shards drop half as often" },
      take: { label: "Take its power", brief: "Hold it yourself", gain: "Your tools strike twice", cost: "Villagers stop trading" },
    },
    reason: "Needs the third altar key",
  },
  "zh-TW": {
    name: "破碎祭壇",
    intro: "祭壇在你腳下低鳴。有三種方式了結這件事，選一個，或先走開。",
    leave: "先不動它",
    closed: "你退後一步。祭壇仍在低鳴，耐心等著。",
    replies: {
      stop: "你握住錨，用力拔起。大地嘆了口氣，然後靜止。",
      talk: "你跪下低聲說話。裂縫不再擴散。",
    },
    rows: {
      stop: { label: "讓它停下", brief: "拔出錨", gain: "震動永遠停止", cost: "祭壇從此熄滅" },
      talk: { label: "安撫它", brief: "鬆開一點就好", gain: "狼群保持友善", cost: "碎片掉落減半" },
      take: { label: "奪取力量", brief: "由你自己掌握", gain: "工具效果加倍", cost: "村民不再交易" },
    },
    reason: "需要第三把祭壇鑰匙",
  },
  "zh-CN": {
    name: "破碎祭坛",
    intro: "祭坛在你脚下低鸣。有三种方式了结这件事，选一个，或者先走开。",
    leave: "先不动它",
    closed: "你退后一步。祭坛仍在低鸣，耐心等着。",
    replies: {
      stop: "你握住锚，用力拔起。大地叹了口气，然后静止。",
      talk: "你跪下低声说话。裂缝不再扩散。",
    },
    rows: {
      stop: { label: "让它停下", brief: "拔出锚", gain: "震动永远停止", cost: "祭坛从此熄灭" },
      talk: { label: "安抚它", brief: "松开一点就好", gain: "狼群保持友善", cost: "碎片掉落减半" },
      take: { label: "夺取力量", brief: "由你自己掌控", gain: "工具效果翻倍", cost: "村民不再交易" },
    },
    reason: "需要第三把祭坛钥匙",
  },
  ja: {
    name: "砕けた祭壇",
    intro: "足元で祭壇が低く唸っている。終わらせる方法は三つ。一つ選ぶか、今は立ち去るか。",
    leave: "今はやめておく",
    closed: "一歩下がる。祭壇は静かに唸り続け、待っている。",
    replies: {
      stop: "錨をつかんで引き抜く。大地がため息をつき、静まった。",
      talk: "ひざまずいて低く語りかける。亀裂の広がりが止まった。",
    },
    rows: {
      stop: { label: "止める", brief: "錨を引き抜く", gain: "揺れが永遠に止まる", cost: "祭壇は二度と光らない" },
      talk: { label: "なだめる", brief: "少しだけ緩める", gain: "狼たちは友好的なまま", cost: "欠片のドロップが半減" },
      take: { label: "力を奪う", brief: "自分の手に収める", gain: "道具の効果が二倍", cost: "村人が取引をやめる" },
    },
    reason: "三つ目の祭壇の鍵が必要",
  },
};

export default function ChoiceCardsDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [said, setSaid] = useState<"intro" | "closed" | "stop" | "talk">("intro");
  const line = said === "intro" ? t.intro : said === "closed" ? t.closed : t.replies[said];

  const rows: ChoiceRow[] = [
    { id: "stop", path: "stop", label: t.rows.stop.label, brief: t.rows.stop.brief, art: art.stop, gains: [t.rows.stop.gain], costs: [t.rows.stop.cost] },
    { id: "talk", path: "talk", label: t.rows.talk.label, brief: t.rows.talk.brief, art: art.talk, gains: [t.rows.talk.gain], costs: [t.rows.talk.cost] },
    { id: "take", path: "take", label: t.rows.take.label, brief: t.rows.take.brief, art: art.take, gains: [t.rows.take.gain], costs: [t.rows.take.cost], disabled: true, reason: t.reason },
  ];

  return (
    <div className="w-full max-w-4xl min-w-0 bg-[radial-gradient(ellipse_at_50%_20%,#1c2a44_0%,#070a12_70%)] p-3 sm:p-5">
      <ChoiceCards
        locale={locale}
        name={t.name}
        line={line}
        rows={rows}
        leaveLabel={t.leave}
        onChoose={(id) => {
          if (id === "stop" || id === "talk") setSaid(id);
        }}
        onClose={() => setSaid("closed")}
      />
    </div>
  );
}
