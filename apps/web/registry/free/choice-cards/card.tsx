"use client";

import { useState } from "react";

import { ChoiceCards, type ChoiceRow } from "./choice-cards";

// 簡化的像素圖示：錨、握手
const glyph = (d: string, fill: string) => <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true"><path d={d} fill={fill} /></svg>;

const rows: ChoiceRow[] = [
  { id: "stop", path: "stop", label: "Make it stop", brief: "Pull the anchor out", art: glyph("M5 1h2v2H5zM5 3h2v7H5zM3 4h6v1H3zM1 7h1v2h1v1h6V9h1V7h1v3h-1v1H2v-1H1z", "#e5e7eb") },
  { id: "talk", path: "talk", label: "Talk it down", brief: "Loosen it just enough", art: glyph("M1 3h2v2h1v1h4V5h1V3h2v4h-1v1H9v1H3V8H2V7H1z", "#34d399") },
];

const replies: Record<string, string> = {
  stop: "You pull. The ground goes still.",
  talk: "You speak low. The cracks stop.",
};

/** 型錄卡片：兩張像素選項卡，滑過會浮起，點下去對話框換成結果。 */
export default function ChoiceCardsCard() {
  const [line, setLine] = useState("Three ways to end this. Pick one.");

  // 卡片在窄寬度會直向堆疊，放進內部捲動區
  return (
    <div className="mx-auto h-[230px] w-72 overflow-y-auto overscroll-contain bg-[#070a12] px-3 pb-3">
      <ChoiceCards compact name="Altar" line={line} rows={rows} onChoose={(id) => setLine(replies[id] ?? line)} />
    </div>
  );
}
