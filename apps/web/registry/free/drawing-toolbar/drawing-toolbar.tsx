"use client";

import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { DrawingTool } from "./drawing-surface";

export { DrawingSurface, shapePoints, type DrawingSurfaceProps, type DrawingTool, type Point, type Stroke } from "./drawing-surface";

const icon = (d: string) => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

const backIcon = icon("M10 19l-7-7m0 0l7-7m-7 7h18");

type ToolDef = { id: DrawingTool; shortcut: string; icon: ReactNode };

// 畫筆在最上面（預設工具），形狀照原版順序
const tools: ToolDef[] = [
  { id: "pen", shortcut: "P", icon: icon("M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z") },
  { id: "line", shortcut: "1", icon: icon("M4 12h16") },
  { id: "rectangle", shortcut: "2", icon: icon("M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z") },
  { id: "circle", shortcut: "3", icon: icon("M21 12a9 9 0 11-18 0 9 9 0 0118 0z") },
  { id: "arrow", shortcut: "4", icon: icon("M14 5l7 7m0 0l-7 7m7-7H3") },
];

type Labels = Record<DrawingTool, string> & { toolbar: string; back: string };

const defaultLabels: Labels = {
  toolbar: "Drawing tools",
  back: "Back to main toolbar (ESC)",
  pen: "Pen",
  line: "Line",
  rectangle: "Rectangle",
  circle: "Circle",
  arrow: "Arrow",
};

export type DrawingToolbarProps = {
  selectedTool?: DrawingTool;
  onSelectTool?: (tool: DrawingTool) => void;
  /** 返回鈕與 Escape */
  onClose?: () => void;
  /** 顯示或滑出畫面，300ms ease-in-out */
  open?: boolean;
  /** 開啟時啟用 P、1 到 4 快捷鍵與 Escape（同原版） */
  shortcuts?: boolean;
  /** 選取時的底色、字色、滑過底色 */
  accent?: { soft: string; strong: string; hover: string };
  /** 原版為 fixed 貼齊視窗左側；放在相對容器裡時設 false */
  fixed?: boolean;
  labels?: Partial<Labels>;
  className?: string;
};

