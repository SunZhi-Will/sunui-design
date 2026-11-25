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
  "eight-dot-orbit",
  "center-dots",
  "six-dot-scale",
  "half-ring",
  "twin-pulse",
  "wave-scanner",
  "split-diamond",
  "type-sweep",
  "step-relay",
  "scale-fade",
  "signal-trace",
  "loop-track",
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
  "eight-dot-orbit",
  "center-dots",
  "six-dot-scale",
  "half-ring",
  "twin-pulse",
  "wave-scanner",
  "split-diamond",
  "type-sweep",
  "step-relay",
  "scale-fade",
  "signal-trace",
  "loop-track",
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

/**
 * Colour for one loader, resolved from its palette.
 * solid: one colour for single-colour parts. at(t): a colour along the gradient, 0..1, for loaders made of
 * several pieces (dots, bars). css(angle): a CSS background for single shapes. gradient: set when the palette
 * is a gradient, so SVG strokes can use <InkGradient>.
 */
type Ink = {
  solid: string;
  at: (t: number) => string;
  css: (angle?: number) => string;
  gradient: boolean;
  /** Text and strokes drawn on top of a filled shape */
  on: string;
};

const SPOT = "var(--sunui-spot, var(--primary))";
const SPOT_ON = "var(--sunui-spot-foreground, var(--primary-foreground))";

/** `success` turns the status palette green; loaders other than the dot matrix have no error state */
function makeInk(palette: LoaderPalette, color: string | undefined, success = false): Ink {
  const g = GRADIENTS[palette];
  if (g) {
    const at = (t: number) => `oklch(${g.l} ${g.c} ${g.from + (g.to - g.from) * Math.min(1, Math.max(0, t))})`;
    return {
      solid: at(0.5),
      at,
      css: (angle = 90) => `linear-gradient(${angle}deg, ${at(0)}, ${at(0.5)}, ${at(1)})`,
      gradient: true,
      on: "#ffffff",
    };
  }
  const solid = palette === "status" && success ? SUCCESS : (color ?? SPOT);
  const on = palette === "status" && success ? "#ffffff" : color ? "#ffffff" : SPOT_ON;
  return { solid, at: () => solid, css: () => solid, gradient: false, on };
}

/** SVG linear gradient for strokes and fills; render inside the <svg> and use stroke={`url(#${id})`} */
function InkGradient({ id, ink, vertical = false }: { id: string; ink: Ink; vertical?: boolean }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2={vertical ? "0" : "1"} y2="1">
        <stop offset="0%" stopColor={ink.at(0)} />
        <stop offset="50%" stopColor={ink.at(0.5)} />
        <stop offset="100%" stopColor={ink.at(1)} />
      </linearGradient>
    </defs>
  );
}

/** Stroke or fill for an SVG part: a gradient reference, or the solid colour */
function useStroke(ink: Ink, vertical = false) {
  const id = useId().replace(/:/g, "");
  return { id, paint: ink.gradient ? `url(#${id})` : ink.solid, defs: ink.gradient ? <InkGradient id={id} ink={ink} vertical={vertical} /> : null };
}

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
  /** Colour scheme shared with DotMatrixLoader: spot (default), status, aurora, sunset, lagoon, prism */
  palette?: LoaderPalette;
  /** Main colour for the spot palette, default the brand spot colour (falls back to --primary) */
  color?: string;
  /** spinner-check: when true the arc completes, the disc settles and the check draws */
  done?: boolean;
  /** Text read by screen readers when spinner-check completes */
  doneLabel?: string;
  className?: string;
}

