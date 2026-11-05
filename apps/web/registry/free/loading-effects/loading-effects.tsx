"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Transition,
  type Variants,
} from "framer-motion";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 全部載入效果的 id（含獨立元件） */
export const loadingEffects = [
  "bouncing-dots",
  "equalizer",
  "ring-spinner",
  "orbit",
  "pulse-dot",
  "progress-ring",
  "bar",
  "indeterminate-bar",
  "typing-indicator",
  "liquid",
  "top-loading-bar",
  "multi-step",
  "skeleton-shimmer",
] as const;
export type LoadingEffectId = (typeof loadingEffects)[number];

/** Loader 的 variant 清單 */
export const loaderVariants = [
  "bouncing-dots",
  "equalizer",
  "ring-spinner",
  "orbit",
  "pulse-dot",
  "progress-ring",
  "bar",
  "indeterminate-bar",
  "typing-indicator",
  "liquid",
] as const;
export type LoaderVariant = (typeof loaderVariants)[number];

export type LoaderSize = "sm" | "md" | "lg";
const SIZES: Record<LoaderSize, number> = { sm: 20, md: 36, lg: 56 };

const spring = { type: "spring", stiffness: 140, damping: 22 } as const;
const loop = (t: Transition): Transition => ({ repeat: Infinity, ease: "easeInOut", ...t });
const clampPct = (v: number) => Math.min(100, Math.max(0, v));
const track = "color-mix(in oklab, currentColor 18%, transparent)";

/** 讀屏用的隱藏文字 */
function SrOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/** reduced motion 或離開畫面時不跑循環 */
function useActive<T extends Element>() {
  const ref = useRef<T>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion() ?? false;
  return { ref, active: inView && !reduce, reduce };
}

export interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  /** 讀屏念出的文字 */
  label?: string;
  /** 0 到 100，給 progress-ring、bar、liquid 使用 */
  value?: number;
  /** 主色，預設 var(--primary) */
  color?: string;
  className?: string;
}

export function Loader({ variant = "ring-spinner", size = "md", label = "Loading", value = 0, color, className }: LoaderProps) {
  const { ref, active, reduce } = useActive<HTMLSpanElement>();
  const s = SIZES[size];
  const determinate = variant === "progress-ring" || variant === "bar" || variant === "liquid";
  const pct = clampPct(value);
  const style: CSSProperties = { color: color ?? "var(--primary)" };
  const isBar = variant === "bar" || variant === "indeterminate-bar";

  return (
    <span
      ref={ref}
      role="status"
      className={cn(isBar ? "flex w-full" : "inline-flex", "items-center justify-center", className)}
      style={style}
    >
      <SrOnly>{determinate ? `${label} ${Math.round(pct)}%` : label}</SrOnly>
      <span aria-hidden className={cn(isBar ? "flex w-full" : "inline-flex", "items-center justify-center")}>
        {variant === "bouncing-dots" && <BouncingDots s={s} active={active} />}
        {variant === "equalizer" && <Equalizer s={s} active={active} />}
        {variant === "ring-spinner" && <RingSpinner s={s} active={active} />}
        {variant === "orbit" && <Orbit s={s} active={active} />}
        {variant === "pulse-dot" && <PulseDot s={s} active={active} />}
        {variant === "progress-ring" && <ProgressRing s={s} pct={pct} reduce={reduce} />}
        {variant === "bar" && <ProgressBar s={s} pct={pct} reduce={reduce} />}
        {variant === "indeterminate-bar" && <IndeterminateBar s={s} active={active} />}
        {variant === "typing-indicator" && <TypingIndicator s={s} active={active} />}
        {variant === "liquid" && <Liquid s={s} pct={pct} active={active} reduce={reduce} />}
      </span>
    </span>
  );
}

/* ---- 不定進度 ---- */

function BouncingDots({ s, active }: { s: number; active: boolean }) {
  const d = Math.max(4, s * 0.22);
  return (
    <span className="inline-flex items-end" style={{ gap: d * 0.6, height: s, paddingBottom: s * 0.15 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="rounded-full bg-current"
          style={{ width: d, height: d }}
          animate={active ? { y: [0, -s * 0.4, 0] } : { y: 0 }}
          transition={active ? loop({ duration: 0.6, delay: i * 0.12, repeatDelay: 0.3 }) : { duration: 0.2 }}
        />
      ))}
    </span>
  );
}

const EQ = [
  [0.35, 1, 0.5, 0.8, 0.35],
  [0.8, 0.4, 1, 0.3, 0.8],
  [0.5, 0.9, 0.3, 1, 0.5],
  [1, 0.45, 0.7, 0.4, 1],
];

