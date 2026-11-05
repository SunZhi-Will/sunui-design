"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { DrawingSurface, DrawingToolbar, shapePoints, type DrawingTool, type Stroke } from "./drawing-toolbar";

// 預先畫好的標註：圈住卡片
const seeded: Stroke[] = [
  { toolType: "circle", points: shapePoints("circle", { x: 92, y: 168 }, { x: 232, y: 252 }), color: "#c8361d", lineWidth: 3 },
];

const copy = {
  en: { link: "Link", layer: "Canvas sketch layer", draw: "Draw" },
  "zh-TW": { link: "連結", layer: "畫布手繪層", draw: "繪圖" },
  "zh-CN": { link: "链接", layer: "画布手绘层", draw: "绘图" },
  ja: { link: "リンク", layer: "キャンバスの手描きレイヤー", draw: "描く" },
};

export default function DrawingToolbarDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [drawing, setDrawing] = useState(true);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [strokes, setStrokes] = useState(seeded);

  return (
    <div
      className="relative h-[320px] w-full max-w-2xl min-w-0 overflow-hidden rounded-xl border border-border bg-background"
      style={{ backgroundImage: "radial-gradient(circle, color-mix(in oklab, var(--muted-foreground) 30%, transparent) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
    >
      <div className="absolute top-[184px] left-[104px] w-32 rounded-xl border border-border bg-card p-2.5 shadow-sm">
        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{t.link}</p>
        <p className="truncate text-xs font-medium text-foreground underline decoration-border underline-offset-2">github.com/sun</p>
      </div>
      <DrawingSurface
        active={drawing}
        tool={tool}
        color="#c8361d"
        lineWidth={3}
        strokes={strokes}
        onStrokeComplete={(s) => setStrokes((prev) => [...prev, s])}
        label={t.layer}
        locale={locale}
      />
      <DrawingToolbar locale={locale} fixed={false} open={drawing} selectedTool={tool} onSelectTool={setTool} onClose={() => setDrawing(false)} />
      {!drawing && (
        <button
          type="button"
          onClick={() => setDrawing(true)}
          className="absolute top-1/2 left-4 -translate-y-1/2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-muted"
        >
          {t.draw}
        </button>
      )}
    </div>
  );
}
