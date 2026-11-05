"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

import { cn } from "@/lib/utils";

// CardFlow canvas/page.tsx 的 .glassmorphism-panel，收斂成跟隨主題的實底浮動面板
const panel = "border border-border bg-card text-foreground shadow-sm";

export type ZoomControlsLabels = {
  undo: string;
  redo: string;
  zoomIn: string;
  zoomOut: string;
  animation: string;
  zoomLevel: string;
};

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, ZoomControlsLabels> = {
  en: {
    undo: "Undo (Ctrl+Z)",
    redo: "Redo (Ctrl+Y)",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    animation: "Animation",
    zoomLevel: "Zoom level",
  },
  "zh-TW": {
    undo: "復原 (Ctrl+Z)",
    redo: "重做 (Ctrl+Y)",
    zoomIn: "放大",
    zoomOut: "縮小",
    animation: "動畫",
    zoomLevel: "縮放比例",
  },
  "zh-CN": {
    undo: "撤销 (Ctrl+Z)",
    redo: "重做 (Ctrl+Y)",
    zoomIn: "放大",
    zoomOut: "缩小",
    animation: "动画",
    zoomLevel: "缩放比例",
  },
  ja: {
    undo: "元に戻す (Ctrl+Z)",
    redo: "やり直す (Ctrl+Y)",
    zoomIn: "拡大",
    zoomOut: "縮小",
    animation: "アニメーション",
    zoomLevel: "ズーム倍率",
  },
};

export type ZoomControlsProps = {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  /** 有傳入時在縮放面板上方顯示「動畫」按鈕 */
  onToggleAnimation?: () => void;
  animationActive?: boolean;
  /** 原版固定在視窗右下角；放在 relative 容器內時設為 false */
  fixed?: boolean;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<ZoomControlsLabels>;
  className?: string;
};

const btn = "px-2 py-1.5 transition-colors hover:bg-muted active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";

function Icon({ d, className = "h-3 w-3" }: { d: string | string[]; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      {(Array.isArray(d) ? d : [d]).map((p) => (
        <path key={p} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={p} />
      ))}
    </svg>
  );
}

/** 右下角的縮放面板：復原、重做、放大、比例、縮小 */
export function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onToggleAnimation,
  animationActive = false,
  fixed = true,
  locale = "en",
  labels: labelsProp,
  className,
}: ZoomControlsProps) {
  const labels = { ...MESSAGES[resolveLocale(locale)], ...labelsProp };
  return (
    <div className={cn(fixed ? "fixed" : "absolute", "right-4 bottom-4 z-50 flex flex-col items-end gap-3", className)}>
      {/* 動畫編輯按鈕 */}
      {onToggleAnimation && (
        <button
          type="button"
          onClick={onToggleAnimation}
          aria-pressed={animationActive}
          title={labels.animation}
          className={cn(
            panel,
            "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-ring",
            animationActive ? "border-primary/40 bg-primary/10" : "hover:bg-muted",
          )}
        >
          <Icon className="h-4 w-4" d={["M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z", "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"]} />
          <span className="text-xs font-medium">{labels.animation}</span>
        </button>
      )}

      {/* 縮放控制面板 */}
      <div role="toolbar" aria-label={labels.zoomLevel} className={cn(panel, "overflow-hidden rounded-lg")}>
        <div className="flex items-center">
          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title={labels.undo}
              aria-label={labels.undo}
              className={cn(btn, "border-r border-border", !canUndo && "cursor-not-allowed opacity-50")}
            >
              <Icon d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </button>
          )}
          {onRedo && (
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title={labels.redo}
              aria-label={labels.redo}
              className={cn(btn, "border-r border-border", !canRedo && "cursor-not-allowed opacity-50")}
            >
              <Icon d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6-6m6 6l-6 6" />
            </button>
          )}
          <button type="button" onClick={onZoomIn} aria-label={labels.zoomIn} className={cn(btn, "border-r border-border")}>
            <Icon d="M12 4v16m8-8H4" />
          </button>
          {/* 縮放比例顯示 */}
          <div className="min-w-[3rem] px-2 py-1.5 text-center" aria-live="polite" aria-atomic>
            <span className="sr-only">{labels.zoomLevel} </span>
            <span className="text-[10px] font-semibold tabular-nums">{Math.round(scale * 100)}%</span>
          </div>
          <button type="button" onClick={onZoomOut} aria-label={labels.zoomOut} className={btn}>
            <Icon d="M20 12H4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export type ZoomIndicatorProps = { scale: number; className?: string };

/** 唯讀的縮放指示器（CardFlow grid 頁右下角） */
export function ZoomIndicator({ scale, className }: ZoomIndicatorProps) {
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none absolute right-6 bottom-6 z-50 rounded-lg border border-border bg-card px-4 py-2.5 text-foreground shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        <span className="text-sm font-semibold tabular-nums">{Math.round(scale * 100)}%</span>
      </div>
    </div>
  );
}

export type CanvasZoomOptions = {
  min?: number;
  max?: number;
  /** 按鈕縮放倍率，原版為 1.2 */
  step?: number;
  /** 滾輪以滑鼠位置為中心縮放 */
  wheel?: boolean;
};

/**
 * 畫布縮放狀態（移植自 useCanvasView 與 InfiniteCanvas 的滾輪處理）。
 * 按鈕縮放以容器中心為基準，滾輪以滑鼠位置為基準。
 */
export function useCanvasZoom(containerRef: RefObject<HTMLElement | null>, { min = 0.1, max = 5, step = 1.2, wheel = true }: CanvasZoomOptions = {}) {
  const [view, setView] = useState({ scale: 1, offset: { x: 0, y: 0 } });
  const viewRef = useRef(view);
  viewRef.current = view;

  const zoomAround = useCallback((next: number, px: number, py: number) => {
    const { scale, offset } = viewRef.current;
    if (next === scale) return;
    // 讓基準點在畫布上的位置保持不變
    const cx = (px - offset.x) / scale;
    const cy = (py - offset.y) / scale;
    setView({ scale: next, offset: { x: px - cx * next, y: py - cy * next } });
  }, []);

  const center = useCallback(() => {
    const el = containerRef.current;
    return el ? { x: el.clientWidth / 2, y: el.clientHeight / 2 } : { x: 0, y: 0 };
  }, [containerRef]);

  const zoomIn = useCallback(() => {
    const c = center();
    zoomAround(Math.min(viewRef.current.scale * step, max), c.x, c.y);
  }, [center, zoomAround, step, max]);

  const zoomOut = useCallback(() => {
    const c = center();
    zoomAround(Math.max(viewRef.current.scale / step, min), c.x, c.y);
  }, [center, zoomAround, step, min]);

  const reset = useCallback(() => setView({ scale: 1, offset: { x: 0, y: 0 } }), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !wheel) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { scale } = viewRef.current;
      const next = Math.min(Math.max(scale - e.deltaY * 0.001, min), max);
      if (Math.abs(next - scale) > 0.01) {
        const rect = el.getBoundingClientRect();
        zoomAround(next, e.clientX - rect.left, e.clientY - rect.top);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [containerRef, wheel, min, max, zoomAround]);

  return {
    scale: view.scale,
    offset: view.offset,
    setScale: (scale: number) => setView((v) => ({ ...v, scale })),
    setOffset: (offset: { x: number; y: number }) => setView((v) => ({ ...v, offset })),
    zoomIn,
    zoomOut,
    reset,
  };
}