export function DrawingToolbar({
  selectedTool,
  onSelectTool,
  onClose,
  open = true,
  shortcuts = true,
  accent = { soft: "rgba(59, 130, 246, 0.3)", strong: "#2563eb", hover: "rgba(59, 130, 246, 0.4)" },
  fixed = true,
  labels: labelsProp,
  className,
}: DrawingToolbarProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const current = selectedTool || "pen";
  const handlers = useRef({ onSelectTool, onClose });
  useEffect(() => {
    handlers.current = { onSelectTool, onClose };
  });

  useEffect(() => {
    if (!open || !shortcuts) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable) return;
      if (e.key === "Escape") return handlers.current.onClose?.();
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const hit = tools.find((x) => x.shortcut.toLowerCase() === e.key.toLowerCase());
      if (!hit) return;
      e.preventDefault();
      handlers.current.onSelectTool?.(hit.id);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, shortcuts]);

  return (
    <div
      className={cn("cf-dt-wrap left-4 top-1/2 z-50", fixed ? "fixed" : "absolute", className)}
      style={{
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transform: open ? "translateY(-50%)" : "translate(-120%, -50%)",
        ["--cf-dt-soft" as string]: accent.soft,
        ["--cf-dt-strong" as string]: accent.strong,
        ["--cf-dt-hover" as string]: accent.hover,
      } as CSSProperties}
      inert={!open}
    >
      <div role="toolbar" aria-orientation="vertical" aria-label={labels.toolbar} className="cf-dt-glass flex flex-col gap-0.5 rounded-xl p-1.5">
        {onClose && (
          <>
            <button type="button" onClick={onClose} className="cf-dt-btn" aria-label={labels.back} aria-keyshortcuts="Escape" title={labels.back}>
              {backIcon}
              <span className="cf-dt-tip" aria-hidden="true">
                {labels.back}
              </span>
            </button>
            <div className="my-0.5 h-px bg-white/20" />
          </>
        )}
        {tools.map((tool) => {
          const isSelected = current === tool.id;
          const text = `${labels[tool.id]} (${tool.shortcut})`;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool?.(tool.id)}
              className="cf-dt-btn"
              data-selected={isSelected || undefined}
              aria-pressed={isSelected}
              aria-label={labels[tool.id]}
              aria-keyshortcuts={tool.shortcut}
              title={text}
            >
              {tool.icon}
              <span className="cf-dt-tip" aria-hidden="true">
                {text}
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
        .cf-dt-wrap { transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1); }
        .cf-dt-glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 rgba(255, 255, 255, 0.5);
        }
        .cf-dt-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          color: #374151;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: auto;
          outline: none;
          border: none;
          background: transparent;
        }
        .cf-dt-btn[data-selected] { background: var(--cf-dt-soft); color: var(--cf-dt-strong); }
        .cf-dt-btn:hover, .cf-dt-btn:focus-visible {
          background: rgba(59, 130, 246, 0.15);
          color: #2563eb;
          transform: scale(1.05);
        }
        .cf-dt-btn[data-selected]:hover, .cf-dt-btn[data-selected]:focus-visible { background: var(--cf-dt-hover); color: var(--cf-dt-strong); }
        .cf-dt-btn:active { transform: scale(0.95); }
        .cf-dt-tip {
          position: absolute;
          left: calc(100% + 8px);
          background: rgba(17, 24, 39, 0.95);
          backdrop-filter: blur(8px);
          color: white;
          font-size: 10px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 6px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1;
        }
        .cf-dt-btn:hover .cf-dt-tip, .cf-dt-btn:focus-visible .cf-dt-tip { opacity: 1; }
        .cf-dt-tip::before {
          content: '';
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: rgba(17, 24, 39, 0.95);
        }
        @media (prefers-reduced-motion: reduce) {
          .cf-dt-wrap, .cf-dt-btn, .cf-dt-tip { transition: none; }
          .cf-dt-btn:hover, .cf-dt-btn:focus-visible, .cf-dt-btn:active { transform: none; }
        }
      `}</style>
    </div>
  );
}

/* ---------- 繪圖設定面板（顏色與粗細，原版繪圖模式右上角） ---------- */

export type DrawingPanelProps = {
  color: string;
  onColorChange: (color: string) => void;
  lineWidth: number;
  onLineWidthChange: (width: number) => void;
  fixed?: boolean;
  labels?: { title?: string; color?: string; width?: (px: number) => string };
  className?: string;
};

export function DrawingPanel({ color, onColorChange, lineWidth, onLineWidthChange, fixed = true, labels, className }: DrawingPanelProps) {
  const id = useId();
  return (
    <section
      aria-labelledby={`${id}-t`}
      className={cn("cf-dt-panel right-4 top-4 z-50 w-64 rounded-2xl p-4", fixed ? "fixed" : "absolute", className)}
    >
      <h3 id={`${id}-t`} className="mb-3 text-base font-semibold text-gray-800">
        {labels?.title ?? "Drawing tools"}
      </h3>
      <div className="space-y-3">
        <div>
          <label htmlFor={`${id}-c`} className="mb-1.5 block text-xs font-medium text-gray-700">
            {labels?.color ?? "Pen colour"}
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`${id}-c`}
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded-lg border border-gray-200"
            />
            <input
              type="text"
              aria-label={`${labels?.color ?? "Pen colour"}, hex`}
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-200/50 bg-white/50 px-3 py-2 text-xs text-gray-800 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-400/50"
            />
          </div>
        </div>
        <div>
          <label htmlFor={`${id}-w`} className="mb-1.5 block text-xs font-medium text-gray-700">
            {labels?.width ? labels.width(lineWidth) : `Pen width: ${lineWidth}px`}
          </label>
          <input
            id={`${id}-w`}
            type="range"
            min={1}
            max={20}
            value={lineWidth}
            onChange={(e) => onLineWidthChange(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      </div>
      <style>{`
        .cf-dt-panel {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </section>
  );
}
