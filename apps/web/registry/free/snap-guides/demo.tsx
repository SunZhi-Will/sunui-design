"use client";

import { useState, type PointerEvent as ReactPointerEvent } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { snapMove, SnapGuides, type SnapGuide, type SnapRect } from "./snap-guides";

type Card = SnapRect & { id: "a" | "b" | "c"; tone: string };

const initial: Card[] = [
  { id: "a", tone: "from-amber-200 to-orange-300", x: 16, y: 24, width: 140, height: 110 },
  { id: "b", tone: "from-sky-200 to-indigo-300", x: 190, y: 70, width: 130, height: 120 },
  { id: "c", tone: "from-emerald-200 to-teal-300", x: 52, y: 196, width: 150, height: 100 },
];

const titles = {
  en: { a: "Hero copy", b: "Product shot", c: "Demo video" },
  "zh-TW": { a: "主視覺文案", b: "產品照", c: "示範影片" },
  "zh-CN": { a: "主视觉文案", b: "产品图", c: "演示视频" },
  ja: { a: "メインコピー", b: "商品写真", c: "デモ動画" },
};

export default function SnapGuidesDemo() {
  const title = useDemoText(titles);
  const [cards, setCards] = useState(initial);
  const [guides, setGuides] = useState<SnapGuide[]>([]);

  // 拖動卡片，移動中計算與其他卡片的對齊線
  const onDown = (e: ReactPointerEvent, card: Card) => {
    if (e.button !== 0) return;
    const targets = cards.filter((c) => c.id !== card.id);
    const sx = e.clientX, sy = e.clientY;
    const move = (ev: PointerEvent) => {
      const r = snapMove(card, { x: ev.clientX - sx, y: ev.clientY - sy }, targets);
      setGuides(r.guides);
      setCards((all) => all.map((c) => (c.id === card.id ? { ...c, x: card.x + r.delta.x, y: card.y + r.delta.y } : c)));
    };
    const up = () => {
      setGuides([]);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      className="relative h-[320px] w-full max-w-xl min-w-0 touch-none overflow-hidden rounded-xl border border-gray-200 bg-gray-50 select-none"
      style={{ backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)", backgroundSize: "20px 20px" }}
    >
      {cards.map((c) => (
        <div
          key={c.id}
          onPointerDown={(e) => onDown(e, c)}
          className="absolute flex cursor-move flex-col overflow-hidden rounded-lg bg-white shadow-lg"
          style={{ left: c.x, top: c.y, width: c.width, height: c.height }}
        >
          <div className={`min-h-0 flex-1 bg-gradient-to-br ${c.tone}`} />
          <p className="truncate px-2.5 py-2 text-xs font-semibold text-gray-800">{title[c.id]}</p>
        </div>
      ))}
      <SnapGuides guides={guides} />
    </div>
  );
}
