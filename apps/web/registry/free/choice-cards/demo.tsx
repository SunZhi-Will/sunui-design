"use client";

import { useState } from "react";

import { ChoiceCards, type ChoiceRow } from "./choice-cards";

// 用字串畫 12x12 像素圖：字元對應調色盤，"." 是透明
function PixelArt({ rows, palette }: { rows: string[]; palette: Record<string, string> }) {
  return (
    <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) => (ch === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={palette[ch]} />)),
      )}
    </svg>
  );
}

// 錨被拔起：讓它停下
const anchorArt = (
  <PixelArt
    palette={{ a: "#e5e7eb", b: "#9ca3af", c: "#4b5563" }}
    rows={[
      ".....aa.....",
      "....a..a....",
      ".....aa.....",
      ".....ab.....",
      "...aaabaa...",
      ".....ab.....",
      ".....ab.....",
      ".a...ab...a.",
      ".ab..ab..ab.",
      "..abbabbba..",
      "...cbbbbc...",
      ".....cc.....",
    ]}
  />
);

// 兩隻手相握：跟它講好
const handsArt = (
  <PixelArt
    palette={{ a: "#34d399", b: "#059669", c: "#d1fae5" }}
    rows={[
      "............",
      "............",
      "..a......b..",
      ".aa......bb.",
      ".aac....cbb.",
      ".aaccccccbb.",
      "..accccccbb.",
      "...cccccc...",
      "....cccc....",
      "............",
      "............",
      "............",
    ]}
  />
);

// 握在手裡的紅水晶：拿走力量
const crystalArt = (
  <PixelArt
    palette={{ a: "#fecaca", b: "#f87171", c: "#991b1b", d: "#d6b38a" }}
    rows={[
      ".....ab.....",
      "....aabb....",
      "...aabbbc...",
      "...abbbcc...",
      "...abbbcc...",
      "....bbcc....",
      ".....bc.....",
      "..dddddddd..",
      ".dddddddddd.",
      ".dddddddddd.",
      "..dddddddd..",
      "...dddddd...",
    ]}
  />
);

const rows: ChoiceRow[] = [
  {
    id: "stop",
    path: "stop",
    label: "Make it stop",
    brief: "Pull the anchor out",
    art: anchorArt,
    gains: ["The tremors end for good"],
    costs: ["The altar goes dark forever"],
    meaning: "The quiet comes back, and so does the cold. Nothing grows here again.",
  },
  {
    id: "talk",
    path: "talk",
    label: "Talk it down",
    brief: "Loosen it just enough",
    art: handsArt,
    gains: ["The wolves stay friendly"],
    costs: ["Shards drop half as often"],
    meaning: "It keeps breathing, slower now. The valley learns to live beside it.",
  },
  {
    id: "take",
    path: "take",
    label: "Take its power",
    brief: "Hold it yourself",
    art: crystalArt,
    gains: ["Your tools strike twice"],
    costs: ["Villagers stop trading"],
    disabled: true,
    reason: "Needs the third altar key",
    meaning: "The red light crawls up your arm and does not let go.",
  },
];

const replies: Record<string, string> = {
  stop: "You grip the anchor and pull. The ground sighs, then goes still.",
  talk: "You kneel and speak low. The cracks stop spreading.",
};

export default function ChoiceCardsDemo() {
  const [line, setLine] = useState("The altar hums under your boots. Three ways to end this. Pick one, or walk away for now.");
  const [open, setOpen] = useState(true);

  return (
    <div className="w-full max-w-4xl bg-[radial-gradient(ellipse_at_50%_20%,#1c2a44_0%,#070a12_70%)] p-3 sm:p-5">
      {open ? (
        <ChoiceCards
          name="Shattered Altar"
          line={line}
          rows={rows}
          leaveLabel="Leave it for now"
          onChoose={(id) => setLine(replies[id] ?? line)}
          onClose={() => setOpen(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-auto block border-2 border-t-[#4a5d7c] border-r-[#05070b] border-b-[#05070b] border-l-[#4a5d7c] bg-[#0e141e] px-4 py-2 text-sm font-black tracking-[0.1em] text-[#d8dee9] shadow-[0_0_0_1px_#000] [text-shadow:1px_1px_0_#000]"
        >
          Return to the altar
        </button>
      )}
    </div>
  );
}
