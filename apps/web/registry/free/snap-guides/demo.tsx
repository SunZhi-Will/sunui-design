"use client";

import { useState, type PointerEvent as ReactPointerEvent } from "react";

import { cn } from "@/lib/utils";

import { snapMove, snapResize, SnapGuides, type SnapGuide, type SnapRect } from "./snap-guides";

type Card = SnapRect & { id: string; title: string; meta: string; tone: string };

const initial: Card[] = [
  { id: "a", title: "Hero copy", meta: "Text", tone: "from-amber-200 to-orange-300", x: 16, y: 20, width: 140, height: 110 },
  { id: "b", title: "Product shot", meta: "Image", tone: "from-sky-200 to-indigo-300", x: 190, y: 64, width: 130, height: 120 },
  { id: "c", title: "Demo video", meta: "Video", tone: "from-emerald-200 to-teal-300", x: 52, y: 190, width: 150, height: 110 },
];

const HANDLES = [
  { dir: "nw", cls: "-top-1 -left-1 cursor-nw-resize" },
  { dir: "n", cls: "-top-1 left-1/2 -translate-x-1/2 cursor-n-resize" },
  { dir: "ne", cls: "-top-1 -right-1 cursor-ne-resize" },
  { dir: "e", cls: "top-1/2 -translate-y-1/2 -right-1 cursor-e-resize" },
  { dir: "se", cls: "-bottom-1 -right-1 cursor-se-resize" },
  { dir: "s", cls: "-bottom-1 left-1/2 -translate-x-1/2 cursor-s-resize" },
  { dir: "sw", cls: "-bottom-1 -left-1 cursor-sw-resize" },
  { dir: "w", cls: "top-1/2 -translate-y-1/2 -left-1 cursor-w-resize" },
];

export default function SnapGuidesDemo() {
  const [cards, setCards] = useState(initial);
  const [selected, setSelected] = useState<string | null>("b");
  const [guides, setGuides] = useState<SnapGuide[]>([]);

  const update = (id: string, rect: SnapRect) => setCards((all) => all.map((c) => (c.id === id ? { ...c, ...rect } : c)));

  // 拖動或縮放卡片：超過 3px 才開始，移動中計算對齊
  const onDown = (e: ReactPointerEvent, card: Card, dir?: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelected(card.id);
    const targets = cards.filter((c) => c.id !== card.id);
    const start: SnapRect = { x: card.x, y: card.y, width: card.width, height: card.height };
    const sx = e.clientX, sy = e.clientY;
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return;
      moved = true;
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!dir) {
        const r = snapMove(start, { x: dx, y: dy }, targets);
        setGuides(r.guides);
        update(card.id, { ...start, x: start.x + r.delta.x, y: start.y + r.delta.y });
        return;
      }
      let { x, y, width, height } = start;
      if (dir.includes("e")) width = Math.max(100, start.width + dx);
      if (dir.includes("w")) {
        width = Math.max(100, start.width - dx);
        x = start.x + (start.width - width);
      }
      if (dir.includes("s")) height = Math.max(100, start.height + dy);
      if (dir.includes("n")) {
        height = Math.max(100, start.height - dy);
        y = start.y + (start.height - height);
      }
      const r = snapResize({ x, y, width, height }, dir, targets);
      setGuides(r.guides);
      update(card.id, r.rect);
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
    <div className="w-full max-w-xl min-w-0">
      <div
        onPointerDown={() => setSelected(null)}
        className="relative h-[330px] w-full touch-none overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 select-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {cards.map((c) => {
          const isSelected = selected === c.id;
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`${c.title}, ${c.meta} card`}
              onFocus={() => setSelected(c.id)}
              onPointerDown={(e) => onDown(e, c)}
              className={cn("absolute cursor-move outline-none", isSelected && "ring-2 ring-blue-500")}
              style={{ left: c.x, top: c.y, width: c.width, height: c.height, borderRadius: 8 }}
            >
              <div className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-white shadow-lg">
                <div className={cn("min-h-0 flex-1 bg-gradient-to-br", c.tone)} />
                <div className="px-2.5 py-2 text-left">
                  <p className="truncate text-xs font-semibold text-gray-800">{c.title}</p>
                  <p className="text-[10px] text-gray-500">{c.meta}</p>
                </div>
              </div>
              {isSelected &&
                HANDLES.map((h) => (
                  <div
                    key={h.dir}
                    aria-hidden
                    className={cn("resize-handle absolute z-10 size-3 touch-none rounded-full bg-blue-500 after:absolute after:-inset-2 after:content-['']", h.cls)}
                    onPointerDown={(e) => onDown(e, c, h.dir)}
                  />
                ))}
            </div>
          );
        })}

        <SnapGuides guides={guides} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Drag a card near another card&apos;s edge or center, or resize it to match a neighbour&apos;s width.</p>
    </div>
  );
}
