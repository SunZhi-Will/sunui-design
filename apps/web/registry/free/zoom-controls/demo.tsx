"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { useCanvasZoom, ZoomControls, ZoomIndicator } from "./zoom-controls";

type Card = { id: string; title: string; body: string; x: number; y: number; w: number; h: number };
type Positions = Record<string, { x: number; y: number }>;

const cards: Card[] = [
  { id: "brief", title: "Campaign brief", body: "Spring drop, three hero looks, launch on the 14th.", x: 24, y: 28, w: 150, h: 104 },
  { id: "palette", title: "Palette", body: "", x: 196, y: 52, w: 120, h: 96 },
  { id: "shots", title: "Shot list", body: "Flat lay, on model, detail macro.", x: 70, y: 168, w: 170, h: 92 },
];

const swatches = ["#f97316", "#facc15", "#38bdf8", "#1e293b"];

export default function ZoomControlsDemo() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { scale, offset, zoomIn, zoomOut } = useCanvasZoom(canvasRef);
  const start = Object.fromEntries(cards.map((c) => [c.id, { x: c.x, y: c.y }])) as Positions;
  const [history, setHistory] = useState<{ stack: Positions[]; index: number }>({ stack: [start], index: 0 });
  const [live, setLive] = useState<Positions>(start);

  const commit = (next: Positions) =>
    setHistory((h) => ({ stack: [...h.stack.slice(0, h.index + 1), next], index: h.index + 1 }));
  const go = (index: number) => {
    setHistory((h) => ({ ...h, index }));
    setLive(history.stack[index]);
  };

  // 拖動卡片：位移除以縮放倍率，放開時寫入復原紀錄
  const onDown = (e: ReactPointerEvent, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const origin = live[id];
    const sx = e.clientX, sy = e.clientY;
    let moved = false;
    let latest = live;
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return;
      moved = true;
      latest = { ...latest, [id]: { x: origin.x + (ev.clientX - sx) / scale, y: origin.y + (ev.clientY - sy) / scale } };
      setLive(latest);
    };
    const up = () => {
      if (moved) commit(latest);
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
        className="relative h-[340px] w-full touch-none overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 select-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)",
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: "0 0" }}
        >
          {cards.map((c) => (
            <div
              key={c.id}
              onPointerDown={(e) => onDown(e, c.id)}
              className="pointer-events-auto absolute cursor-move"
              style={{ left: live[c.id].x, top: live[c.id].y, width: c.w, height: c.h }}
            >
              <div className="h-full w-full overflow-hidden rounded-lg bg-white p-3 text-left shadow-lg">
                <p className="text-xs font-semibold text-gray-800">{c.title}</p>
                {c.body ? (
                  <p className="mt-1 text-[11px] leading-snug text-gray-600">{c.body}</p>
                ) : (
                  <div className="mt-2 flex gap-1.5">
                    {swatches.map((s) => (
                      <span key={s} className="size-6 rounded-md" style={{ backgroundColor: s }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <ZoomIndicator scale={scale} className="top-3 right-auto bottom-auto left-3" />
        <ZoomControls
          fixed={false}
          scale={scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onUndo={() => go(history.index - 1)}
          onRedo={() => go(history.index + 1)}
          canUndo={history.index > 0}
          canRedo={history.index < history.stack.length - 1}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Scroll over the board to zoom at the cursor, or use the pill. Drag a card, then undo.</p>
    </div>
  );
}
