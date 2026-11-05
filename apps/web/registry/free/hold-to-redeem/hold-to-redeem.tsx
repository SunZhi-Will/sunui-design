"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "framer-motion";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface HoldToRedeemLabels {
  /** 平常圈圈下方的提示，{key} 會換成鍵帽上的字 */
  hint?: string;
  /** 走進警告區（warnFrom 之後）時的提示 */
  warn?: string;
  confirming?: ReactNode;
  failed?: ReactNode;
  redeemed?: ReactNode;
  doneAnnouncement?: string;
  failedAnnouncement?: string;
}

export interface HoldToRedeemProps {
  label: ReactNode;
  /** 名稱旁的金色小標籤，例如「120 碎晶」 */
  cost?: ReactNode;
  /** 圈圈中央鍵帽上的字；單一字元時按下該鍵也算按住 */
  keyLabel?: string;
  /** 需要按住多久（ms），原作玩家互動是 0.7 秒 */
  holdMs?: number;
  /** 進度走到這裡（0..1）開始警告：圈圈紅閃、上面驚嘆號、下面提示放開 */
  warnFrom?: number;
  /** 圈滿後呼叫；拋錯＝失敗，圈圈變紅並倒退 */
  onConfirm?: () => void | Promise<void>;
  disabled?: boolean;
  disabledReason?: ReactNode;
  done?: boolean;
  defaultDone?: boolean;
  /** 兌換完成後顯示的內容，例如兌換碼 */
  result?: ReactNode;
  /** 進度色，預設是 --story-accent */
  color?: string;
  /** 配色主題，預設 ink */
  theme?: StoryTheme;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: HoldToRedeemLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<HoldToRedeemLabels>> = {
  en: {
    hint: "Hold {key} to redeem",
    warn: "Release {key} to back out",
    confirming: "Redeeming...",
    failed: "It didn't take. Nothing was spent.",
    redeemed: "Redeemed",
    doneAnnouncement: "Redeemed.",
    failedAnnouncement: "Redeem failed. Nothing was spent.",
  },
  "zh-TW": {
    hint: "按住 {key} 兌換",
    warn: "放開 {key} 可以反悔",
    confirming: "兌換中...",
    failed: "沒有成功，什麼都沒扣。",
    redeemed: "已兌換",
    doneAnnouncement: "已兌換。",
    failedAnnouncement: "兌換失敗，什麼都沒扣。",
  },
  "zh-CN": {
    hint: "按住 {key} 兑换",
    warn: "松开 {key} 可以反悔",
    confirming: "兑换中...",
    failed: "没有成功，什么都没扣。",
    redeemed: "已兑换",
    doneAnnouncement: "已兑换。",
    failedAnnouncement: "兑换失败，什么都没扣。",
  },
  ja: {
    hint: "{key} を長押しで交換",
    warn: "{key} を離すと取り消し",
    confirming: "交換中...",
    failed: "うまくいきませんでした。消費はありません。",
    redeemed: "交換済み",
    doneAnnouncement: "交換しました。",
    failedAnnouncement: "交換に失敗しました。消費はありません。",
  },
};

/** DESIGN-story.md 的 token；ink 是預設暗色，rice 是宣紙亮色，moon 是月光藍 */
export const storyThemes = {
  ink: {
    "--story-bg": "#0b0e14",
    "--story-panel": "rgb(14 18 28 / 0.86)",
    "--story-line": "rgb(234 228 214 / 0.14)",
    "--story-text": "#eae4d6",
    "--story-muted": "rgb(234 228 214 / 0.6)",
    "--story-accent": "#c9a063",
    "--story-on-accent": "#17130d",
    "--story-danger": "#c4553f",
    "--story-shadow": "0 24px 64px rgb(0 0 0 / 0.45)",
    "--story-highlight": "rgb(255 255 255 / 0.06)",
  },
  rice: {
    "--story-bg": "#f4efe3",
    "--story-panel": "rgb(250 246 236 / 0.94)",
    "--story-line": "rgb(60 48 32 / 0.18)",
    "--story-text": "#2a2219",
    "--story-muted": "rgb(42 34 25 / 0.6)",
    "--story-accent": "#9a6b2a",
    "--story-on-accent": "#fbf6ea",
    "--story-danger": "#a33a26",
    "--story-shadow": "0 8px 24px rgb(60 48 32 / 0.12)",
    "--story-highlight": "rgb(255 255 255 / 0.6)",
  },
  moon: {
    "--story-bg": "#070a12",
    "--story-panel": "rgb(12 17 28 / 0.86)",
    "--story-line": "rgb(233 237 245 / 0.12)",
    "--story-text": "#e9edf5",
    "--story-muted": "rgb(233 237 245 / 0.6)",
    "--story-accent": "#a3b8d9",
    "--story-on-accent": "#0b0f18",
    "--story-danger": "#af637a",
    "--story-shadow": "0 24px 64px rgb(0 0 0 / 0.45)",
    "--story-highlight": "rgb(255 255 255 / 0.06)",
  },
} as const;

export type StoryTheme = keyof typeof storyThemes;

// 原作 HoldRing.tsx 的尺寸；顏色改走 --story-*
const SIZE = 76;
const STROKE = 7;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const RED = "var(--story-danger)";
/** 倒退速度（進度／秒）：比填滿快很多，一圈約 0.45 秒退光 */
const REWIND_PER_SEC = 2.2;

type Phase = "idle" | "filling" | "rewinding" | "confirming";

const STYLES = `
  @keyframes hr-tell { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
  .hr-panel { position: relative; color: var(--story-text); background: var(--story-panel);
    border: 1px solid var(--story-line); border-radius: 2px;
    box-shadow: inset 0 1px 0 var(--story-highlight), var(--story-shadow); }
  .hr-keycap { display: inline-grid; place-items: center; min-width: 24px; height: 24px; padding: 0 6px; box-sizing: border-box;
    font-weight: 700; font-size: 0.76rem; line-height: 1; color: var(--story-on-accent);
    background: var(--story-accent); border: 1px solid var(--story-accent); border-radius: 2px;
    box-shadow: inset 0 1px 0 var(--story-highlight); }
  .hr-keycap.dim { color: var(--story-muted); background: var(--story-bg); border-color: var(--story-line); }
  .hr-chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px; font-size: 0.66rem; font-weight: 600; letter-spacing: 0.06em;
    color: var(--story-accent); background: transparent; border: 1px solid var(--story-line); border-radius: 2px; white-space: nowrap; }
  .hr-ring:focus-visible { outline: 1px solid var(--story-accent); outline-offset: 4px; }
  @media (prefers-reduced-motion: reduce) { .hr-tell { animation: none !important; } }
`;

export function HoldToRedeem({
  label,
  cost,
  keyLabel = "E",
  holdMs = 700,
  warnFrom,
  onConfirm,
  disabled = false,
  disabledReason,
  done: doneProp,
  defaultDone = false,
  result,
  color = "var(--story-accent)",
  theme = "ink",
  locale = "en",
  labels,
  className,
}: HoldToRedeemProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const id = useId();

  const [doneState, setDoneState] = useState(defaultDone);
  const done = doneProp ?? doneState;
  const [phase, setPhase] = useState<Phase>("idle");
  const [failed, setFailed] = useState(false);
  const [alarm, setAlarm] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const progress = useMotionValue(done ? 1 : 0);
  const scale = useMotionValue(1);
  const dash = useTransform(progress, (p) => `${C * p} ${C}`);
  // 0 的時候圓頭線帽會留一個點，原作沒在按就整個不畫
  const arcOpacity = useTransform(progress, (p) => (p > 0.001 ? 1 : 0));
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const holding = useRef(false);

  useEffect(() => () => controls.current?.stop(), []);
  useEffect(() => {
    if (done) progress.set(1);
  }, [done, progress]);

  // 走進警告區時亮起驚嘆號
  useMotionValueEvent(progress, "change", (p) => {
    const next = holding.current && warnFrom !== undefined && p >= warnFrom && p < 1;
    setAlarm((a) => (a === next ? a : next));
  });

  const busy = phase === "confirming";

  function rewind() {
    controls.current?.stop();
    const p = progress.get();
    if (reduce || p <= 0) {
      progress.set(0);
      setPhase("idle");
      return;
    }
    setPhase("rewinding");
    controls.current = animate(progress, 0, {
      duration: p / REWIND_PER_SEC,
      ease: "linear",
      onComplete: () => setPhase("idle"),
    });
  }

  async function complete() {
    holding.current = false;
    setAlarm(false);
    setPhase("confirming");
    if (!reduce) animate(scale, [1.12, 1], { duration: 0.25, ease: "linear" });
    try {
      await onConfirm?.();
      setDoneState(true);
      setPhase("idle");
      setAnnouncement(t.doneAnnouncement);
    } catch {
      // 失敗：圈圈變紅並倒退
      setFailed(true);
      setAnnouncement(t.failedAnnouncement);
      rewind();
    }
  }

  // 從目前進度繼續往前填，剩餘時間按比例算
  function start() {
    if (disabled || busy || done || holding.current) return;
    holding.current = true;
    setFailed(false);
    setPhase("filling");
    controls.current?.stop();
    controls.current = animate(progress, 1, {
      duration: ((1 - progress.get()) * holdMs) / 1000,
      ease: "linear",
      onComplete: () => {
        if (holding.current) void complete();
      },
    });
  }

  function release() {
    if (!holding.current) return;
    holding.current = false;
    setAlarm(false);
    rewind();
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.focus();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    start();
  }

  // 有 pointer capture 時 pointerleave 不會觸發，改用座標判斷手指是否滑出圈圈
  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!holding.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) release();
  }

  const isHoldKey = (key: string) =>
    key === " " || key === "Enter" || (keyLabel.length === 1 && key.toLowerCase() === keyLabel.toLowerCase());

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!isHoldKey(e.key)) return;
    e.preventDefault();
    if (!e.repeat) start();
  }

  function onKeyUp(e: KeyboardEvent<HTMLButtonElement>) {
    if (!isHoldKey(e.key)) return;
    e.preventDefault();
    release();
  }

  const ringColor = failed || alarm ? RED : color;
  const fill = (s: string) => s.replace("{key}", keyLabel);

  let hint: ReactNode = fill(t.hint);
  let hintColor = "var(--story-muted)";
  if (done) {
    hint = t.redeemed;
    hintColor = "var(--story-accent)";
  } else if (disabled) {
    hint = disabledReason ?? fill(t.hint);
    hintColor = "var(--story-muted)";
  } else if (busy) {
    hint = t.confirming;
    hintColor = "var(--story-accent)";
  } else if (alarm) {
    hint = fill(t.warn);
    hintColor = "var(--story-danger)";
  } else if (failed) {
    hint = t.failed;
    hintColor = "var(--story-danger)";
  }

  const tell = alarm && !reduce ? { animation: "hr-tell 0.28s linear infinite" } : undefined;

  return (
    <div className={cn("hr-panel w-full px-4 pt-3 pb-3 select-none", className)} style={storyThemes[theme] as unknown as CSSProperties}>
      <style>{STYLES}</style>
      <div className="flex items-start justify-between gap-3">
        <p id={`${id}-label`} className="min-w-0 text-base leading-snug font-semibold tracking-[0.04em] [overflow-wrap:anywhere] text-(--story-text)">
          {label}
        </p>
        {cost && <span className="hr-chip mt-0.5 shrink-0">{cost}</span>}
      </div>

      <div className="relative mx-auto mt-9" style={{ width: SIZE, height: SIZE }}>
        {alarm && (
          <span
            aria-hidden="true"
            className="hr-tell pointer-events-none absolute left-1/2 -translate-x-1/2"
            style={{ top: -32, fontSize: 26, fontWeight: 700, lineHeight: 1, color: "var(--story-danger)", ...tell }}
          >
            !
          </span>
        )}
        <motion.button
          type="button"
          className="hr-ring absolute inset-0 touch-none rounded-full outline-none [-webkit-touch-callout:none] disabled:cursor-not-allowed aria-disabled:cursor-progress"
          style={{ scale, cursor: done ? "default" : undefined }}
          disabled={disabled}
          aria-disabled={busy || done || undefined}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-hint`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={release}
          onContextMenu={(e) => e.preventDefault()}
        >
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="block -rotate-90" aria-hidden="true">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="var(--story-bg)" stroke="var(--story-line)" strokeWidth={STROKE} />
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={ringColor}
              strokeWidth={STROKE}
              strokeLinecap="round"
              className="hr-tell"
              style={{ strokeDasharray: dash, opacity: arcOpacity, ...(tell as CSSProperties | undefined) }}
            />
          </svg>
          <span
            className={cn("hr-keycap absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap", disabled && "dim")}
            aria-hidden="true"
          >
            {done ? <CheckIcon /> : keyLabel}
          </span>
        </motion.button>
      </div>

      <p
        id={`${id}-hint`}
        className="mt-1.5 min-h-5 text-center text-sm leading-5 font-medium [overflow-wrap:anywhere]"
        style={{ color: hintColor }}
      >
        {hint}
      </p>
      {done && result && (
        <p className="mt-1 text-center font-mono text-sm font-semibold tracking-[0.12em] text-(--story-accent) select-all">
          {result}
        </p>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" shapeRendering="crispEdges">
      <path d="M1 6h2v2H1zM3 8h2v2H3zM5 6h2v2H5zM7 4h2v2H7zM9 2h2v2H9z" fill="currentColor" />
    </svg>
  );
}
