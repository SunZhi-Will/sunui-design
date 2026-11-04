"use client";

import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import { cn } from "@/lib/utils";

import { CanvasContextMenu } from "./canvas-context-menu";

type Card = { id: string; kind: "text" | "link" | "image"; title: string; x: number; y: number; group?: string };

const initial: Card[] = [
  { id: "c1", kind: "text", title: "Hello, I'm Sun", x: 20, y: 24 },
  { id: "c2", kind: "link", title: "github.com/sun", x: 168, y: 40 },
  { id: "c3", kind: "image", title: "Studio desk", x: 44, y: 140 },
  { id: "c4", kind: "text", title: "Now: canvas tools", x: 196, y: 168 },
];

const MENU_W = 188;
const MENU_H = 230;

function CardBody({ card }: { card: Card }) {
  if (card.kind === "image")
    return (
      <>
        <div aria-hidden="true" className="h-12 rounded-md bg-gradient-to-br from-sky-200 via-indigo-200 to-violet-300" />
        <p className="mt-1.5 truncate text-xs font-medium text-gray-700">{card.title}</p>
      </>
    );
  if (card.kind === "link")
    return (
      <>
        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Link</p>
        <p className="truncate text-xs font-medium text-blue-600">{card.title}</p>
      </>
    );
  return <p className="text-sm font-semibold text-gray-800">{card.title}</p>;
}

export default function CanvasContextMenuDemo() {
  const areaRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set(["c1", "c2"]));
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const close = useCallback(() => setMenu(null), []);

  // 選單位置限制在畫布內
  const openAt = (clientX: number, clientY: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(4, Math.min(clientX - rect.left, rect.width - MENU_W - 4));
    const y = Math.max(4, Math.min(clientY - rect.top, rect.height - MENU_H - 4));
    setMenu({ x, y });
  };

  const onContextMenu = (e: ReactMouseEvent) => {
    e.preventDefault();
    openAt(e.clientX, e.clientY);
  };

  const pick = (id: string, additive: boolean) => {
    const group = cards.find((c) => c.id === id)?.group;
    const ids = group ? cards.filter((c) => c.group === group).map((c) => c.id) : [id];
    setSelected((prev) => {
      if (!additive) return new Set(ids);
      const next = new Set(prev);
      const on = !next.has(id);
      ids.forEach((i) => (on ? next.add(i) : next.delete(i)));
      return next;
    });
  };

  const hasGroup = cards.some((c) => selected.has(c.id) && c.group);

  return (
    <div className="w-full max-w-xl min-w-0">
      <div
        ref={areaRef}
        onContextMenu={onContextMenu}
        onPointerDown={(e) => e.target === e.currentTarget && e.button === 0 && setSelected(new Set())}
        className="relative h-80 w-full overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            aria-pressed={selected.has(card.id)}
            onClick={(e) => pick(card.id, e.shiftKey || e.metaKey || e.ctrlKey)}
            onContextMenu={() => !selected.has(card.id) && setSelected(new Set([card.id]))}
            onKeyDown={(e) => {
              // 鍵盤開啟選單：Shift+F10 或選單鍵
              if (e.key !== "ContextMenu" && !(e.shiftKey && e.key === "F10")) return;
              e.preventDefault();
              if (!selected.has(card.id)) setSelected(new Set([card.id]));
              const r = e.currentTarget.getBoundingClientRect();
              openAt(r.left + 12, r.bottom + 4);
            }}
            aria-keyshortcuts="Shift+F10"
            className={cn(
              "absolute w-32 rounded-xl border border-gray-200 bg-white p-2.5 text-left shadow-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-blue-300",
              selected.has(card.id) && "ring-2 ring-blue-500",
              card.group && "border-dashed border-blue-300",
            )}
            style={{ left: card.x, top: card.y }}
          >
            <CardBody card={card} />
          </button>
        ))}

        <p className="pointer-events-none absolute bottom-2 left-3 right-3 text-[11px] text-gray-400">
          Shift-click to select more, right-click or Shift+F10 for actions.
        </p>

        {menu && (
          <CanvasContextMenu
            fixed={false}
            x={menu.x}
            y={menu.y}
            onClose={close}
            selectedCount={selected.size}
            hasGroup={hasGroup}
            onGroup={() => {
              const g = `g${Date.now()}`;
              setCards((cs) => cs.map((c) => (selected.has(c.id) ? { ...c, group: g } : c)));
            }}
            onUngroup={() => setCards((cs) => cs.map((c) => (selected.has(c.id) ? { ...c, group: undefined } : c)))}
            onDuplicate={() => {
              const copies = cards
                .filter((c) => selected.has(c.id))
                .map((c, i) => ({ ...c, id: `${c.id}-${Date.now()}-${i}`, x: c.x + 20, y: c.y + 20, group: undefined }));
              setCards((cs) => [...cs, ...copies]);
              setSelected(new Set(copies.map((c) => c.id)));
            }}
            onDelete={() => {
              setCards((cs) => cs.filter((c) => !selected.has(c.id)));
              setSelected(new Set());
            }}
            onSnapToGrid={() =>
              setCards((cs) => cs.map((c, i) => ({ ...c, x: 20 + (i % 2) * 148, y: 20 + Math.floor(i / 2) * 84 })))
            }
          />
        )}
      </div>
    </div>
  );
}
