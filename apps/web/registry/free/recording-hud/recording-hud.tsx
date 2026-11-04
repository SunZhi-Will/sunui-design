"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface RecordingHudLabels {
  region?: string;
  pause?: string;
  resume?: string;
  stop?: string;
  draw?: string;
  clear?: ReactNode;
  swatch?: (color: string) => string;
  dragHint?: string;
}

export interface RecordingHudProps {
  /** 開始錄影的時間戳（ms）；與 elapsed 擇一 */
  startedAt?: number;
  /** 已錄製的毫秒數，暫停時由父層凍結 */
  elapsed?: number;
  paused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  /** 顯示畫筆工具 */
  tools?: boolean;
  swatches?: string[];
  onSwatch?: (color: string) => void;
  onClear?: () => void;
  /** 預設 fixed 於視窗；false 時改為 absolute，只能在父層範圍內拖曳 */
  fixed?: boolean;
  labels?: RecordingHudLabels;
  className?: string;
}

const defaultLabels: Required<RecordingHudLabels> = {
  region: "Recording controls",
  pause: "Pause recording",
  resume: "Resume recording",
  stop: "Stop recording",
  draw: "Draw on screen",
  clear: "Clear",
  swatch: (c) => `Pen color ${c}`,
  dragHint: "Drag to move. Space pauses or resumes.",
};

const defaultSwatches = ["#fafafa", "#a1a1aa", "#3f3f46", "#f59e0b", "#3b82f6"];
const ease = [0.23, 1, 0.32, 1] as const;

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export function RecordingHud({
  startedAt,
  elapsed,
  paused = false,
  onPause,
  onResume,
  onStop,
  tools = true,
  swatches = defaultSwatches,
  onSwatch,
  onClear,
  fixed = true,
  labels,
  className,
}: RecordingHudProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ dx: number; dy: number; id: number } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState(swatches[0]);

  // 計時直接寫入文字節點，不讓整個 HUD 每秒重新渲染
  useEffect(() => {
    const write = () => {
      if (!timeRef.current) return;
      const ms = elapsed ?? (startedAt !== undefined ? Date.now() - startedAt : 0);
      timeRef.current.textContent = fmt(ms);
    };
    write();
    if (paused || elapsed !== undefined) return;
    const id = setInterval(write, 250);
    return () => clearInterval(id);
  }, [elapsed, startedAt, paused]);

  const clamp = (x: number, y: number) => {
    const el = rootRef.current;
    const box = fixed ? { width: window.innerWidth, height: window.innerHeight } : el?.offsetParent?.getBoundingClientRect();
    if (!el || !box) return { x, y };
    const maxX = Math.max(0, (box.width - el.offsetWidth) / 2);
    const maxY = Math.max(0, box.height - el.offsetHeight - 24);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(0, Math.max(-maxY, y)) };
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, id: e.pointerId };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy));
  };
  const endDrag = () => {
    drag.current = null;
  };

  const togglePause = () => (paused ? onResume?.() : onPause?.());
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " " && e.target === e.currentTarget) {
      e.preventDefault();
      togglePause();
    }
  };

  const iconButton =
    "flex size-8 items-center justify-center rounded-md text-zinc-300 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div
      ref={rootRef}
      role="toolbar"
      aria-label={t.region}
      aria-description={t.dragHint}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ transform: `translate(calc(-50% + ${pos.x}px), ${pos.y}px)` }}
      className={cn(
        fixed ? "fixed bottom-6 left-1/2 z-50" : "absolute bottom-4 left-1/2 z-10",
        "cursor-grab touch-none outline-none select-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-xl",
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {tools && drawing && (
          <motion.div
            key="swatches"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 6, transition: { duration: 0.12, ease } }}
            transition={{ duration: reduce ? 0 : 0.18, ease }}
            className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-950/90 px-2 py-1.5 backdrop-blur-sm"
          >
            {swatches.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={t.swatch(c)}
                aria-pressed={color === c}
                onClick={() => {
                  setColor(c);
                  onSwatch?.(c);
                }}
                className="flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn("size-4 rounded-full ring-1 ring-white/20", color === c && "ring-2 ring-white")}
                  style={{ backgroundColor: c }}
                />
              </button>
            ))}
            <button
              type="button"
              onClick={onClear}
              className="ml-1 rounded-md px-2 py-1 text-xs text-zinc-300 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t.clear}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-11 items-center gap-1 rounded-xl border border-white/10 bg-zinc-950/90 pr-1.5 pl-3 text-zinc-100 backdrop-blur-sm">
        <span
          aria-hidden="true"
          className={cn(
            "size-2 rounded-full",
            paused ? "bg-amber-400" : "bg-red-500",
            !paused && !reduce && "animate-[rec-blink_1s_steps(1,end)_infinite]",
          )}
        />
        <span ref={timeRef} className="mr-1 ml-2 min-w-[3.25rem] font-mono text-sm tabular-nums" aria-hidden="true">
          00:00
        </span>
        <button type="button" aria-label={paused ? t.resume : t.pause} onClick={togglePause} className={iconButton}>
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            {paused ? <path d="M5 3.5v9l7-4.5-7-4.5Z" strokeLinejoin="round" /> : <path d="M6 3.5v9M10 3.5v9" strokeLinecap="round" />}
          </svg>
        </button>
        <button type="button" aria-label={t.stop} onClick={onStop} className={iconButton}>
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="4" y="4" width="8" height="8" rx="1.5" />
          </svg>
        </button>
        {tools && (
          <button
            type="button"
            aria-label={t.draw}
            aria-pressed={drawing}
            onClick={() => setDrawing((d) => !d)}
            className={cn(iconButton, drawing && "bg-white/10 text-white")}
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="m10.5 3 2.5 2.5L6 12.5H3.5V10L10.5 3Z" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      <style>{`@keyframes rec-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }`}</style>
    </div>
  );
}
