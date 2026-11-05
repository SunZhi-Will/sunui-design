"use client";

import { useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CanvasContextMenu } from "./canvas-context-menu";

type Card = { id: string; x: number; y: number; group?: string };

const initial: Card[] = [
  { id: "c1", x: 20, y: 24 },
  { id: "c2", x: 160, y: 60 },
  { id: "c3", x: 48, y: 140 },
];

const copy = {
  en: { titles: { c1: "Hello, I'm Sun", c2: "github.com/sun", c3: "Now: canvas tools" }, hint: "Right-click the canvas for actions." },
  "zh-TW": { titles: { c1: "嗨，我是 Sun", c2: "github.com/sun", c3: "最近在做：畫布工具" }, hint: "在畫布上按右鍵開啟操作選單。" },
  "zh-CN": { titles: { c1: "嗨，我是 Sun", c2: "github.com/sun", c3: "最近在做：画布工具" }, hint: "在画布上右键打开操作菜单。" },
  ja: { titles: { c1: "こんにちは、Sun です", c2: "github.com/sun", c3: "いま：キャンバスツール" }, hint: "キャンバスを右クリックすると操作メニューが開きます。" },
};

// 複製出來的卡片沿用原卡片的標題
const baseId = (id: string) => id.split("-")[0] as keyof (typeof copy)["en"]["titles"];

export default function CanvasContextMenuDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
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
      className="relative h-80 w-full max-w-xl min-w-0 overflow-hidden rounded-xl border border-border bg-background"
      style={{ backgroundImage: "radial-gradient(circle, color-mix(in oklab, var(--muted-foreground) 30%, transparent) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
    >
      {cards.map((c) => (
        <div
          key={c.id}
          className={`absolute w-32 rounded-xl border bg-card p-2.5 text-sm font-semibold text-foreground shadow-sm ${c.id !== "c3" ? "ring-2 ring-[#2563eb]" : ""} ${c.group ? "border-dashed border-[#2563eb]/50" : "border-border"}`}
          style={{ left: c.x, top: c.y }}
        >
          {t.titles[baseId(c.id)]}
        </div>
      ))}
      <p className="pointer-events-none absolute right-3 bottom-2 left-3 text-[11px] text-muted-foreground">{t.hint}</p>
      {menu && (
        <CanvasContextMenu
          fixed={false}
          locale={locale}
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
