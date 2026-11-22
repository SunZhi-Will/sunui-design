"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition, type Variants } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Status dot: the shape tells progress, the time tells freshness.
 * - shape: dot (default, a 6px solid dot, same as the old version), ring (empty ring) = pending, half (half circle) = processing,
 *   full (solid) = done, slashed (ring with a slash) = canceled. You can also pass progress (0 to 1) to draw any sector
 * - live: only in-progress states move, with a quiet expanding ring; no motion under reduced motion
 * - since: followed by pale relative time such as "· 2 hours ago", using Intl.RelativeTimeFormat, refreshed every 30 seconds
 * When the status changes it morphs in place: the sector fills to the new amount, the text rolls up or down to swap, the width follows, and the dot is an anchor that stays put.
 * Color is only on the dot (8px or smaller), the text keeps the normal text color; in black and white the shape alone is still readable.
 */

// Status colors: the SunUI semantic set (success, rating/warning, like/danger) and the brand spot for info, so a status dot matches every other block (see the 2026-11-22 colour unification report in reports/)
const STATUS_TOKENS =
  "[--db-success:var(--sunui-success,#1f9d55)] [--db-warning:var(--sunui-rating,#c98a12)] [--db-danger:var(--destructive,#dc3d43)] [--db-info:var(--sunui-spot,var(--primary))] dark:[--db-success:var(--sunui-success,#4cd68a)] dark:[--db-warning:var(--sunui-rating,#f5b84a)] dark:[--db-danger:var(--destructive,#ff6b70)]";

export type StatusTone = "success" | "warning" | "destructive" | "muted" | "info";
export type StatusShape = "dot" | "ring" | "half" | "full" | "slashed";

const TONE: Record<StatusTone, string> = {
  success: "text-(--db-success)",
  warning: "text-(--db-warning)",
  destructive: "text-(--db-danger)",
  muted: "text-muted-foreground",
  info: "text-(--db-info)",
};

const FILL: Record<StatusShape, number> = { dot: 1, ring: 0, half: 0.5, full: 1, slashed: 0 };

const gentle: Transition = { type: "spring", stiffness: 240, damping: 30 };
const instant: Transition = { duration: 0 };

// roll from sunui-motion: the old text leaves in the direction of change, the new text enters from the other side
const roll: Variants = {
  enter: (d: number) => ({ y: d >= 0 ? "60%" : "-60%", opacity: 0 }),
  center: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 520, damping: 34 } },
  exit: (d: number) => ({ y: d >= 0 ? "-60%" : "60%", opacity: 0, transition: { duration: 0.12 } }),
};

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface StatusDotProps {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
  /** Shape, default dot (the same 6px solid dot as the old version) */
  shape?: StatusShape;
  /** Progress from 0 to 1, drawn as a sector; takes priority over the fill amount of shape (slashed keeps its slash) */
  progress?: number;
  /** In progress: a quiet expanding ring around the dot. Only for states that are still running (processing, building) */
  live?: boolean;
  /** When the status happened, shown as "· 2 hours ago" */
  since?: Date | number | string;
  /** Language of the relative time: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else uses English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

function relative(ms: number, locale: SunLocale) {
  const fmt = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  const sec = Math.round((ms - Date.now()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(sec) >= size) return fmt.format(Math.round(sec / size), unit);
  }
  return fmt.format(0, "second");
}

/** Redraw the relative time every 30 seconds; with no since, no timer is started */
function useNow(active: boolean) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, [active]);
}

function Glyph({ shape, fill, live, reduce }: { shape: StatusShape; fill: number; live: boolean; reduce: boolean }) {
  const t = reduce ? instant : gentle;
  const isDot = shape === "dot";
  return (
    <span aria-hidden className={cn("relative inline-grid shrink-0 place-items-center", isDot ? "size-1.5" : "size-2")}>
      {live && !reduce && (
        <motion.span
          className="absolute inset-0 rounded-full border border-current"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 1.6, ease: [0.23, 1, 0.32, 1], repeat: Infinity, repeatDelay: 0.6 }}
        />
      )}
      <svg viewBox="0 0 10 10" className="size-full overflow-visible">
        {!isDot && <circle cx={5} cy={5} r={4.25} fill="none" stroke="currentColor" strokeWidth={1.5} />}
        {/* Sector: a circle with r=2.5 and stroke width 5, so pathLength is the fill amount; clockwise from 12 o'clock */}
        <motion.circle
          cx={5}
          cy={5}
          r={2.5}
          fill="none"
          stroke="currentColor"
          strokeWidth={5}
          transform="rotate(-90 5 5)"
          initial={false}
          animate={{ pathLength: fill, opacity: fill > 0 ? 1 : 0 }}
          transition={t}
        />
        <motion.line
          x1={2}
          y1={8}
          x2={8}
          y2={2}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: shape === "slashed" ? 1 : 0, opacity: shape === "slashed" ? 1 : 0 }}
          transition={t}
        />
      </svg>
    </span>
  );
}

/**
 * Site-wide status indicator: a small dot plus text.
 * Color is only on the dot and the text keeps the normal text color, so a whole row of statuses does not turn into a rainbow.
 */
export function StatusDot({ tone, children, className, shape, progress, live = false, since, locale = "en" }: StatusDotProps) {
  const reduce = !!useReducedMotion();
  const s: StatusShape = shape ?? (progress != null ? "half" : "dot");
  const fill = s === "dot" ? 1 : Math.min(Math.max(progress ?? FILL[s], 0), 1);
  const key =
    typeof children === "string" || typeof children === "number" ? `l:${children}` : `s:${tone}:${s}:${fill}`;

  // Roll direction follows progress: forward goes up, backward goes down
  const [track, setTrack] = useState({ key, fill, dir: 1 });
  const dir = track.key === key ? track.dir : fill >= track.fill ? 1 : -1;
  if (track.key !== key) setTrack({ key, fill, dir });

  // Width: measure an invisible copy, and the frame follows with a gentle spring
  const measure = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number | "auto">("auto");
  useIsoLayoutEffect(() => {
    const el = measure.current;
    if (!el) return;
    const read = () => setWidth(el.offsetWidth);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [key]);

  const at = since == null ? null : new Date(since);
  const valid = at != null && !Number.isNaN(at.getTime());
  useNow(valid);
  const loc = resolveLocale(locale);

  return (
    <span className={cn(STATUS_TOKENS, "inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <span className={cn("inline-grid", TONE[tone])}>
        <Glyph shape={s} fill={fill} live={live} reduce={reduce} />
      </span>
      <motion.span
        className="relative inline-flex overflow-hidden"
        initial={false}
        animate={{ width }}
        transition={reduce ? instant : gentle}
      >
        <span ref={measure} aria-hidden className="invisible absolute top-0 left-0 whitespace-nowrap">
          {children}
        </span>
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.span
            key={key}
            custom={dir}
            variants={reduce ? undefined : roll}
            initial={reduce ? false : "enter"}
            animate="center"
            exit={reduce ? undefined : "exit"}
            className="inline-block whitespace-nowrap"
          >
            {children}
          </motion.span>
        </AnimatePresence>
      </motion.span>
      {at && valid && (
        <time dateTime={at.toISOString()} suppressHydrationWarning className="text-muted-foreground tabular-nums">
          <span aria-hidden>· </span>
          {relative(at.getTime(), loc)}
        </time>
      )}
    </span>
  );
}
