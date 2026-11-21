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

/** IDs of all loading effects (including standalone components) */
export const loadingEffects = [
  "bouncing-dots",
  "equalizer",
  "ring-spinner",
  "spinner-check",
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
  "dot-matrix",
] as const;
export type LoadingEffectId = (typeof loadingEffects)[number];

/** List of Loader variants */
export const loaderVariants = [
  "bouncing-dots",
  "equalizer",
  "ring-spinner",
  "spinner-check",
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
// Same as sunui-motion's pop: the one-time settle bounce of the result disc
const pop = { type: "spring", stiffness: 620, damping: 20, mass: 0.8 } as const;
const loop = (t: Transition): Transition => ({ repeat: Infinity, ease: "easeInOut", ...t });
const clampPct = (v: number) => Math.min(100, Math.max(0, v));
const track = "color-mix(in oklab, currentColor 18%, transparent)";

/** Hidden text for screen readers */
function SrOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/** Do not run the loop under reduced motion or when off screen */
function useActive<T extends Element>() {
  const ref = useRef<T>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion() ?? false;
  return { ref, active: inView && !reduce, reduce };
}

export interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  /** Text read out by screen readers */
  label?: string;
  /** 0 to 100, used by progress-ring, bar and liquid */
  value?: number;
  /** Main color, default var(--primary) */
  color?: string;
  /** spinner-check: when true the arc completes, the disc settles and the check draws */
  done?: boolean;
  /** Text read by screen readers when spinner-check completes */
  doneLabel?: string;
  className?: string;
}