export function Loader({
  variant = "ring-spinner",
  size = "md",
  label = "Loading",
  value = 0,
  palette = "spot",
  color,
  done = false,
  doneLabel = "Done",
  className,
}: LoaderProps) {
  const { ref, active, reduce } = useActive<HTMLSpanElement>();
  const s = SIZES[size];
  const determinate = variant === "progress-ring" || variant === "bar" || variant === "liquid";
  const pct = clampPct(value);
  // Status palette turns green when the work is finished: spinner-check is done, or a determinate loader reached 100
  const ink = makeInk(palette, color, (variant === "spinner-check" && done) || (determinate && pct >= 100));
  const style: CSSProperties = { color: ink.solid };
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
        {variant === "bouncing-dots" && <BouncingDots s={s} active={active} ink={ink} />}
        {variant === "equalizer" && <Equalizer s={s} active={active} ink={ink} />}
        {variant === "ring-spinner" && <RingSpinner s={s} active={active} ink={ink} />}
        {variant === "spinner-check" && <SpinnerCheck s={s} active={active} done={done} reduce={reduce} ink={ink} />}
        {variant === "orbit" && <Orbit s={s} active={active} ink={ink} />}
        {variant === "pulse-dot" && <PulseDot s={s} active={active} ink={ink} />}
        {variant === "progress-ring" && <ProgressRing s={s} pct={pct} reduce={reduce} ink={ink} />}
        {variant === "bar" && <ProgressBar s={s} pct={pct} reduce={reduce} ink={ink} />}
        {variant === "indeterminate-bar" && <IndeterminateBar s={s} active={active} ink={ink} />}
        {variant === "typing-indicator" && <TypingIndicator s={s} active={active} ink={palette === "spot" && !color ? null : ink} />}
        {variant === "liquid" && <Liquid s={s} pct={pct} active={active} reduce={reduce} ink={ink} />}
        {variant === "eight-dot-orbit" && <EightDotOrbit s={s} active={active} ink={ink} />}
        {variant === "center-dots" && <CenterDots s={s} active={active} ink={ink} />}
        {variant === "six-dot-scale" && <SixDotScale s={s} active={active} ink={ink} />}
        {variant === "half-ring" && <HalfRing s={s} active={active} ink={ink} />}
        {variant === "twin-pulse" && <TwinPulse s={s} active={active} ink={ink} />}
        {variant === "wave-scanner" && <WaveScanner s={s} active={active} ink={ink} />}
        {variant === "split-diamond" && <SplitDiamond s={s} active={active} ink={ink} />}
        {variant === "type-sweep" && <TypeSweep s={s} active={active} ink={ink} text={label} />}
        {variant === "step-relay" && <StepRelay s={s} active={active} ink={ink} />}
        {variant === "scale-fade" && <ScaleFade s={s} active={active} ink={ink} />}
        {variant === "signal-trace" && <SignalTrace s={s} active={active} ink={ink} />}
        {variant === "loop-track" && <LoopTrack s={s} active={active} ink={ink} />}
      </span>
    </span>
  );
}

/* ---- Indeterminate ---- */