function Equalizer({ s, active }: { s: number; active: boolean }) {
  const w = Math.max(3, s * 0.14);
  return (
    <span className="inline-flex items-end" style={{ height: s, gap: w * 0.6 }}>
      {EQ.map((frames, i) => (
        <motion.span
          key={i}
          className="h-full origin-bottom rounded-sm bg-current"
          style={{ width: w }}
          initial={{ scaleY: frames[0] }}
          animate={{ scaleY: active ? frames : frames[0] }}
          transition={active ? loop({ duration: 1.1 + i * 0.08, ease: "easeInOut" }) : { duration: 0.2 }}
        />
      ))}
    </span>
  );
}

function RingSpinner({ s, active }: { s: number; active: boolean }) {
  const sw = Math.max(2.5, s * 0.1);
  const r = (s - sw) / 2;
  return (
    <motion.svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      animate={{ rotate: active ? 360 : 0 }}
      transition={active ? { repeat: Infinity, ease: "linear", duration: 0.9 } : { duration: 0 }}
    >
      <circle cx={s / 2} cy={s / 2} r={r} stroke={track} strokeWidth={sw} />
      <circle cx={s / 2} cy={s / 2} r={r} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" pathLength={100} strokeDasharray="28 72" />
    </motion.svg>
  );
}

function Orbit({ s, active }: { s: number; active: boolean }) {
  const d = Math.max(4, s * 0.18);
  return (
    <span className="relative inline-block" style={{ width: s, height: s }}>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current opacity-30" style={{ width: d, height: d }} />
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0"
          initial={{ rotate: i * 120 }}
          animate={{ rotate: active ? i * 120 + 360 : i * 120 }}
          transition={active ? { repeat: Infinity, ease: "linear", duration: 1.4 + i * 0.35 } : { duration: 0 }}
        >
          <span
            className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-current"
            style={{ width: d * (1 - i * 0.2), height: d * (1 - i * 0.2), opacity: 1 - i * 0.2 }}
          />
        </motion.span>
      ))}
    </span>
  );
}

function PulseDot({ s, active }: { s: number; active: boolean }) {
  const d = s * 0.36;
  return (
    <span className="relative inline-grid place-items-center" style={{ width: s, height: s }}>
      {active &&
        [0, 1].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-current"
            style={{ width: d, height: d }}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut", delay: i * 0.8 }}
          />
        ))}
      <span className="relative rounded-full bg-current" style={{ width: d, height: d }} />
    </span>
  );
}

function IndeterminateBar({ s, active }: { s: number; active: boolean }) {
  const h = Math.max(3, s * 0.12);
  return (
    <span className="relative block w-full overflow-hidden rounded-full" style={{ height: h, background: track }}>
      <motion.span
        className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-current"
        initial={{ x: active ? "-100%" : "75%" }}
        animate={{ x: active ? "250%" : "75%" }}
        transition={active ? { repeat: Infinity, duration: 1.3, ease: [0.45, 0, 0.2, 1] } : { duration: 0 }}
      />
    </span>
  );
}

const typingDot: Variants = {
  rest: { opacity: 0.6, y: 0 },
  run: (i: number) => ({
    opacity: [0.35, 1, 0.35],
    y: [0, -3, 0],
    transition: { repeat: Infinity, duration: 1, delay: i * 0.18, ease: "easeInOut" },
  }),
};

function TypingIndicator({ s, active }: { s: number; active: boolean }) {
  const d = Math.max(4, s * 0.18);
  return (
    <span
      className="inline-flex items-center rounded-2xl rounded-bl-sm bg-muted"
      style={{ gap: d * 0.6, padding: `${d * 0.9}px ${d * 1.3}px` }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          custom={i}
          variants={typingDot}
          initial="rest"
          animate={active ? "run" : "rest"}
          className="rounded-full bg-muted-foreground"
          style={{ width: d, height: d }}
        />
      ))}
    </span>
  );
}

/* ---- 確定進度 ---- */

function ProgressRing({ s, pct, reduce }: { s: number; pct: number; reduce: boolean }) {
  const size = Math.max(s, 28);
  const sw = Math.max(3, size * 0.1);
  const r = (size - sw) / 2;
  const v = useSpring(pct / 100, spring);
  useEffect(() => {
    if (reduce) v.jump(pct / 100);
    else v.set(pct / 100);
  }, [pct, reduce, v]);
  const text = useTransform(v, (x) => `${Math.round(x * 100)}`);
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={sw} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" style={{ pathLength: v }} />
      </svg>
      {size >= 36 && (
        <motion.span className="absolute font-medium tabular-nums text-foreground" style={{ fontSize: size * 0.26 }}>
          {text}
        </motion.span>
      )}
    </span>
  );
}

