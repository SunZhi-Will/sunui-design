"use client";

import { memo, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 畫筆可用的顏色
export const DRAW_COLORS = ["#ef4444", "#facc15", "#22c55e", "#3b82f6", "#ffffff"];

// HUD 圖示色：深色玻璃上用較亮的 slate 與紅
const HUD_ICON_COLOR = "#94a3b8";
const HUD_ICON_COLOR_DISABLED = "#4b5563";
const HUD_ACCENT_RED = "#f87171";
const WARNING = "#f59e0b";
const GLASS = "rgba(15, 15, 15, 0.88)";

export function formatHudTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export interface RecordingHudLabels {
  region?: string;
  pause?: string;
  resume?: string;
  pauseUnavailable?: string;
  stop?: string;
  pen?: string;
  clear?: string;
  color?: (color: string) => string;
}

const defaultLabels: Required<RecordingHudLabels> = {
  region: "Recording controls",
  pause: "Pause",
  resume: "Resume",
  pauseUnavailable: "Pause is not supported in this capture mode yet. Please stop recording instead.",
  stop: "Stop Recording",
  pen: "Pen",
  clear: "Clear",
  color: (c) => c,
};

export interface RecordingHudProps {
  /** 外部推來的秒數；沒給或還沒推時 HUD 自己每秒加一 */
  seconds?: number;
  paused?: boolean;
  /** 擷取模式不支援暫停時把暫停鈕灰掉 */
  pauseDisabled?: boolean;
  onPauseToggle?: () => void;
  onStop?: () => void;
  /** 錄整個畫面時才有畫筆（單一視窗來源沒有意義） */
  drawEnabled?: boolean;
  penActive?: boolean;
  defaultPenActive?: boolean;
  onPenActiveChange?: (active: boolean) => void;
  colors?: string[];
  color?: string;
  onColorChange?: (color: string) => void;
  onClear?: () => void;
  /** 拖曳時回報位移量（原本用來移動原生視窗） */
  onMove?: (dx: number, dy: number) => void;
  /** 預設 fixed 於視窗下緣置中；false 時改為 absolute，只在父層範圍內拖曳 */
  fixed?: boolean;
  labels?: RecordingHudLabels;
  className?: string;
}

const Svg = ({ children, fill = "none" }: { children: ReactNode; fill?: string }) => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export function RecordingHud({
  seconds: secondsProp,
  paused = false,
  pauseDisabled = false,
  onPauseToggle,
  onStop,
  drawEnabled = false,
  penActive: penProp,
  defaultPenActive = false,
  onPenActiveChange,
  colors = DRAW_COLORS,
  color: colorProp,
  onColorChange,
  onClear,
  onMove,
  fixed = true,
  labels,
  className,
}: RecordingHudProps) {
  const t = { ...defaultLabels, ...labels };
  const [seconds, setSeconds] = useState(secondsProp ?? 0);
  const pausedRef = useRef(paused);
  const [penInner, setPenInner] = useState(defaultPenActive);
  const penActive = penProp ?? penInner;
  const [colorInner, setColorInner] = useState(colors[0]);
  const drawColor = colorProp ?? colorInner;
  const rootRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const setPen = (active: boolean) => {
    if (penProp === undefined) setPenInner(active);
    onPenActiveChange?.(active);
  };
  const pickColor = (c: string) => {
    if (colorProp === undefined) setColorInner(c);
    onColorChange?.(c);
  };

  // 外部推來的秒數優先
  useEffect(() => {
    if (secondsProp !== undefined) setSeconds(secondsProp);
  }, [secondsProp]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // 備援：還沒收到外部秒數時 HUD 自己計時，靠 ref 讀最新暫停狀態
  const external = secondsProp !== undefined;
  useEffect(() => {
    if (external) return;
    const id = setInterval(() => {
      if (!pausedRef.current) setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [external]);

  // 剛點開畫筆、焦點還在 HUD 上時，Esc 也能關掉
  useEffect(() => {
    if (!penActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [penActive]);

  // 自訂拖移：以游標位移量驅動
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    draggingRef.current = true;
    lastPosRef.current = { x: e.screenX, y: e.screenY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.screenX - lastPosRef.current.x;
    const dy = e.screenY - lastPosRef.current.y;
    if (dx === 0 && dy === 0) return;
    lastPosRef.current = { x: e.screenX, y: e.screenY };
    onMove?.(dx, dy);
    const el = rootRef.current;
    const box = fixed ? { width: window.innerWidth, height: window.innerHeight } : el?.offsetParent?.getBoundingClientRect();
    setPos((p) => {
      if (!el || !box) return { x: p.x + dx, y: p.y + dy };
      const maxX = Math.max(0, (box.width - el.offsetWidth) / 2);
      const maxY = Math.max(0, box.height - el.offsetHeight - (fixed ? 24 : 16));
      return { x: Math.min(maxX, Math.max(-maxX, p.x + dx)), y: Math.min(0, Math.max(-maxY, p.y + dy)) };
    });
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const btn: CSSProperties = { borderRadius: 6, padding: "3px 8px", display: "flex", alignItems: "center" };
  const pauseTitle = pauseDisabled ? t.pauseUnavailable : paused ? t.resume : t.pause;

  return (
    <div
      ref={rootRef}
      role="toolbar"
      aria-label={t.region}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ transform: `translate(calc(-50% + ${pos.x}px), ${pos.y}px)`, gap: 6 }}
      className={cn(
        fixed ? "fixed bottom-6 z-50" : "absolute bottom-4 z-10",
        "left-1/2 flex w-max flex-col justify-end touch-none select-none",
        className,
      )}
    >
      {/* 畫筆色盤與清除列：用 opacity 與 maxHeight 展開收合 */}
      {drawEnabled && (
        <div
          className="hud-palette"
          aria-hidden={!penActive}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            maxHeight: penActive ? 34 : 0,
            opacity: penActive ? 1 : 0,
            overflow: "hidden",
            background: GLASS,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 10,
            padding: "0 10px",
            pointerEvents: penActive ? "auto" : "none",
          }}
        >
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              aria-label={t.color(c)}
              aria-pressed={drawColor === c}
              tabIndex={penActive ? 0 : -1}
              onClick={() => pickColor(c)}
              className="hud-focus"
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: c,
                border: drawColor === c ? "2px solid #f1f5f9" : "1px solid rgba(255,255,255,0.35)",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
              }}
            />
          ))}
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)" }} />
          <button
            type="button"
            title={t.clear}
            tabIndex={penActive ? 0 : -1}
            onClick={onClear}
            className="hud-focus"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              color: HUD_ICON_COLOR,
              cursor: "pointer",
              padding: "3px 8px",
              fontSize: 11,
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {t.clear}
          </button>
        </div>
      )}

      {/* 藥丸本體 */}
      <div
        style={{
          height: 44,
          background: GLASS,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 14px",
          cursor: "move",
        }}
      >
        {/* 錄製指示燈：steps(1) 只有亮暗兩格，不逼畫面每幀重繪 */}
        <div
          aria-hidden="true"
          className={paused ? undefined : "hud-dot-blink"}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: paused ? WARNING : "#ef4444",
            boxShadow: paused ? `0 0 6px ${WARNING}` : "0 0 6px #ef4444",
            flexShrink: 0,
          }}
        />

        <span
          role="timer"
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 14,
            fontWeight: 600,
            color: "#f1f5f9",
            letterSpacing: 1,
            minWidth: 44,
          }}
        >
          {formatHudTime(seconds)}
        </span>

        <button
          type="button"
          className="hud-icon-btn hud-focus"
          disabled={pauseDisabled}
          title={pauseTitle}
          aria-label={pauseTitle}
          onClick={() => {
            if (pauseDisabled) return;
            onPauseToggle?.();
          }}
          style={{
            ...btn,
            color: pauseDisabled ? HUD_ICON_COLOR_DISABLED : HUD_ICON_COLOR,
            cursor: pauseDisabled ? "not-allowed" : "pointer",
            opacity: pauseDisabled ? 0.5 : 1,
          }}
        >
          {paused ? (
            <Svg>
              <polygon points="6 3 20 12 6 21 6 3" />
            </Svg>
          ) : (
            <Svg>
              <rect x="14" y="4" width="4" height="16" rx="1" />
              <rect x="6" y="4" width="4" height="16" rx="1" />
            </Svg>
          )}
        </button>

        {drawEnabled && (
          <button
            type="button"
            className="hud-icon-btn hud-focus"
            title={t.pen}
            aria-label={t.pen}
            aria-pressed={penActive}
            onClick={() => setPen(!penActive)}
            style={{
              ...btn,
              background: penActive ? "rgba(239,68,68,0.25)" : undefined,
              border: penActive ? "1px solid rgba(239,68,68,0.5)" : undefined,
              color: penActive ? HUD_ACCENT_RED : HUD_ICON_COLOR,
              cursor: "pointer",
            }}
          >
            <Svg>
              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
              <path d="m15 5 4 4" />
            </Svg>
          </button>
        )}

        <button
          type="button"
          className="hud-icon-btn hud-focus"
          title={t.stop}
          aria-label={t.stop}
          onClick={onStop}
          style={{ ...btn, color: HUD_ACCENT_RED, cursor: "pointer" }}
        >
          <Svg fill="currentColor">
            <rect width="18" height="18" x="3" y="3" rx="2" />
          </Svg>
        </button>
      </div>

      <style>{`
        @keyframes hud-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .hud-dot-blink { animation: hud-blink 1.2s steps(1, end) infinite; }
        .hud-palette { transition: max-height 0.15s ease, opacity 0.15s ease; }
        .hud-icon-btn {
          background: transparent;
          border: none;
          transition: background-color 0.15s ease;
        }
        .hud-icon-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.08);
        }
        .hud-focus:focus-visible { outline: 2px solid rgba(241,245,249,0.7); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .hud-dot-blink { animation: none; }
          .hud-palette, .hud-icon-btn { transition: none; }
        }
      `}</style>
    </div>
  );
}