function BouncingDots({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const d = Math.max(4, s * 0.22);
  return (
    <span className="inline-flex items-end" style={{ gap: d * 0.6, height: s, paddingBottom: s * 0.15 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="rounded-full"
          style={{ width: d, height: d, background: ink.at(i / 2) }}
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

function Equalizer({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const w = Math.max(3, s * 0.14);
  return (
    <span className="inline-flex items-end" style={{ height: s, gap: w * 0.6 }}>
      {EQ.map((frames, i) => (
        <motion.span
          key={i}
          className="h-full origin-bottom rounded-sm"
          style={{ width: w, background: ink.at(i / (EQ.length - 1)) }}
          initial={{ scaleY: frames[0] }}
          animate={{ scaleY: active ? frames : frames[0] }}
          transition={active ? loop({ duration: 1.1 + i * 0.08, ease: "easeInOut" }) : { duration: 0.2 }}
        />
      ))}
    </span>
  );
}

function RingSpinner({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const sw = Math.max(2.5, s * 0.1);
  const r = (s - sw) / 2;
  const stroke = useStroke(ink);
  return (
    <motion.svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      animate={{ rotate: active ? 360 : 0 }}
      transition={active ? { repeat: Infinity, ease: "linear", duration: 0.9 } : { duration: 0 }}
    >
      {stroke.defs}
      <circle cx={s / 2} cy={s / 2} r={r} stroke={track} strokeWidth={sw} />
      <circle cx={s / 2} cy={s / 2} r={r} stroke={stroke.paint} strokeWidth={sw} strokeLinecap="round" pathLength={100} strokeDasharray="28 72" />
    </motion.svg>
  );
}

/** The spinning arc closes into a circle on completion, then the disc settles once with pop and the check strokes in, same feel as Result */
function SpinnerCheck({ s, active, done, reduce, ink }: { s: number; active: boolean; done: boolean; reduce: boolean; ink: Ink }) {
  const sw = Math.max(2.5, s * 0.1);
  const r = (s - sw) / 2;
  const stroke = useStroke(ink);
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
        {stroke.defs}
        <circle cx={s / 2} cy={s / 2} r={r} stroke={track} strokeWidth={sw} />
        <motion.circle
          cx={s / 2}
          cy={s / 2}
          r={r}
          stroke={stroke.paint}
          strokeWidth={sw}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: done ? 1 : 0.28 }}
          transition={t({ duration: 0.22, ease: "easeOut" })}
        />
      </motion.svg>
      <motion.span
        className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]"
        style={{ background: ink.css(135) }}
        initial={false}
        animate={done ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
        transition={done ? t({ ...pop, delay: 0.18 }) : t({ duration: 0.15 })}
      />
      <svg viewBox="0 0 24 24" className="relative" style={{ width: s * 0.5, height: s * 0.5 }} fill="none" stroke={ink.on} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
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

function Orbit({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const d = Math.max(4, s * 0.18);
  return (
    <span className="relative inline-block" style={{ width: s, height: s }}>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30" style={{ width: d, height: d, background: ink.at(0.5) }} />
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0"
          initial={{ rotate: i * 120 }}
          animate={{ rotate: active ? i * 120 + 360 : i * 120 }}
          transition={active ? { repeat: Infinity, ease: "linear", duration: 1.4 + i * 0.35 } : { duration: 0 }}
        >
          <span
            className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full"
            style={{ width: d * (1 - i * 0.2), height: d * (1 - i * 0.2), opacity: 1 - i * 0.2, background: ink.at(i / 2) }}
          />
        </motion.span>
      ))}
    </span>
  );
}

function PulseDot({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const d = s * 0.36;
  return (
    <span className="relative inline-grid place-items-center" style={{ width: s, height: s }}>
      {active &&
        [0, 1].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ width: d, height: d, background: ink.at(i ? 1 : 0) }}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut", delay: i * 0.8 }}
          />
        ))}
      <span className="relative rounded-full" style={{ width: d, height: d, background: ink.css(135) }} />
    </span>
  );
}

function IndeterminateBar({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const h = Math.max(3, s * 0.12);
  return (
    <span className="relative block w-full overflow-hidden rounded-full" style={{ height: h, background: track }}>
      <motion.span
        className="absolute inset-y-0 left-0 w-2/5 rounded-full"
        style={{ background: ink.css() }}
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

/** Neutral grey by default, like a chat bubble; any palette other than plain spot colours the dots */
function TypingIndicator({ s, active, ink }: { s: number; active: boolean; ink: Ink | null }) {
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
          className={cn("rounded-full", !ink && "bg-muted-foreground")}
          style={{ width: d, height: d, background: ink?.at(i / 2) }}
        />
      ))}
    </span>
  );
}

/* ---- Moments: small monochrome-first loops, each one idea ---- */

const still = { duration: 0.2 } as const;

/** Eight dots on a ring, graded from a bright head to a faint tail; the ring turns in eight steps so the head chases round */
function EightDotOrbit({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const d = Math.max(3, s * 0.15);
  const r = s / 2 - d / 2;
  return (
    <motion.span
      className="relative inline-block"
      style={{ width: s, height: s }}
      animate={{ rotate: active ? 360 : 0 }}
      transition={active ? { repeat: Infinity, duration: 1, ease: (t: number) => Math.floor(t * 8) / 8 } : { duration: 0 }}
    >
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const k = 1 - i / 8;
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: d,
              height: d,
              left: s / 2 + Math.cos(a) * r - d / 2,
              top: s / 2 + Math.sin(a) * r - d / 2,
              background: ink.at(i / 7),
              opacity: 0.25 + k * 0.75,
              transform: `scale(${0.55 + k * 0.45})`,
            }}
          />
        );
      })}
    </motion.span>
  );
}

