"use client";

import { useState } from "react";

import { ChoiceCards, type ChoiceRow } from "./choice-cards";

// 簡化的像素圖示：錨、握手、水晶
const glyph = (d: string, fill: string) => <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true"><path d={d} fill={fill} /></svg>;

const rows: ChoiceRow[] = [
  {
    id: "stop",
    path: "stop",
    label: "Make it stop",
    brief: "Pull the anchor out",
    art: glyph("M5 1h2v2H5zM5 3h2v7H5zM3 4h6v1H3zM1 7h1v2h1v1h6V9h1V7h1v3h-1v1H2v-1H1z", "#e5e7eb"),
    gains: ["The tremors end for good"],
    costs: ["The altar goes dark forever"],
  },
  {
    id: "talk",
    path: "talk",
    label: "Talk it down",
    brief: "Loosen it just enough",
    art: glyph("M1 3h2v2h1v1h4V5h1V3h2v4h-1v1H9v1H3V8H2V7H1z", "#34d399"),
    gains: ["The wolves stay friendly"],
    costs: ["Shards drop half as often"],
  },
  {
    id: "take",
    path: "take",
    label: "Take its power",
    brief: "Hold it yourself",
    art: glyph("M5 0h2v1h1v1h1v4H8v1H7v1H5V7H4V6H3V2h1V1h1zM2 8h8v3H2z", "#f87171"),
    gains: ["Your tools strike twice"],
    costs: ["Villagers stop trading"],
    disabled: true,
    reason: "Needs the third altar key",
  },
];

const replies: Record<string, string> = {
  stop: "You grip the anchor and pull. The ground sighs, then goes still.",
  talk: "You kneel and speak low. The cracks stop spreading.",
};

export default function ChoiceCardsDemo() {
  const [line, setLine] = useState("The altar hums under your boots. Three ways to end this. Pick one, or walk away for now.");

  return (
    <div className="w-full max-w-4xl min-w-0 bg-[radial-gradient(ellipse_at_50%_20%,#1c2a44_0%,#070a12_70%)] p-3 sm:p-5">
      <ChoiceCards
        name="Shattered Altar"
        line={line}
        rows={rows}
        leaveLabel="Leave it for now"
        onChoose={(id) => setLine(replies[id] ?? line)}
        onClose={() => setLine("You step back. The altar keeps humming, patient.")}
      />
    </div>
  );
}
