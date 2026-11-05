"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ChoiceCards, type ChoiceRow } from "./choice-cards";

// 簡化的像素圖示：錨、握手
const glyph = (d: string, fill: string) => <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true"><path d={d} fill={fill} /></svg>;

const art = {
  stop: glyph("M5 1h2v2H5zM5 3h2v7H5zM3 4h6v1H3zM1 7h1v2h1v1h6V9h1V7h1v3h-1v1H2v-1H1z", "#e5e7eb"),
  talk: glyph("M1 3h2v2h1v1h4V5h1V3h2v4h-1v1H9v1H3V8H2V7H1z", "#34d399"),
};

const copy = {
  en: {
    name: "Altar",
    intro: "Three ways to end this. Pick one.",
    stop: { label: "Make it stop", brief: "Pull the anchor out", reply: "You pull. The ground goes still." },
    talk: { label: "Talk it down", brief: "Loosen it just enough", reply: "You speak low. The cracks stop." },
  },
  "zh-TW": {
    name: "祭壇",
    intro: "有三種方式了結這件事。選一個。",
    stop: { label: "讓它停下", brief: "拔出錨", reply: "你用力一拔。大地靜止了。" },
    talk: { label: "安撫它", brief: "鬆開一點就好", reply: "你低聲說話。裂縫停住了。" },
  },
  "zh-CN": {
    name: "祭坛",
    intro: "有三种方式了结这件事。选一个。",
    stop: { label: "让它停下", brief: "拔出锚", reply: "你用力一拔。大地静止了。" },
    talk: { label: "安抚它", brief: "松开一点就好", reply: "你低声说话。裂缝停住了。" },
  },
  ja: {
    name: "祭壇",
    intro: "終わらせる方法は三つ。一つ選べ。",
    stop: { label: "止める", brief: "錨を引き抜く", reply: "引き抜く。大地が静まった。" },
    talk: { label: "なだめる", brief: "少しだけ緩める", reply: "低く語りかける。亀裂が止まった。" },
  },
};

/** 型錄卡片：兩張像素選項卡，滑過會浮起，點下去對話框換成結果。 */
export default function ChoiceCardsCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [said, setSaid] = useState<"intro" | "stop" | "talk">("intro");
  const line = said === "intro" ? t.intro : t[said].reply;

  const rows: ChoiceRow[] = [
    { id: "stop", path: "stop", label: t.stop.label, brief: t.stop.brief, art: art.stop },
    { id: "talk", path: "talk", label: t.talk.label, brief: t.talk.brief, art: art.talk },
  ];

  // 卡片在窄寬度會直向堆疊，放進內部捲動區
  return (
    <div className="mx-auto h-[230px] w-72 overflow-y-auto overscroll-contain bg-[#070a12] px-3 pb-3">
      <ChoiceCards
        compact
        locale={locale}
        name={t.name}
        line={line}
        rows={rows}
        onChoose={(id) => {
          if (id === "stop" || id === "talk") setSaid(id);
        }}
      />
    </div>
  );
}