/** Three dots: the middle one swells while the outer two shrink, then they trade */
function CenterDots({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const d = Math.max(4, s * 0.2);
  return (
    <span className="inline-flex items-center" style={{ gap: d * 0.55, height: s }}>
      {[0, 1, 2].map((i) => {
        const mid = i === 1;
        return (
          <motion.span
            key={i}
            className="rounded-full"
            style={{ width: d, height: d, background: ink.at(i / 2) }}
            animate={active ? { scale: mid ? [1.45, 0.75, 1.45] : [0.75, 1.2, 0.75], opacity: mid ? [1, 0.55, 1] : [0.55, 1, 0.55] } : { scale: mid ? 1.35 : 0.8, opacity: mid ? 1 : 0.6 }}
            transition={active ? loop({ duration: 1.2 }) : still}
          />
        );
      })}
    </span>
  );
}

/** Six dots along an open arc grow and settle in turn, like a comet passing */
function SixDotScale({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const d = Math.max(3, s * 0.18);
  const r = s / 2 - d / 2;
  return (
    <span className="relative inline-block" style={{ width: s, height: s }}>
      {Array.from({ length: 6 }, (_, i) => {
        // 0 to 225 degrees clockwise from the top, leaving a gap at the lower left
        const a = (i / 5) * Math.PI * 1.25 - Math.PI / 2;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ width: d, height: d, left: s / 2 + Math.cos(a) * r - d / 2, top: s / 2 + Math.sin(a) * r - d / 2, background: ink.at(i / 5) }}
            animate={active ? { scale: [0.3, 1.15, 0.3], opacity: [0.35, 1, 0.35] } : { scale: 0.4 + (i / 5) * 0.7, opacity: 0.4 + (i / 5) * 0.6 }}
            transition={active ? loop({ duration: 1.1, delay: i * 0.11, repeatDelay: 0.35 }) : still}
          />
        );
      })}
    </span>
  );
}

