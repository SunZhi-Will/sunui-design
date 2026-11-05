"use client";

import { useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { snapMove, SnapGuides, type SnapGuide, type SnapRect } from "./snap-guides";

type Card = SnapRect & { id: "a" | "b" | "c" };

const initial: Card[] = [
  { id: "a", x: 16, y: 24, width: 140, height: 110 },
  { id: "b", x: 190, y: 70, width: 130, height: 120 },
  { id: "c", x: 52, y: 196, width: 150, height: 100 },
];

// 中性示意縮圖：文案、照片、影片，用線條表示內容類型
const line = (children: ReactNode) => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const thumbs: Record<Card["id"], ReactNode> = {
  a: line(<path d="M4 6h16M4 10h12M4 14h16M4 18h9" />),
  b: line(<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-9 8" /></>),
  c: line(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3z" /></>),
};

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
      className="relative h-[320px] w-full max-w-xl min-w-0 touch-none overflow-hidden rounded-xl border border-border bg-background select-none"
      style={{ backgroundImage: "radial-gradient(circle, color-mix(in oklab, var(--muted-foreground) 30%, transparent) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
    >
      {cards.map((c) => (
        <div
          key={c.id}
          onPointerDown={(e) => onDown(e, c)}
          className="absolute flex cursor-move flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
          style={{ left: c.x, top: c.y, width: c.width, height: c.height }}
        >
          <div className="flex min-h-0 flex-1 items-center justify-center bg-muted text-muted-foreground">{thumbs[c.id]}</div>
          <p className="truncate px-2.5 py-2 text-xs font-semibold text-foreground">{title[c.id]}</p>
        </div>
      ))}
      <SnapGuides guides={guides} />
    </div>
  );
}