export function Loader({ variant = "ring-spinner", size = "md", label = "Loading", value = 0, color, done = false, doneLabel = "Done", className }: LoaderProps) {
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
      <SrOnly>{determinate ? `${label} ${Math.round(pct)}%` : variant === "spinner-check" && done ? doneLabel : label}</SrOnly>
      <span aria-hidden className={cn(isBar ? "flex w-full" : "inline-flex", "items-center justify-center")}>
        {variant === "bouncing-dots" && <BouncingDots s={s} active={active} />}
        {variant === "equalizer" && <Equalizer s={s} active={active} />}
        {variant === "ring-spinner" && <RingSpinner s={s} active={active} />}
        {variant === "spinner-check" && <SpinnerCheck s={s} active={active} done={done} reduce={reduce} />}
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

/* ---- Indeterminate ---- */

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

/** The spinning arc closes into a circle on completion, then the disc settles once with pop and the check strokes in, same feel as Result */
function SpinnerCheck({ s, active, done, reduce }: { s: number; active: boolean; done: boolean; reduce: boolean }) {
  const sw = Math.max(2.5, s * 0.1);
  const r = (s - sw) / 2;
  const rot = useMotionValue(0);
  useEffect(() => {
    if (!active || done) return;
    // Continue from the current angle; on completion stop in place, and once the arc is full the angle is invisible
    const c = animate(rot, rot.get() + 360, { repeat: Infinity, ease: "linear", duration: 0.9 });
    return () => c.stop();
  }, [active, done, rot]);
  const t = (o: Transition): Transition => (reduce ? { duration: 0 } : o);
  return (
    <span className="relative inline-grid place-items-center" style={{ width: s, height: s }}>
      <motion.svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" className="absolute inset-0" style={{ rotate: rot }}>
        <circle cx={s / 2} cy={s / 2} r={r} stroke={track} strokeWidth={sw} />
        <motion.circle
          cx={s / 2}
          cy={s / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: done ? 1 : 0.28 }}
          transition={t({ duration: 0.22, ease: "easeOut" })}
        />
      </motion.svg>
      <motion.span
        className="absolute inset-0 rounded-full bg-current shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]"
        initial={false}
        animate={done ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
        transition={done ? t({ ...pop, delay: 0.18 }) : t({ duration: 0.15 })}
      />
      <svg viewBox="0 0 24 24" className="relative" style={{ width: s * 0.5, height: s * 0.5 }} fill="none" stroke="var(--background)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={false}
          animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
          transition={done ? t({ duration: 0.2, ease: "easeOut", delay: 0.28 }) : t({ duration: 0.1 })}
        />
      </svg>
    </span>
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

/* ---- Determinate ---- */

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
  // Liquid level: fully filled at 100%, leaving a small crest
  const y = useTransform(level, (v) => `${100 - v}%`);
  // Wavelength is 50 and the path is drawn 200 wide, so shifting by 100 loops seamlessly
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
/* top-loading-bar: rushes to about 80% quickly, then creeps slowly, fills up and fades out on completion */
/* ------------------------------------------------------------------ */

export interface TopLoadingBarProps {
  loading: boolean;
  label?: string;
  /** "fixed" sticks to the top of the window (default), "absolute" sticks to the top of the nearest relative parent */
  position?: "fixed" | "absolute";
  /** Height (px) */
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
/* multi-step: steps are ticked off one by one, a bright background follows the current step */
/* ------------------------------------------------------------------ */

export interface MultiStepLoaderProps {
  steps: string[];
  /** Controlled: index of the current step; equal to steps.length means all done */
  current?: number;
  /** Interval between steps when uncontrolled (ms) */
  interval?: number;
  /** Whether to restart after finishing when uncontrolled */
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
/* skeleton-shimmer: placeholder blocks with a sweeping light */
/* ------------------------------------------------------------------ */

export interface SkeletonBlockProps {
  className?: string;
  style?: CSSProperties;
  /** Passed in by Skeleton; decided on its own when used standalone */
  shimmer?: boolean;
}

/** A single placeholder block; use className to set shape and size */
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
  /** Number of text lines */
  lines?: number;
  /** Show a round avatar */
  avatar?: boolean;
  /** Show a large image on top */
  media?: boolean;
  label?: string;
  className?: string;
}

/** A common card skeleton: large image, avatar, title and a few lines of text */
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

/* ------------------------------------------------------------------ */
/* dot-matrix: a 7 by 7 grid of dots. While loading, one of six patterns
   loops. With a value, the same pattern decides the order the dots fill in.
   On success or error every dot lights once, then only the dots that draw a
   check or a cross stay on. */
/* ------------------------------------------------------------------ */

export const dotMatrixPatterns = ["wave", "spiral", "rain", "ripple", "snake", "scan"] as const;
export type DotMatrixPattern = (typeof dotMatrixPatterns)[number];
export type DotMatrixState = "loading" | "progress" | "success" | "error";

const N = 7;
const CELLS = N * N;
const MID = (N - 1) / 2;
const DOT_SIZES: Record<LoaderSize, { dot: number; gap: number }> = {
  sm: { dot: 3, gap: 2 },
  md: { dot: 4, gap: 2.5 },
  lg: { dot: 6, gap: 3 },
};
/** Opacity of a dot that is off, so the grid always reads as a grid */
const DOT_BASE = 0.16;

const cell = (x: number, y: number) => y * N + x;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** 1 at the head of a moving line, fading to 0 over len cells behind it */
const trail = (d: number, len: number) => (d < 0 || d > len ? 0 : 1 - d / len);

/** Clockwise path from the outer ring to the centre */
const SPIRAL_IN: number[] = (() => {
  const out: number[] = [];
  let top = 0, bottom = N - 1, left = 0, right = N - 1;
  while (top <= bottom && left <= right) {
    for (let x = left; x <= right; x++) out.push(cell(x, top));
    top++;
    for (let y = top; y <= bottom; y++) out.push(cell(right, y));
    right--;
    if (top <= bottom) for (let x = right; x >= left; x--) out.push(cell(x, bottom));
    bottom--;
    if (left <= right) for (let y = bottom; y >= top; y--) out.push(cell(left, y));
    left++;
  }
  return out;
})();
/** Rows left to right, then right to left */
const SNAKE_PATH: number[] = Array.from({ length: CELLS }, (_, i) => {
  const y = Math.floor(i / N);
  const k = i % N;
  return cell(y % 2 ? N - 1 - k : k, y);
});
const DIST = Array.from({ length: CELLS }, (_, i) => Math.hypot((i % N) - MID, Math.floor(i / N) - MID));

/** order[k] = the cell that lights k-th; returns rank[cell] */
const toRank = (order: number[]) => {
  const rank = new Array<number>(CELLS);
  order.forEach((c, k) => (rank[c] = k));
  return rank;
};
const byIndex = (key: (x: number, y: number) => number) =>
  toRank(Array.from({ length: CELLS }, (_, i) => i).sort((a, b) => key(a % N, Math.floor(a / N)) - key(b % N, Math.floor(b / N))));

const SPIRAL_RANK = toRank(SPIRAL_IN);
const SNAKE_RANK = toRank(SNAKE_PATH);
/** Fill order for the progress state, one per pattern, chosen to echo its loop */
const FILL_RANK: Record<DotMatrixPattern, number[]> = {
  wave: byIndex((x, y) => x * N + y),
  spiral: toRank([...SPIRAL_IN].reverse()),
  rain: byIndex((x, y) => (N - 1 - y) * N + x),
  ripple: byIndex((x, y) => DIST[cell(x, y)] * 100 + Math.atan2(y - MID, x - MID)),
  snake: SPIRAL_RANK,
  scan: byIndex((x, y) => y * N + x),
};
/** Rain: each column falls at its own phase and speed */
const RAIN_PHASE = [0.1, 0.62, 0.33, 0.86, 0.2, 0.71, 0.45];
const RAIN_SPEED = [7, 9, 8, 10, 7.5, 9.5, 8.5];

/** Brightness 0..1 of one dot at time t (seconds) while loading */
function loopFrame(p: DotMatrixPattern, i: number, t: number) {
  const x = i % N;
  const y = Math.floor(i / N);
  switch (p) {
    case "wave":
      return clamp01(1 - Math.abs(y - (MID + 2.4 * Math.sin(x * 0.85 - t * 4.2))) / 1.1);
    case "spiral":
      return trail((((t * 22) % CELLS) - SPIRAL_RANK[i] + CELLS) % CELLS, 9);
    case "rain":
      return trail(((t * RAIN_SPEED[x] + RAIN_PHASE[x] * 11) % (N + 4)) - y, 3);
    case "ripple": {
      const front = (t * 3.2) % 5.5;
      return clamp01(1 - Math.abs(DIST[i] - front) / 0.9) * (1 - front / 7);
    }
    case "snake":
      return trail((((t * 20) % CELLS) - SNAKE_RANK[i] + CELLS) % CELLS, 8);
    case "scan": {
      const s = (t * 5) % (2 * (N - 1));
      return clamp01(1 - Math.abs(y - (s < N - 1 ? s : 2 * (N - 1) - s)) / 1.2);
    }
  }
}

/** Dots that stay on in the result, in the order they light */
const CHECK = [[0, 3], [1, 4], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1]].map(([x, y]) => cell(x, y));
const CROSS = [
  ...Array.from({ length: N }, (_, i) => cell(i, i)),
  ...Array.from({ length: N }, (_, i) => cell(N - 1 - i, i)).filter((c) => c !== cell(MID, MID)),
];
const FLOOD = 0.16; // seconds every dot stays lit before the result shape gathers
const STAGGER = 0.035;

function resultFrame(shape: number[], i: number, s: number) {
  if (s < FLOOD) return 1;
  const k = shape.indexOf(i);
  return k >= 0 && s >= FLOOD + k * STAGGER ? 1 : 0;
}

/**
 * spot: one colour, the brand spot colour (default).
 * status: spot while waiting, green on success, red on error.
 * aurora, sunset, lagoon, prism: a gradient across the grid that drifts slowly while loading.
 * Error is always red, whatever the palette, so failure never reads as decoration.
 */
export const dotMatrixPalettes = ["spot", "status", "aurora", "sunset", "lagoon", "prism"] as const;
export type DotMatrixPalette = (typeof dotMatrixPalettes)[number];

/** Gradient palettes as an oklch hue range; lightness and chroma stay fixed so every hue reads at the same weight */
const GRADIENTS: Partial<Record<DotMatrixPalette, { from: number; to: number; l: number; c: number }>> = {
  aurora: { from: 165, to: 95, l: 0.72, c: 0.15 },
  sunset: { from: 75, to: -15, l: 0.72, c: 0.17 },
  lagoon: { from: 150, to: 245, l: 0.7, c: 0.14 },
  prism: { from: 0, to: 330, l: 0.7, c: 0.17 },
};
const SUCCESS = "var(--sunui-success, oklch(0.7 0.16 155))";
const ERROR = "var(--destructive)";

/**
 * Where a dot sits on the gradient, 0..1. Loading and progress run it along the diagonal and drift it with time;
 * the check and cross run it left to right so the few dots they keep still carry the whole gradient.
 */
function gradientAt(i: number, t: number, result: boolean) {
  const x = i % N;
  const y = Math.floor(i / N);
  if (result) return x / (N - 1);
  return 0.5 + 0.5 * Math.sin(Math.PI * ((x + y) / (2 * (N - 1)) - 0.5 + t * 0.35));
}

/** Cell shape: round dot, square pixel, diamond, outline ring that fills when lit, or a tall bar */
export type DotMatrixShape = "dot" | "square" | "diamond" | "ring" | "bar";

export interface DotMatrixLoaderProps {
  /** Loop shape while loading, and fill order for progress */
  pattern?: DotMatrixPattern;
  /** loading loops; progress fills by value; success draws a check; error draws a cross */
  state?: DotMatrixState;
  /** 0 to 100, used when state is progress */
  value?: number;
  size?: LoaderSize;
  /** Colour scheme, see dotMatrixPalettes. Default spot */
  palette?: DotMatrixPalette;
  /** Cell shape, default dot */
  shape?: DotMatrixShape;
  /** Lit cells glow in their own colour, like LEDs. Best on dark surfaces */
  glow?: boolean;
  /** fade: off cells stay full size and dim (default). scale: off cells shrink to specks, lit cells grow */
  emphasis?: "fade" | "scale";
  /** Dot colour for the spot palette, default the brand spot colour (falls back to --primary) */
  color?: string;
  label?: string;
  doneLabel?: string;
  errorLabel?: string;
  className?: string;
}

export function DotMatrixLoader({
  pattern = "wave",
  state = "loading",
  value = 0,
  size = "md",
  palette = "spot",
  shape = "dot",
  glow = false,
  emphasis = "fade",
  color,
  label = "Loading",
  doneLabel = "Done",
  errorLabel = "Failed",
  className,
}: DotMatrixLoaderProps) {
  const { ref, active, reduce } = useActive<HTMLSpanElement>();
  const gridRef = useRef<HTMLSpanElement>(null);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const cur = useRef<number[]>(new Array(CELLS).fill(0));
  const stateAt = useRef(0);
  const pct = clampPct(value);
  const { dot, gap } = DOT_SIZES[size];

  useEffect(() => {
    stateAt.current = performance.now();
  }, [state]);

  useEffect(() => {
    const target = (i: number, now: number) => {
      const s = (now - stateAt.current) / 1000;
      if (state === "progress") return clamp01((pct / 100) * CELLS - FILL_RANK[pattern][i]);
      if (state === "success") return resultFrame(CHECK, i, reduce ? 9 : s);
      if (state === "error") return resultFrame(CROSS, i, reduce ? 9 : s);
      // Reduced motion: a still frame of the pattern, the status text says it is loading
      return loopFrame(pattern, i, reduce ? 0.35 : now / 1000);
    };
    const grad = state === "error" ? undefined : GRADIENTS[palette];
    const paint = (i: number, v: number, now = 0) => {
      const el = dots.current[i];
      if (!el) return;
      if (grad) {
        // Results hold still; only the loop drifts
        const g = gradientAt(i, state === "loading" && !reduce ? now / 1000 : 0, state === "success");
        el.style.color = `oklch(${grad.l} ${grad.c} ${grad.from + (grad.to - grad.from) * g})`;
      } else if (el.style.color) {
        el.style.color = "";
      }
      const scaleMode = emphasis === "scale";
      el.style.opacity = String(scaleMode ? 0.3 + 0.7 * v : DOT_BASE + (1 - DOT_BASE) * v);
      const k = scaleMode ? 0.32 + 0.68 * v : 0.72 + 0.28 * v;
      el.style.transform =
        shape === "diamond" ? `rotate(45deg) scale(${k})` : shape === "bar" ? `scale(${0.85 + 0.15 * v}, ${scaleMode ? k : 0.45 + 0.55 * v})` : `scale(${k})`;
      const shadows: string[] = [];
      if (shape === "ring") shadows.push(`inset 0 0 0 ${((dot / 2) * v).toFixed(2)}px currentColor`);
      if (glow && v > 0.01) shadows.push(`0 0 ${(dot * 1.6 * v).toFixed(2)}px ${(dot * 0.15 * v).toFixed(2)}px currentColor`);
      el.style.boxShadow = shadows.join(", ");
    };

    if (reduce || !active) {
      const now = performance.now();
      for (let i = 0; i < CELLS; i++) {
        if (reduce) cur.current[i] = target(i, now);
        paint(i, cur.current[i], now);
      }
      if (gridRef.current) gridRef.current.style.transform = "";
      return;
    }

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = 1 - Math.exp(-dt / (state === "loading" ? 0.06 : 0.09));
      let moving = false;
      for (let i = 0; i < CELLS; i++) {
        const goal = target(i, now);
        const next = cur.current[i] + (goal - cur.current[i]) * k;
        if (Math.abs(goal - next) > 0.002) moving = true;
        cur.current[i] = next;
        paint(i, next, now);
      }
      // Error: one short shake, then still
      const s = (now - stateAt.current) / 1000;
      const shake = state === "error" && s < 0.36;
      if (gridRef.current) gridRef.current.style.transform = shake ? `translateX(${Math.sin(s * 42) * 2 * (1 - s / 0.36)}px)` : "";
      const settling = state !== "loading" && s < FLOOD + CELLS * STAGGER;
      if (state === "loading" || moving || shake || settling) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, pattern, pct, active, reduce, palette, shape, glow, emphasis, dot]);

  const text =
    state === "success" ? doneLabel : state === "error" ? errorLabel : state === "progress" ? `${label} ${Math.round(pct)}%` : label;

  return (
    <span
      ref={ref}
      role="status"
      className={cn("inline-flex items-center justify-center transition-colors duration-200", className)}
      style={{
        color:
          state === "error"
            ? ERROR
            : palette === "status" && state === "success"
              ? SUCCESS
              : (color ?? "var(--sunui-spot, var(--primary))"),
      }}
    >
      <SrOnly>{text}</SrOnly>
      <span
        ref={gridRef}
        aria-hidden
        className="grid"
        style={{ gridTemplateColumns: `repeat(${N}, ${dot}px)`, gap, rowGap: shape === "bar" ? gap * 0.6 : gap }}
      >
        {Array.from({ length: CELLS }, (_, i) => (
          <span
            key={i}
            ref={(el) => {
              dots.current[i] = el;
            }}
            className={cn(
              "transition-[color] duration-200",
              shape === "ring" ? "rounded-full border-current" : "bg-current",
              (shape === "dot" || shape === "bar") && "rounded-full",
              (shape === "square" || shape === "diamond") && "rounded-[1px]",
            )}
            style={{
              width: dot,
              height: shape === "bar" ? dot * 2.4 : dot,
              borderWidth: shape === "ring" ? Math.max(1, dot * 0.18) : undefined,
              opacity: DOT_BASE,
              transform: "scale(0.72)",
            }}
          />
        ))}
      </span>
    </span>
  );
}
