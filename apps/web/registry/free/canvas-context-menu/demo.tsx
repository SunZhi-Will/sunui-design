"use client";

import { useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import { CanvasContextMenu } from "./canvas-context-menu";

type Card = { id: string; title: string; x: number; y: number; group?: string };

const initial: Card[] = [
  { id: "c1", title: "Hello, I'm Sun", x: 20, y: 24 },
  { id: "c2", title: "github.com/sun", x: 160, y: 60 },
  { id: "c3", title: "Now: canvas tools", x: 48, y: 140 },
];

export default function CanvasContextMenuDemo() {
  const areaRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState(initial);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const selected = cards.filter((c) => c.id !== "c3");

  // 右鍵開啟選單，位置限制在畫布內
  const onContextMenu = (e: ReactMouseEvent) => {
    e.preventDefault();
    const r = areaRef.current!.getBoundingClientRect();
    setMenu({ x: Math.max(4, Math.min(e.clientX - r.left, r.width - 192)), y: Math.max(4, Math.min(e.clientY - r.top, r.height - 234)) });
  };
  const update = (fn: (c: Card) => Card) => setCards((cs) => cs.map((c) => (c.id === "c3" ? c : fn(c))));

  return (
    <div
      ref={areaRef}
      onContextMenu={onContextMenu}
      className="relative h-80 w-full max-w-xl min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
      style={{ backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)", backgroundSize: "20px 20px" }}
    >
      {cards.map((c) => (
        <div
          key={c.id}
          className={`absolute w-32 rounded-xl border bg-white p-2.5 text-sm font-semibold text-gray-800 shadow-sm ${c.id !== "c3" ? "ring-2 ring-blue-500" : ""} ${c.group ? "border-dashed border-blue-300" : "border-gray-200"}`}
          style={{ left: c.x, top: c.y }}
        >
          {c.title}
        </div>
      ))}
      <p className="pointer-events-none absolute right-3 bottom-2 left-3 text-[11px] text-gray-400">Right-click the canvas for actions.</p>
      {menu && (
        <CanvasContextMenu
          fixed={false}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          selectedCount={selected.length}
          hasGroup={selected.some((c) => c.group)}
          onGroup={() => update((c) => ({ ...c, group: "g1" }))}
          onUngroup={() => update((c) => ({ ...c, group: undefined }))}
          onDuplicate={() => setCards((cs) => [...cs, ...selected.map((c, i) => ({ ...c, id: `${c.id}-${Date.now()}-${i}`, x: c.x + 20, y: c.y + 20, group: undefined }))])}
          onDelete={() => setCards((cs) => cs.filter((c) => c.id === "c3"))}
        />
      )}
    </div>
  );
}
