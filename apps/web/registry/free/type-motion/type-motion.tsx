"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** All typographic motion ids; the demo and the docs both read from here */
/** Schedules per-frame callbacks only while running; when stopped it uses no frame loop at all */
function useRunningFrame(running: boolean, cb: (deltaMs: number) => void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      cbRef.current(now - last);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}

export const typeMotions = ["text-on-path", "variable-font", "text-mask"] as const;

export type TypeMotionName = (typeof typeMotions)[number];
export type TypeMotionTrigger = "mount" | "inView" | "hover" | "click" | "loop";

/* ---------- Shared helpers ---------- */

function subscribeVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}

/** Whether the tab is in the foreground; loops pause when you switch to another tab */
function usePageVisible() {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== "hidden",
    () => true,
  );
}

/** From trigger, works out whether it has started (play), whether it should move (running), and the hover / click state (active) */
function useTrigger<T extends HTMLElement>(trigger: TypeMotionTrigger) {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<T>(null);
  const seen = useInView(ref, { once: true, amount: 0.3 });
  const visible = useInView(ref, { amount: 0 });
  const pageVisible = usePageVisible();
  const [hovered, setHovered] = useState(false);
  const [toggled, setToggled] = useState(false);

  const active = trigger === "hover" ? hovered : trigger === "click" ? toggled : true;
  const play = trigger === "inView" ? seen : true;
  const running = !reduce && visible && pageVisible && play && active;

  const handlers: HTMLAttributes<HTMLElement> = {};
  if (trigger === "hover") {
    handlers.onMouseEnter = () => setHovered(true);
    handlers.onMouseLeave = () => setHovered(false);
  }
  if (trigger === "click") {
    handlers.onClick = () => setToggled((v) => !v);
    handlers.onKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setToggled((v) => !v);
      }
    };
    handlers.role = "button";
    handlers.tabIndex = 0;
    handlers["aria-pressed"] = toggled;
  }
  return { ref, reduce, play, running, active, handlers };
}

function cleanId(id: string) {
  return id.replace(/[^a-zA-Z0-9-]/g, "");
}

/* ---------- 131 Text on path ---------- */

export type TextPathPreset = "wave" | "circle" | "arc";

const pathPresets: Record<TextPathPreset, { d: string; viewBox: string; closed: boolean; fontSize: number }> = {
  wave: {
    d: "M-10 60 Q 40 10 90 60 T 190 60 T 290 60 T 390 60 T 490 60",
    viewBox: "0 0 400 120",
    closed: false,
    fontSize: 24,
  },
  circle: {
    d: "M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0",
    viewBox: "0 0 200 200",
    closed: true,
    fontSize: 17,
  },
  arc: {
    d: "M24 150 A 140 140 0 0 1 296 150",
    viewBox: "0 0 320 170",
    closed: false,
    fontSize: 24,
  },
};

export interface TextOnPathProps {
  text: string;
  /** Built-in path; when d is passed the custom path is used instead */
  preset?: TextPathPreset;
  /** Custom SVG path d, used together with viewBox */
  d?: string;
  viewBox?: string;
  /** Whether the custom path is a closed shape (when closed, the text joins end to end around the loop) */
  closed?: boolean;
  /** Font size in viewBox units */
  fontSize?: number;
  /** Seconds for the text to travel once around */
  duration?: number;
  /** Flow in the opposite direction */
  reverse?: boolean;
  /** Show the path itself (a faint line) */
  showPath?: boolean;
  trigger?: TypeMotionTrigger;
  className?: string;
}

