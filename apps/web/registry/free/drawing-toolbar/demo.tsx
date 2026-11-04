"use client";

import { useEffect, useState } from "react";

import { DrawingPanel, DrawingSurface, DrawingToolbar, shapePoints, type DrawingTool, type Stroke } from "./drawing-toolbar";

// 預先畫好的標註：圈住卡片、箭頭指過去
const seeded: Stroke[] = [
  { toolType: "circle", points: shapePoints("circle", { x: 92, y: 268 }, { x: 232, y: 352 }), color: "#ef4444", lineWidth: 3 },
  { toolType: "arrow", points: shapePoints("arrow", { x: 290, y: 250 }, { x: 236, y: 292 }), color: "#ef4444", lineWidth: 3 },
];

export default function DrawingToolbarDemo() {
  const [drawing, setDrawing] = useState(true);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [color, setColor] = useState("#000000");
  const [width, setWidth] = useState(2);
  const [strokes, setStrokes] = useState(seeded);

  // 不在繪圖模式時按 P 進入（同原版快捷鍵）
  useEffect(() => {
    if (drawing) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.toLowerCase() === "p") setDrawing(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawing]);

  return (
    <div className="w-full max-w-2xl min-w-0">
      <div
        className="relative h-[26rem] w-full overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {/* 畫布上的卡片 */}
        <div className="absolute left-[104px] top-[284px] w-32 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Link</p>
          <p className="truncate text-xs font-medium text-blue-600">github.com/sun</p>
        </div>

        <DrawingSurface
          active={drawing}
          tool={tool}
          color={color}
          lineWidth={width}
          strokes={strokes}
          onStrokeComplete={(s) => setStrokes((prev) => [...prev, s])}
          label="Canvas sketch layer"
        />

        <DrawingToolbar
          fixed={false}
          open={drawing}
          selectedTool={tool}
          onSelectTool={setTool}
          onClose={() => setDrawing(false)}
        />

        {/* 離開繪圖模式後，從左側滑回的入口 */}
        <button
          type="button"
          onClick={() => setDrawing(true)}
          inert={drawing}
          aria-keyshortcuts="P"
          className="absolute left-4 top-1/2 flex h-11 w-11 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-gray-700 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] outline-none backdrop-blur-xl transition-all duration-300 ease-in-out hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-400 motion-reduce:transition-none"
          style={{ opacity: drawing ? 0 : 1, transform: drawing ? "translate(-120%, -50%)" : "translateY(-50%)" }}
        >
          <span className="sr-only">Draw (P)</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        {drawing && (
          <DrawingPanel fixed={false} color={color} onColorChange={setColor} lineWidth={width} onLineWidthChange={setWidth} className="w-56 sm:w-64" />
        )}
      </div>
    </div>
  );
}