/** A thick track with an arc that grows from half to almost full and back while it turns */
function HalfRing({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const sw = Math.max(3, s * 0.16);
  const r = (s - sw) / 2;
  const stroke = useStroke(ink);
  return (
    <motion.svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      animate={{ rotate: active ? 360 : 0 }}
      transition={active ? { repeat: Infinity, ease: "linear", duration: 1.6 } : { duration: 0 }}
    >
      {stroke.defs}
      <circle cx={s / 2} cy={s / 2} r={r} stroke={track} strokeWidth={sw} />
      <motion.circle
        cx={s / 2}
        cy={s / 2}
        r={r}
        stroke={stroke.paint}
        strokeWidth={sw}
        strokeLinecap="round"
        initial={{ pathLength: 0.5 }}
        animate={{ pathLength: active ? [0.5, 0.82, 0.5] : 0.62 }}
        transition={active ? loop({ duration: 1.6 }) : still}
      />
    </motion.svg>
  );
}

/** Two rings: the outer one breathes out and fades while the inner one draws in */
function TwinPulse({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const sw = Math.max(2, s * 0.08);
  const ring = (k: number): CSSProperties => ({ width: s * k, height: s * k, borderWidth: sw, borderStyle: "solid" });
  return (
    <span className="relative inline-grid place-items-center" style={{ width: s, height: s }}>
      <motion.span
        className="absolute rounded-full"
        style={{ ...ring(0.78), borderColor: ink.at(1) }}
        animate={active ? { scale: [1, 1.28], opacity: [0.7, 0] } : { scale: 1.12, opacity: 0.35 }}
        transition={active ? { repeat: Infinity, duration: 1.4, ease: "easeOut" } : still}
      />
      <motion.span
        className="absolute rounded-full"
        style={{ ...ring(0.52), borderColor: ink.at(0) }}
        animate={active ? { scale: [1, 0.8, 1] } : { scale: 1 }}
        transition={active ? loop({ duration: 1.4 }) : still}
      />
    </span>
  );
}

/** A row of thin bars with one bump of height sweeping across, like a scanner */
function WaveScanner({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const n = 11;
  const w = Math.max(2, s * 0.075);
  const step = 0.07;
  const period = 1.5;
  return (
    <span className="inline-flex items-center" style={{ height: s, gap: w * 0.7 }}>
      {Array.from({ length: n }, (_, i) => {
        // Still frame: a soft bell centred on the row
        const bell = 0.25 + 0.75 * Math.exp(-((i - (n - 1) / 2) ** 2) / 6);
        return (
          <motion.span
            key={i}
            className="h-full rounded-full"
            style={{ width: w, background: ink.at(i / (n - 1)) }}
            initial={{ scaleY: active ? 0.25 : bell }}
            animate={active ? { scaleY: [0.25, 1, 0.25] } : { scaleY: bell }}
            transition={active ? { repeat: Infinity, duration: 0.5, ease: "easeInOut", delay: i * step, repeatDelay: period - 0.5 } : still}
          />
        );
      })}
    </span>
  );
}

/** Four rounded squares in a diamond push outward one after another and fall back together */
function SplitDiamond({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const q = s * 0.26;
  const near = s * 0.19;
  const far = s * 0.29;
  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  return (
    <span className="relative inline-block" style={{ width: s, height: s }}>
      {dirs.map(([dx, dy], i) => (
        <motion.span
          key={i}
          className="absolute rounded-[22%]"
          style={{ width: q, height: q, left: s / 2 - q / 2, top: s / 2 - q / 2, rotate: 45, background: ink.at(i / 3) }}
          initial={{ x: dx * near, y: dy * near }}
          animate={
            active
              ? { x: [dx * near, dx * far, dx * near], y: [dy * near, dy * far, dy * near], opacity: [0.6, 1, 0.6] }
              : { x: dx * near, y: dy * near, opacity: i === 0 ? 1 : 0.7 }
          }
          transition={active ? loop({ duration: 0.9, delay: i * 0.15, repeatDelay: 0.45 }) : still}
        />
      ))}
    </span>
  );
}

/** The label's letters in spaced small caps; a highlight steps across lifting each one while a row of blocks fills beneath */
function TypeSweep({ s, active, ink, text }: { s: number; active: boolean; ink: Ink; text: string }) {
  const letters = Array.from(text.trim().toUpperCase()).slice(0, 10);
  const n = Math.max(1, letters.length);
  const fs = Math.max(9, s * 0.26);
  const step = 0.11;
  const period = n * step + 0.6;
  const blocks = 5;
  return (
    <span className="inline-flex flex-col items-center font-mono" style={{ gap: fs * 0.45 }}>
      <span className="inline-flex" style={{ fontSize: fs, letterSpacing: fs * 0.32, lineHeight: 1 }}>
        {letters.map((ch, i) => (
          <motion.span
            key={i}
            style={{ color: ink.at(i / Math.max(1, n - 1)), whiteSpace: "pre" }}
            animate={active ? { y: [0, -fs * 0.28, 0], opacity: [0.4, 1, 0.4] } : { y: 0, opacity: 0.85 }}
            transition={active ? { repeat: Infinity, duration: 0.32, ease: "easeOut", delay: i * step, repeatDelay: period - 0.32 } : still}
          >
            {ch}
          </motion.span>
        ))}
      </span>
      <span className="inline-flex" style={{ gap: fs * 0.22 }}>
        {Array.from({ length: blocks }, (_, i) => (
          <motion.span
            key={i}
            className="rounded-[2px]"
            style={{ width: fs * 0.42, height: fs * 0.42, background: ink.at(i / (blocks - 1)) }}
            animate={active ? { opacity: [0.18, 0.18, 1, 1, 0.18] } : { opacity: i < 2 ? 1 : 0.18 }}
            transition={
              active
                ? { repeat: Infinity, duration: period, ease: "linear", times: [0, (i / blocks) * 0.85, (i / blocks) * 0.85 + 0.02, 0.92, 1] }
                : still
            }
          />
        ))}
      </span>
    </span>
  );
}

/** Three nodes on a triangle; a dot runs node to node and each node pops as it arrives */
function StepRelay({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const sw = Math.max(1.5, s * 0.045);
  const rn = Math.max(2.5, s * 0.1);
  const pts = [
    [s / 2, s * 0.17],
    [s * 0.86, s * 0.8],
    [s * 0.14, s * 0.8],
  ];
  const stroke = useStroke(ink);
  const cx = [pts[0][0], pts[1][0], pts[2][0], pts[0][0]];
  const cy = [pts[0][1], pts[1][1], pts[2][1], pts[0][1]];
  const times = [0, 1 / 3, 2 / 3, 1];
  const dur = 2.4;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      {stroke.defs}
      <polygon points={pts.map((p) => p.join(",")).join(" ")} stroke={track} strokeWidth={sw} strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          stroke={stroke.paint}
          strokeWidth={sw}
          fill="var(--card, var(--background))"
          initial={{ r: rn }}
          animate={active ? { r: [0, 1, 2, 3].map((k) => (k % 3 === i ? rn * 1.35 : rn)) } : { r: rn }}
          transition={active ? { repeat: Infinity, duration: dur, times, ease: "easeOut" } : still}
        />
      ))}
      <motion.circle
        r={rn * 0.62}
        fill={stroke.paint}
        initial={{ cx: cx[0], cy: cy[0] }}
        animate={active ? { cx, cy } : { cx: cx[0], cy: cy[0] }}
        transition={active ? { repeat: Infinity, duration: dur, times, ease: "easeInOut" } : { duration: 0 }}
      />
    </svg>
  );
}

/** Three bars hand height to each other: one grows tall and bright while the other two shrink and fade */
function ScaleFade({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const w = Math.max(4, s * 0.2);
  const lo = 0.45;
  return (
    <span className="inline-flex items-center" style={{ height: s, gap: w * 0.45 }}>
      {[0, 1, 2].map((i) => {
        const frames = [0, 1, 2, 3].map((k) => (k % 3 === i ? 1 : lo));
        return (
          <motion.span
            key={i}
            className="h-full rounded-[3px]"
            style={{ width: w, background: ink.at(i / 2) }}
            initial={{ scaleY: [1, 0.7, 0.85][i] }}
            animate={active ? { scaleY: frames, opacity: frames.map((f) => (f === 1 ? 1 : 0.45)) } : { scaleY: [0.7, 1, 0.85][i], opacity: 1 }}
            transition={active ? { repeat: Infinity, duration: 1.8, times: [0, 1 / 3, 2 / 3, 1], ease: "easeInOut" } : still}
          />
        );
      })}
    </span>
  );
}

/** A wave line draws in with a dot riding its tip, then the tail follows it out */
function SignalTrace({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const w = s * 1.7;
  const h = s;
  const pad = s * 0.1;
  const sw = Math.max(1.5, s * 0.06);
  const stroke = useStroke(ink);
  // Sample a sine that rises in amplitude, then flattens into a short tail
  const N = 28;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N;
    const amp = (h / 2 - pad) * Math.sin(Math.PI * Math.min(1, t * 1.15));
    return [pad + t * (w - pad * 2), h / 2 - Math.sin(t * Math.PI * 3) * amp] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  // Times for the dot follow arc length, so it stays on the tip of the drawn line
  const seg = pts.slice(1).map(([x, y], i) => Math.hypot(x - pts[i][0], y - pts[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let acc = 0;
  const half = [0, ...seg.map((l) => (acc += l) / total / 2)];
  const times = [...half, 1];
  const cx = [...pts.map((p) => p[0]), pts[N][0]];
  const cy = [...pts.map((p) => p[1]), pts[N][1]];
  const dur = 2.4;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      {stroke.defs}
      <path d={d} stroke={track} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path
        d={d}
        stroke={stroke.paint}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: active ? 0 : 0.6, pathOffset: 0 }}
        animate={active ? { pathLength: [0, 1, 0], pathOffset: [0, 0, 1] } : { pathLength: 0.6, pathOffset: 0 }}
        transition={active ? { repeat: Infinity, duration: dur, ease: "linear", times: [0, 0.5, 1] } : { duration: 0 }}
      />
      <motion.circle
        r={sw * 1.4}
        fill={stroke.paint}
        initial={{ cx: active ? cx[0] : pts[Math.round(N * 0.6)][0], cy: active ? cy[0] : pts[Math.round(N * 0.6)][1] }}
        animate={active ? { cx, cy } : { cx: pts[Math.round(N * 0.6)][0], cy: pts[Math.round(N * 0.6)][1] }}
        transition={active ? { repeat: Infinity, duration: dur, ease: "linear", times } : { duration: 0 }}
      />
    </svg>
  );
}

/** A pill outline with a short bright segment running round its edge */
function LoopTrack({ s, active, ink }: { s: number; active: boolean; ink: Ink }) {
  const sw = Math.max(2, s * 0.08);
  const w = s * 1.6;
  const h = s * 0.62;
  const stroke = useStroke(ink);
  const rect = { x: sw / 2, y: sw / 2, width: w - sw, height: h - sw, rx: (h - sw) / 2 };
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      {stroke.defs}
      <rect {...rect} stroke={track} strokeWidth={sw} />
      <motion.rect
        {...rect}
        stroke={stroke.paint}
        strokeWidth={sw}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="20 80"
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: active ? -100 : 0 }}
        transition={active ? { repeat: Infinity, duration: 1.8, ease: "linear" } : { duration: 0 }}
      />
    </svg>
  );
}