/** Text flows along any SVG path, each glyph rotating to follow the path (driven by startOffset). */
export function TextOnPath({
  text,
  preset = "wave",
  d,
  viewBox,
  closed,
  fontSize,
  duration = 10,
  reverse = false,
  showPath = false,
  trigger = "loop",
  className,
}: TextOnPathProps) {
  const p = pathPresets[preset];
  const pathD = d ?? p.d;
  const box = viewBox ?? (d ? "0 0 400 200" : p.viewBox);
  const isClosed = closed ?? (d ? false : p.closed);
  const size = fontSize ?? p.fontSize;
  const id = `top-${cleanId(useId())}`;

  const t = useTrigger<HTMLSpanElement>(trigger);
  const pathRef = useRef<SVGPathElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const aRef = useRef<SVGTextPathElement>(null);
  const bRef = useRef<SVGTextPathElement>(null);
  const len = useRef({ path: 0, text: 0 });
  const pos = useRef<number | null>(null);

  // Compute startOffset from position: on an open path text enters from the end and leaves at the start; on a closed path two copies join end to end
  const apply = (value: number) => {
    const L = len.current.path;
    if (!L) return;
    if (isClosed) {
      const o = -(((value % L) + L) % L);
      aRef.current?.setAttribute("startOffset", String(o));
      bRef.current?.setAttribute("startOffset", String(o + L));
    } else {
      aRef.current?.setAttribute("startOffset", String(L - value));
    }
  };

  // Measure the path and text lengths; measure again after the font loads
  useEffect(() => {
    let alive = true;
    const measure = () => {
      if (!alive || !pathRef.current || !textRef.current) return;
      len.current = { path: pathRef.current.getTotalLength(), text: textRef.current.getComputedTextLength() };
      const { path: L, text: T } = len.current;
      // Start position: on an open path the text is centered, on a closed path it starts at 0
      if (pos.current === null) pos.current = isClosed ? 0 : (L + T) / 2;
      apply(pos.current);
    };
    measure();
    document.fonts?.ready.then(measure);
    return () => {
      alive = false;
    };
    // apply only reads refs, so it does not need to be listed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, pathD, size, isClosed]);

  useRunningFrame(t.running, (delta) => {
    if (pos.current === null) return;
    const { path: L, text: T } = len.current;
    const period = isClosed ? L : L + T;
    if (!period) return;
    const step = (Math.min(delta, 64) / 1000 / duration) * period * (reverse ? -1 : 1);
    pos.current = (((pos.current + step) % period) + period) % period;
    apply(pos.current);
  });

  const textProps = { fontSize: size, fill: "currentColor", "aria-hidden": true as const };

  return (
    <span ref={t.ref} className={cn("relative inline-block", className)} {...t.handlers}>
      <span className="sr-only">{text}</span>
      <svg viewBox={box} aria-hidden="true" className="block h-auto w-full overflow-visible">
        <path
          id={id}
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke={showPath ? "currentColor" : "none"}
          strokeOpacity={0.2}
          strokeDasharray="3 5"
        />
        <text ref={textRef} {...textProps}>
          <textPath ref={aRef} href={`#${id}`} startOffset="0">
            {text}
          </textPath>
        </text>
        {isClosed && (
          <text {...textProps}>
            <textPath ref={bRef} href={`#${id}`} startOffset="0">
              {text}
            </textPath>
          </text>
        )}
      </svg>
    </span>
  );
}

/* ---------- 132 Variable font weight ---------- */

export interface VariableWeightProps {
  text: string;
  /** Starting weight (wght), 100 to 900 */
  from?: number;
  /** Target weight */
  to?: number;
  /** Start and end of the width axis (wdth, percent); only works if the font supports it */
  width?: [number, number];
  /** Other variable axes, for example { slnt: [0, -10] } */
  axes?: Record<string, [number, number]>;
  /** word: the whole word changes together; wave: staggered per letter into a wave */
  mode?: "word" | "wave";
  /** Seconds for one round trip (loop) or one change */
  duration?: number;
  /** Seconds between letters in wave mode */
  stagger?: number;
  /** loop: keeps going back and forth; mount / inView: changes once and stays at to; hover: gets bolder on hover; click: toggles */
  trigger?: TypeMotionTrigger;
  className?: string;
}

/**
 * Smoothly changes the weight between from and to (and the width or any variable axis).
 * With an ordinary static font the browser snaps to the nearest weight instead of breaking.
 */
export function VariableWeight({
  text,
  from = 200,
  to = 900,
  width,
  axes,
  mode = "wave",
  duration = 2.4,
  stagger = 0.08,
  trigger = "loop",
  className,
}: VariableWeightProps) {
  const t = useTrigger<HTMLSpanElement>(trigger);
  const parts = mode === "word" ? [text] : Array.from(text);
  const config: AxisConfig = { from, to, width, axes };

  return (
    <span ref={t.ref} className={cn("relative inline-block whitespace-pre", className)} {...t.handlers}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {parts.map((ch, i) =>
          ch === " " ? (
            " "
          ) : (
            <WeightPart
              key={i}
              ch={ch}
              delay={i * stagger}
              config={config}
              trigger={trigger}
              duration={duration}
              running={t.running}
              play={t.play}
              active={t.active}
              reduce={t.reduce}
            />
          ),
        )}
      </span>
    </span>
  );
}

interface AxisConfig {
  from: number;
  to: number;
  width?: [number, number];
  axes?: Record<string, [number, number]>;
}

function lerp(a: number, b: number, v: number) {
  return a + (b - a) * v;
}

function WeightPart({
  ch,
  delay,
  config,
  trigger,
  duration,
  running,
  play,
  active,
  reduce,
}: {
  ch: string;
  delay: number;
  config: AxisConfig;
  trigger: TypeMotionTrigger;
  duration: number;
  running: boolean;
  play: boolean;
  active: boolean;
  reduce: boolean;
}) {
  const interactive = trigger === "hover" || trigger === "click";
  const p = useMotionValue(reduce && !interactive ? 1 : 0);

  useEffect(() => {
    if (interactive) {
      const c = animate(p, active ? 1 : 0, reduce ? { duration: 0 } : { duration: duration / 3, delay: delay * 0.5, ease: "easeInOut" });
      return () => c.stop();
    }
    if (reduce) {
      p.set(1);
      return;
    }
    if (trigger === "loop") {
      if (!running) return;
      const c = animate(p, [0, 1], {
        duration: duration / 2,
        delay,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      });
      return () => c.stop();
    }
    if (!play) return;
    const c = animate(p, 1, { duration: duration / 2, delay, ease: "easeInOut" });
    return () => c.stop();
  }, [p, interactive, active, reduce, trigger, running, play, duration, delay]);

  return <WeightSpan p={p} config={config} ch={ch} />;
}

function WeightSpan({ p, config, ch }: { p: MotionValue<number>; config: AxisConfig; ch: string }) {
  const { from, to, width, axes } = config;
  const fontWeight = useTransform(p, (v) => Math.round(lerp(from, to, v)));
  const fontStretch = useTransform(p, (v) => (width ? `${lerp(width[0], width[1], v)}%` : "normal"));
  const fontVariationSettings = useTransform(p, (v) =>
    axes
      ? Object.entries(axes)
          .map(([k, [a, b]]) => `"${k}" ${lerp(a, b, v).toFixed(2)}`)
          .join(", ")
      : "normal",
  );
  return (
    <motion.span className="inline-block" style={{ fontWeight, fontStretch, fontVariationSettings }}>
      {ch}
    </motion.span>
  );
}

/* ---------- 133 Text mask ---------- */

export interface TextMaskProps {
  text: string;
  /** Image URL to show through */
  src?: string;
  /** Video URL to show through (muted, looping) */
  video?: string;
  /** When there is no image or video, this set of colors draws a flowing gradient; omit it to follow the theme tokens */
  colors?: string[];
  /** Font weight; the bolder, the more shows through */
  weight?: number;
  /** Seconds for the background to drift once; with reveal it is also the length of one cycle */
  duration?: number;
  /** At the end the whole picture appears: once per cycle when looping, for other triggers it plays once and stays on the full image */
  reveal?: boolean;
  trigger?: TypeMotionTrigger;
  className?: string;
}

const defaultMaskColors = [
  "var(--chart-1, var(--primary))",
  "var(--chart-2, var(--ring))",
  "var(--chart-3, var(--muted-foreground))",
  "var(--chart-4, var(--primary))",
];

/** Bold text is cut out so only the glyphs show an image, video or flowing gradient, with the background drifting slowly. The text stretches to fill the container width. */
export function TextMask({
  text,
  src,
  video,
  colors = defaultMaskColors,
  weight = 900,
  duration = 8,
  reveal = false,
  trigger = "loop",
  className,
}: TextMaskProps) {
  const uid = cleanId(useId());
  const t = useTrigger<HTMLSpanElement>(trigger);
  const measureRef = useRef<SVGTextElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState({ x: 0, y: -74, w: Math.max(1, Array.from(text).length) * 62, h: 92 });

  // Measure the actual text box to use as the viewBox; measure again after the font loads
  useEffect(() => {
    let alive = true;
    const measure = () => {
      const el = measureRef.current;
      if (!alive || !el) return;
      const b = el.getBBox();
      if (b.width > 0) setBox({ x: b.x, y: b.y, w: b.width, h: b.height });
    };
    const raf = requestAnimationFrame(measure);
    document.fonts?.ready.then(measure);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [text, weight]);

  // The video pauses along with the loop
  useEffect(() => {
    svgRef.current?.querySelectorAll("video").forEach((v) => {
      if (t.running) v.play().catch(() => {});
      else v.pause();
    });
  }, [t.running, video]);

  const pad = box.h * 0.04;
  const vb = { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 };
  // The background is slightly larger than the text so its edges never show while drifting
  const bg = { x: vb.x - vb.w * 0.15, y: vb.y - vb.h * 0.3, w: vb.w * 1.3, h: vb.h * 1.6 };
  const dx = vb.w * 0.12;
  const drift = t.running ? { x: [-dx, dx], y: [vb.h * 0.08, -vb.h * 0.08] } : undefined;
  const driftT = { duration, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const };

  const fill = (
    <motion.g animate={drift} transition={driftT}>
      {video ? (
        <foreignObject x={bg.x} y={bg.y} width={bg.w} height={bg.h}>
          <video src={video} muted loop playsInline autoPlay className="h-full w-full object-cover" />
        </foreignObject>
      ) : src ? (
        <image href={src} x={bg.x} y={bg.y} width={bg.w} height={bg.h} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <rect x={bg.x} y={bg.y} width={bg.w} height={bg.h} fill={`url(#${uid}-g)`} />
      )}
    </motion.g>
  );

  const loopReveal = trigger === "loop";
  const outside = 0.12;
  const revealAnim = t.reduce
    ? { opacity: outside }
    : loopReveal
      ? t.running
        ? { opacity: [outside, outside, 1, 1, outside, outside] }
        : { opacity: outside }
      : t.play && t.active
        ? { opacity: 1 }
        : { opacity: outside };
  const revealT = loopReveal
    ? { duration, repeat: Infinity, times: [0, 0.73, 0.82, 0.9, 0.99, 1], ease: "easeInOut" as const }
    : { duration: 0.8, delay: duration * 0.6, ease: "easeInOut" as const };

  return (
    <span ref={t.ref} className={cn("relative block", className)} {...t.handlers}>
      <span className="sr-only">{text}</span>
      <svg
        ref={svgRef}
        aria-hidden="true"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className="block h-auto w-full"
        style={{ fontWeight: weight }}
      >
        <defs>
          <clipPath id={`${uid}-c`}>
            <text x={0} y={0} fontSize={100} style={{ letterSpacing: "-0.02em" }}>
              {text}
            </text>
          </clipPath>
          <linearGradient
            id={`${uid}-g`}
            gradientUnits="userSpaceOnUse"
            x1={bg.x}
            y1={bg.y}
            x2={bg.x + bg.w / 2}
            y2={bg.y + bg.h}
            spreadMethod="reflect"
          >
            {colors.map((c, i) => (
              <stop key={i} offset={colors.length > 1 ? i / (colors.length - 1) : 0} style={{ stopColor: c }} />
            ))}
          </linearGradient>
        </defs>
        {/* Only used to measure size, not displayed */}
        <text ref={measureRef} x={0} y={0} fontSize={100} visibility="hidden" style={{ letterSpacing: "-0.02em" }}>
          {text}
        </text>
        {reveal && (
          <motion.g initial={{ opacity: outside }} animate={revealAnim} transition={revealT}>
            {fill}
          </motion.g>
        )}
        <g clipPath={`url(#${uid}-c)`}>{fill}</g>
      </svg>
    </span>
  );
}

/* ---------- Main component ---------- */

export type TypeMotionProps =
  | ({ effect: "text-on-path" } & TextOnPathProps)
  | ({ effect: "variable-font" } & VariableWeightProps)
  | ({ effect: "text-mask" } & TextMaskProps);

/** Switches between three typographic motions with effect: text-on-path, variable-font, text-mask. */
export function TypeMotion(props: TypeMotionProps): ReactNode {
  switch (props.effect) {
    case "text-on-path": {
      const { effect: _e, ...rest } = props;
      void _e;
      return <TextOnPath {...rest} />;
    }
    case "variable-font": {
      const { effect: _e, ...rest } = props;
      void _e;
      return <VariableWeight {...rest} />;
    }
    case "text-mask": {
      const { effect: _e, ...rest } = props;
      void _e;
      return <TextMask {...rest} />;
    }
  }
}