function ProgressBar({ s, pct, reduce }: { s: number; pct: number; reduce: boolean }) {
  const h = Math.max(4, s * 0.16);
  const v = useSpring(pct / 100, spring);
  useEffect(() => {
    if (reduce) v.jump(pct / 100);
    else v.set(pct / 100);
  }, [pct, reduce, v]);
  return (
    <span className="relative block w-full overflow-hidden rounded-full" style={{ height: h, background: track }}>
      <motion.span className="absolute inset-0 origin-left rounded-full bg-current" style={{ scaleX: v }} />
    </span>
  );
}

function Liquid({ s, pct, active, reduce }: { s: number; pct: number; active: boolean; reduce: boolean }) {
  const size = Math.max(s, 32);
  const level = useSpring(pct, spring);
  useEffect(() => {
    if (reduce) level.jump(pct);
    else level.set(pct);
  }, [pct, reduce, level]);
  // 液面高度：100% 時整個填滿，留一點波峰
  const y = useTransform(level, (v) => `${100 - v}%`);
  // 波長 50，路徑畫到 200 寬，平移 100 剛好無縫循環
  const wave = "M0 6 Q12.5 0 25 6 T50 6 T75 6 T100 6 T125 6 T150 6 T175 6 T200 6 V100 H0Z";
  return (
    <span
      className="relative inline-block overflow-hidden rounded-full border-2 border-current"
      style={{ width: size, height: size }}
    >
      <motion.span className="absolute inset-x-0 -bottom-[6%] h-[112%]" style={{ y }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
          <motion.path
            d={wave}
            fill="currentColor"
            opacity={0.35}
            animate={{ x: active ? [-100, 0] : -50 }}
            transition={active ? { repeat: Infinity, ease: "linear", duration: 2.6 } : { duration: 0 }}
          />
          <motion.path
            d={wave}
            fill="currentColor"
            animate={{ x: active ? [0, -100] : 0 }}
            transition={active ? { repeat: Infinity, ease: "linear", duration: 1.8 } : { duration: 0 }}
          />
        </svg>
      </motion.span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* top-loading-bar：快速衝到約 80%，接著慢慢爬，完成時補滿再淡出          */
/* ------------------------------------------------------------------ */

export interface TopLoadingBarProps {
  loading: boolean;
  label?: string;
  /** "fixed" 貼在視窗頂端（預設），"absolute" 貼在最近的 relative 父層頂端 */
  position?: "fixed" | "absolute";
  /** 高度（px） */
  height?: number;
  color?: string;
  className?: string;
}

export function TopLoadingBar({ loading, label = "Loading", position = "fixed", height = 3, color, className }: TopLoadingBarProps) {
  const reduce = useReducedMotion() ?? false;
  const scale = useMotionValue(0);
  const opacity = useMotionValue(0);
  const started = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const controls: { stop: () => void }[] = [];
    const run = (c: { stop: () => void; then: (cb: () => void) => Promise<void> }, next?: () => void) => {
      controls.push(c);
      if (next) c.then(() => !cancelled && next());
    };

    if (loading) {
      started.current = true;
      opacity.jump(1);
      if (reduce) {
        scale.jump(1);
      } else {
        scale.jump(0);
        run(animate(scale, 0.8, { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }), () =>
          run(animate(scale, 0.95, { duration: 12, ease: "linear" })),
        );
      }
    } else if (started.current) {
      if (reduce) {
        opacity.jump(0);
        scale.jump(0);
      } else {
        run(animate(scale, 1, { duration: 0.25, ease: "easeOut" }), () =>
          run(animate(opacity, 0, { duration: 0.35 }), () => scale.jump(0)),
        );
      }
    }
    return () => {
      cancelled = true;
      controls.forEach((c) => c.stop());
    };
  }, [loading, reduce, scale, opacity]);

  return (
    <div
      className={cn(position, "inset-x-0 top-0 z-50 overflow-hidden", className)}
      style={{ height, color: color ?? "var(--primary)" }}
      role="status"
    >
      {loading && <SrOnly>{label}</SrOnly>}
      <motion.div
        aria-hidden
        className="h-full origin-left bg-current shadow-[0_0_8px_currentColor]"
        style={{ scaleX: scale, opacity }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* multi-step：步驟逐一打勾，亮底跟著目前步驟移動                         */
/* ------------------------------------------------------------------ */

export interface MultiStepLoaderProps {
  steps: string[];
  /** 受控：目前步驟的索引；等於 steps.length 代表全部完成 */
  current?: number;
  /** 非受控時每一步的間隔（ms） */
  interval?: number;
  /** 非受控時跑完是否重來 */
  loop?: boolean;
  label?: string;
  className?: string;
}

export function MultiStepLoader({ steps, current, interval = 1400, loop = false, label = "Loading", className }: MultiStepLoaderProps) {
  const { ref, active, reduce } = useActive<HTMLDivElement>();
  const highlightId = useId();
  const [auto, setAuto] = useState(0);
  const index = current ?? auto;

  useEffect(() => {
    if (current !== undefined || !active) return;
    const t = setTimeout(() => {
      setAuto((i) => (i >= steps.length ? (loop ? 0 : i) : i + 1));
    }, auto >= steps.length ? interval * 1.6 : interval);
    return () => clearTimeout(t);
  }, [current, active, auto, interval, loop, steps.length]);

  const done = index >= steps.length;

  return (
    <div ref={ref} role="status" className={cn("w-full max-w-xs", className)}>
      <SrOnly>
        {done ? `${label}: ${steps.length}/${steps.length}` : `${label}: ${steps[index]} (${index + 1}/${steps.length})`}
      </SrOnly>
      <ol aria-hidden className="relative flex flex-col gap-1">
        {steps.map((step, i) => {
          const state = i < index ? "done" : i === index ? "current" : "pending";
          return (
            <li key={step + i} className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
              {state === "current" && (
                <motion.span
                  layoutId={highlightId}
                  className="absolute inset-0 rounded-lg bg-muted"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative grid size-5 shrink-0 place-items-center">
                {state === "done" && (
                  <motion.svg
                    viewBox="0 0 20 20"
                    className="size-5 text-primary"
                    initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <circle cx="10" cy="10" r="9" fill="currentColor" />
                    <motion.path
                      d="M6 10.5l2.6 2.5L14 7.5"
                      fill="none"
                      stroke="var(--primary-foreground)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={reduce ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    />
                  </motion.svg>
                )}
                {state === "current" && (
                  <span className="text-primary">
                    <RingSpinner s={18} active={active} />
                  </span>
                )}
                {state === "pending" && <span className="size-4 rounded-full border-2 border-border" />}
              </span>
              <span
                className={cn(
                  "relative transition-colors",
                  state === "pending" ? "text-muted-foreground" : "text-foreground",
                  state === "current" && "font-medium",
                )}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* skeleton-shimmer：佔位方塊與一道掃過的光                               */
/* ------------------------------------------------------------------ */

export interface SkeletonBlockProps {
  className?: string;
  style?: CSSProperties;
  /** 由 Skeleton 傳入；單獨使用時自己判斷 */
  shimmer?: boolean;
}

/** 單一佔位方塊，用 className 決定形狀與尺寸 */
export function SkeletonBlock({ className, style, shimmer = true }: SkeletonBlockProps) {
  const { ref, active } = useActive<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden className={cn("relative overflow-hidden rounded-md bg-muted", className)} style={style}>
      {shimmer && active && (
        <motion.div
          className="absolute inset-y-0 -left-full w-full"
          style={{ background: "linear-gradient(90deg, transparent, color-mix(in oklab, var(--background) 60%, transparent), transparent)" }}
          animate={{ x: ["0%", "200%"] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", repeatDelay: 0.3 }}
        />
      )}
    </div>
  );
}

export interface SkeletonProps {
  /** 文字列數 */
  lines?: number;
  /** 顯示圓形頭像 */
  avatar?: boolean;
  /** 顯示上方大圖 */
  media?: boolean;
  label?: string;
  className?: string;
}

/** 一組常見的卡片骨架：大圖、頭像、標題與幾行文字 */
export function Skeleton({ lines = 3, avatar = true, media = false, label = "Loading", className }: SkeletonProps) {
  return (
    <div role="status" className={cn("flex w-full flex-col gap-3", className)}>
      <SrOnly>{label}</SrOnly>
      {media && <SkeletonBlock className="aspect-[16/9] w-full rounded-lg" />}
      <div className="flex items-center gap-3">
        {avatar && <SkeletonBlock className="size-10 shrink-0 rounded-full" />}
        <div className="flex flex-1 flex-col gap-2">
          <SkeletonBlock className="h-3.5 w-1/2" />
          <SkeletonBlock className="h-3 w-1/3" />
        </div>
      </div>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBlock key={i} className="h-3" style={{ width: i === lines - 1 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}