/* ---- Determinate ---- */

function ProgressRing({ s, pct, reduce, ink }: { s: number; pct: number; reduce: boolean; ink: Ink }) {
  const size = Math.max(s, 28);
  const stroke = useStroke(ink);
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
        {stroke.defs}
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={sw} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={stroke.paint} strokeWidth={sw} strokeLinecap="round" style={{ pathLength: v }} />
      </svg>
      {size >= 36 && (
        <motion.span className="absolute font-medium tabular-nums text-foreground" style={{ fontSize: size * 0.26 }}>
          {text}
        </motion.span>
      )}
    </span>
  );
}

function ProgressBar({ s, pct, reduce, ink }: { s: number; pct: number; reduce: boolean; ink: Ink }) {
  const h = Math.max(4, s * 0.16);
  const v = useSpring(pct / 100, spring);
  useEffect(() => {
    if (reduce) v.jump(pct / 100);
    else v.set(pct / 100);
  }, [pct, reduce, v]);
  return (
    <span className="relative block w-full overflow-hidden rounded-full" style={{ height: h, background: track }}>
      <motion.span className="absolute inset-0 origin-left rounded-full" style={{ scaleX: v, background: ink.css() }} />
    </span>
  );
}

function Liquid({ s, pct, active, reduce, ink }: { s: number; pct: number; active: boolean; reduce: boolean; ink: Ink }) {
  const size = Math.max(s, 32);
  const fill = useStroke(ink, true);
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
          {fill.defs}
          <motion.path
            d={wave}
            fill={fill.paint}
            opacity={0.35}
            animate={{ x: active ? [-100, 0] : -50 }}
            transition={active ? { repeat: Infinity, ease: "linear", duration: 2.6 } : { duration: 0 }}
          />
          <motion.path
            d={wave}
            fill={fill.paint}
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
  /** Colour scheme, same as Loader */
  palette?: LoaderPalette;
  color?: string;
  className?: string;
}