/**
 * VolumeBar：音量條。直接訂閱音量並改 DOM 寬度，不經過 React re-render。
 * level 以 0 到 100 計，乘上 gain（0 到 1 以上）後封頂 100%。
 */
export interface VolumeBarProps {
  gain: number;
  enabled: boolean;
  /** 系統聲音用 AutoLens 金，麥克風用 #d4d4d4 */
  color?: string;
  subscribe: (cb: (level: number) => void) => () => void;
  label?: string;
  className?: string;
}

export const VolumeBar = memo(function VolumeBar({ gain, enabled, color = "#eab308", subscribe, label, className }: VolumeBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const gainRef = useRef(gain);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    gainRef.current = gain;
  }, [gain]);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    return subscribe((level) => {
      if (!barRef.current) return;
      const width = enabledRef.current ? Math.min(100, level * gainRef.current) : 0;
      barRef.current.style.width = `${width}%`;
      barRef.current.parentElement?.setAttribute("aria-valuenow", String(Math.round(width)));
    });
  }, [subscribe]);

  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} className={cn("relative h-2 w-32 overflow-hidden rounded-md bg-slate-700/50", className)}>
      <div ref={barRef} className="motion-reduce:!transition-none" style={{ height: "100%", width: "0%", backgroundColor: color, transition: "width 80ms linear" }} />
    </div>
  );
});
