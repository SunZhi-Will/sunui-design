"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { intersects, SelectionBounds, SelectionMarquee, type BoundsItem } from "./selection-bounds";

type Card = BoundsItem & { kind: "note" | "photo" | "link" };

const initial: Card[] = [
  { id: "note", kind: "note", x: 16, y: 24, width: 150, height: 110 },
  { id: "photo", kind: "photo", x: 186, y: 48, width: 130, height: 130, rotation: -4 },
  { id: "link", kind: "link", x: 40, y: 196, width: 190, height: 96 },
];

function CardBody({ kind }: { kind: Card["kind"] }) {
  if (kind === "note")
    return (
      <div className="p-3 text-left">
        <p className="text-xs font-semibold text-gray-800">Launch checklist</p>
        <ul className="mt-1.5 space-y-1 text-[11px] text-gray-600">
          <li>Record the walkthrough</li>
          <li>Export cover frames</li>
          <li>Share board link</li>
        </ul>
      </div>
    );
  if (kind === "photo")
    return (
      <div className="h-full w-full bg-gradient-to-br from-sky-300 via-indigo-300 to-rose-300">
        <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
          <circle cx="72" cy="28" r="10" fill="#fff" opacity="0.8" />
          <path d="M0 80 L30 50 L55 72 L75 58 L100 80 L100 100 L0 100 Z" fill="#fff" opacity="0.55" />
        </svg>
      </div>
    );
  return (
    <div className="flex h-full items-center gap-3 p-3 text-left">
      <div className="grid size-10 shrink-0 place-items-center rounded-md bg-gray-100 text-gray-500">
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-gray-800">Moodboard references</p>
        <p className="truncate text-[11px] text-gray-500">pinboard.example/abc</p>
      </div>
    </div>
  );
}

export default function SelectionBoundsDemo() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState(initial);
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const [selected, setSelected] = useState<Set<string>>(new Set(["photo"]));
  const [box, setBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);

  const selectedItems = cards.filter((c) => selected.has(c.id));
  const apply = (changed: BoundsItem[]) => {
    const byId = new Map(changed.map((c) => [c.id, c]));
    setCards((all) => all.map((c) => ({ ...c, ...byId.get(c.id) })));
  };

  // 拖動卡片本體：超過 3px 才開始移動
  const onCardDown = (e: ReactPointerEvent, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const multi = e.ctrlKey || e.metaKey || e.shiftKey;
    const next = multi ? new Set(selected) : selected.has(id) ? selected : new Set([id]);
    if (multi) {
      if (next.has(id)) next.delete(id);
      else next.add(id);
    }
    setSelected(next);
    if (!next.has(id)) return;
    const starts = cards.filter((c) => next.has(c.id));
    const sx = e.clientX, sy = e.clientY;
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return;
      moved = true;
      apply(starts.map((c) => ({ ...c, x: c.x + ev.clientX - sx, y: c.y + ev.clientY - sy })));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // 畫布背景：框選
  const onCanvasDown = (e: ReactPointerEvent) => {
    if (e.button !== 0 || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    let current = { startX: sx, startY: sy, endX: sx, endY: sy };
    setBox(current);
    const move = (ev: PointerEvent) => {
      current = { ...current, endX: ev.clientX - rect.left, endY: ev.clientY - rect.top };
      setBox(current);
    };
    const up = () => {
      const area = {
        left: Math.min(current.startX, current.endX),
        top: Math.min(current.startY, current.endY),
        right: Math.max(current.startX, current.endX),
        bottom: Math.max(current.startY, current.endY),
      };
      setSelected(new Set(cardsRef.current.filter((c) => intersects(c, area)).map((c) => c.id)));
      setBox(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="w-full max-w-xl min-w-0">
      <div
        ref={canvasRef}
        onPointerDown={onCanvasDown}
        className="relative h-[330px] w-full touch-none overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 select-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {cards.map((c) => (
          <div
            key={c.id}
            data-element-id={c.id}
            onPointerDown={(e) => onCardDown(e, c.id)}
            className="absolute"
            style={{
              left: c.x,
              top: c.y,
              width: c.width,
              height: c.height,
              transform: c.rotation ? `rotate(${c.rotation}deg)` : undefined,
              cursor: "move",
            }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-lg bg-white shadow-lg">
              <CardBody kind={c.kind} />
            </div>
          </div>
        ))}

        <SelectionBounds items={selectedItems} onChange={apply} rotatable />
        <SelectionMarquee box={box} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Drag the frame edge or a card to move, pull a dot to resize, the top knob to rotate (Shift snaps 15°). Drag on empty canvas to box-select, Shift or Cmd click to add.
      </p>
    </div>
  );
}