export function TopLoadingBar({ loading, label = "Loading", position = "fixed", height = 3, palette = "spot", color, className }: TopLoadingBarProps) {
  const ink = makeInk(palette, color);
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
      style={{ height, color: ink.solid }}
      role="status"
    >
      {loading && <SrOnly>{label}</SrOnly>}
      <motion.div
        aria-hidden
        className="h-full origin-left shadow-[0_0_8px_currentColor]"
        style={{ scaleX: scale, opacity, background: ink.css() }}
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
  /** Colour scheme, same as Loader. Gradients give each step its own hue; status turns finished steps green */
  palette?: LoaderPalette;
  color?: string;
  className?: string;
}

export function MultiStepLoader({ steps, current, interval = 1400, loop = false, label = "Loading", palette = "spot", color, className }: MultiStepLoaderProps) {
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
          const stepInk = makeInk(palette, color, state === "done");
          const hue = stepInk.at(steps.length > 1 ? i / (steps.length - 1) : 0.5);
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
                  // Colour lives on a plain wrapper: motion.svg keeps its first style value after mount
                  <span className="contents" style={{ color: hue }}>
                  <motion.svg
                    viewBox="0 0 20 20"
                    className="size-5"
                    initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <circle cx="10" cy="10" r="9" fill="currentColor" />
                    <motion.path
                      d="M6 10.5l2.6 2.5L14 7.5"
                      fill="none"
                      stroke={stepInk.on}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={reduce ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    />
                  </motion.svg>
                  </span>
                )}
                {state === "current" && (
                  <span>
                    <RingSpinner s={18} active={active} ink={{ ...stepInk, solid: hue, at: () => hue, gradient: false }} />
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
/** Every loader in this file takes the same palettes */
export const loaderPalettes = dotMatrixPalettes;
export type LoaderPalette = DotMatrixPalette;

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
