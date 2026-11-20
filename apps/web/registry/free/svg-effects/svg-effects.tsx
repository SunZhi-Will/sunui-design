"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type RefObject,
  type SVGProps,
} from "react";

import { cn } from "@/lib/utils";

export const svgEffects = [
  "line-draw",
  "blob-morph",
  "gooey",
  "orbiting-circles",
  "motion-path",
  "icon-morph",
  "animated-beam",
  "flowing-connectors",
  "radar-sweep",
  "liquid-fill",
] as const;

export type SvgEffectName = (typeof svgEffects)[number];

export const iconMorphs = ["menu-close", "play-pause", "plus-minus"] as const;
export type IconMorphName = (typeof iconMorphs)[number];

export const liquidShapes = ["circle", "drop", "heart"] as const;
export type LiquidShape = (typeof liquidShapes)[number];

export type LineDrawTrigger = "mount" | "inView" | "hover" | "loop";

/** Default colors: the theme's primary and its mixes with foreground */
export const defaultSvgColors = ["var(--primary)", "color-mix(in oklch, var(--primary) 50%, var(--foreground))"];

interface BaseProps {
  className?: string;
  /** Effect color, accepts any CSS color */
  colors?: string[];
  /** Loop speed multiplier, 1 is the default */
  speed?: number;
}

/* ---------- Shared utilities ---------- */

const pick = (colors: string[] | undefined, i: number) => {
  const list = colors && colors.length > 0 ? colors : defaultSvgColors;
  return list[i % list.length] ?? "currentColor";
};

/** The string from useId contains colons; strip them before putting it into url(#...) */
function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

/** True only when visible, the tab is in the foreground, and reduced motion is off */
function useLoopActive(ref: RefObject<Element | null>) {
  const reduce = useReducedMotion() ?? false;
  const inView = useInView(ref);
  const visible = usePageVisible();
  return { active: inView && visible && !reduce, reduce };
}

/** A clock in seconds that advances only while active; it stays put while paused */
function useClock(active: boolean, speed = 1, start = 0) {
  const t = useMotionValue(start);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      t.set(t.get() + (Math.min(0.05, (now - last) / 1000) * speed));
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, speed, t]);
  return t;
}

/** Periodic sine wave path (Q followed by T alternates up and down automatically), closed at the bottom into a fillable shape */
function wavePath(period: number, amp: number, width: number, bottom: number) {
  let d = `M0 0 Q${period / 4} ${-amp} ${period / 2} 0`;
  for (let x = period; x <= width; x += period / 2) d += ` T${x} 0`;
  return `${d} L${width} ${bottom} L0 ${bottom} Z`;
}

/* ---------- line-draw ---------- */

export interface LineDrawProps extends BaseProps {
  /** A single path; or pass SVG shapes as children instead (direct child path, line, circle...) */
  d?: string;
  children?: ReactNode;
  viewBox?: string;
  strokeWidth?: number;
  trigger?: LineDrawTrigger;
  duration?: number;
  delay?: number;
  /** Text description of the graphic; treated as decorative when omitted */
  title?: string;
}

const defaultLinePath =
  "M10 70 C30 20 50 20 55 55 S80 90 95 50 S120 10 135 45 S160 85 175 40 C182 25 190 30 190 30";

export function LineDraw({
  d = defaultLinePath,
  children,
  viewBox = "0 0 200 100",
  strokeWidth = 3,
  trigger = "mount",
  duration = 1.6,
  delay = 0,
  title,
  colors,
  className,
}: LineDrawProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const { active, reduce } = useLoopActive(svgRef);
  const inView = useInView(svgRef, { once: true, amount: 0.4 });
  const [hovered, setHovered] = useState(false);
  const progress = useMotionValue(0);

  useMotionValueEvent(progress, "change", (v) => gRef.current?.style.setProperty("--draw", String(1 - v)));

  useEffect(() => {
    if (reduce) {
      progress.set(1);
      return;
    }
    const ease = [0.65, 0, 0.35, 1] as const;
    if (trigger === "mount" || (trigger === "inView" && inView)) {
      const c = animate(progress, 1, { duration, delay, ease });
      return () => c.stop();
    }
    if (trigger === "hover") {
      const c = animate(progress, hovered ? 1 : 0, { duration: duration * 0.6, ease });
      return () => c.stop();
    }
    if (trigger === "loop" && active) {
      const c = animate(progress, [0, 1, 1, 0, 0], {
        duration: duration * 2.6,
        times: [0, 0.4, 0.6, 0.95, 1],
        ease: "easeInOut",
        delay,
        repeat: Infinity,
      });
      return () => c.stop();
    }
  }, [trigger, inView, hovered, active, reduce, duration, delay, progress]);

  // Give every direct child shape pathLength=1 and drive the stroke progress with one CSS variable
  const drawStyle: CSSProperties = { strokeDasharray: "1 1", strokeDashoffset: "var(--draw)" };
  const shapes = children ? (
    Children.map(children, (child) =>
      isValidElement(child)
        ? cloneElement(child as ReactElement<SVGProps<SVGElement>>, {
            pathLength: 1,
            style: { ...drawStyle, ...(child.props as SVGProps<SVGElement>).style },
          })
        : child,
    )
  ) : (
    <path d={d} pathLength={1} style={drawStyle} />
  );

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      className={cn("h-auto w-full overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      onPointerEnter={trigger === "hover" ? () => setHovered(true) : undefined}
      onPointerLeave={trigger === "hover" ? () => setHovered(false) : undefined}
    >
      <g
        ref={gRef}
        fill="none"
        stroke={pick(colors, 0)}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ "--draw": 1 } as CSSProperties}
      >
        {shapes}
      </g>
    </svg>
  );
}

/* ---------- blob-morph ---------- */

function blobPath(t: number, points = 8) {
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = 36 + Math.sin(t * 0.9 + i * 1.7) * 6 + Math.sin(t * 1.4 + i * 2.9) * 4;
    pts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]);
  }
  // Catmull-Rom converted to cubic Bezier, giving a smooth closed curve
  let d = `M${pts[0]![0].toFixed(2)} ${pts[0]![1].toFixed(2)}`;
  for (let i = 0; i < points; i++) {
    const p0 = pts[(i - 1 + points) % points]!;
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % points]!;
    const p3 = pts[(i + 2) % points]!;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]!.toFixed(2)} ${c1[1]!.toFixed(2)} ${c2[0]!.toFixed(2)} ${c2[1]!.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return `${d} Z`;
}

export function BlobMorph({ colors, speed = 1, className }: BaseProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const { active } = useLoopActive(svgRef);
  const t = useClock(active, speed);
  const id = useSvgId("blob");
  useMotionValueEvent(t, "change", (v) => pathRef.current?.setAttribute("d", blobPath(v)));

  return (
    <svg ref={svgRef} viewBox="0 0 100 100" className={cn("h-auto w-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={pick(colors, 0)} />
          <stop offset="100%" stopColor={pick(colors, 1)} />
        </linearGradient>
      </defs>
      <path ref={pathRef} d={blobPath(0)} fill={`url(#${id})`} />
    </svg>
  );
}

/* ---------- gooey ---------- */

export function Gooey({ colors, speed = 1, className }: BaseProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const { active } = useLoopActive(svgRef);
  const t = useClock(active, speed, 1.2);
  const id = useSvgId("goo");
  const count = 5;

  const place = (v: number) => {
    for (let i = 0; i < count; i++) {
      const el = dots.current[i];
      if (!el) continue;
      const a = (i / count) * Math.PI * 2 + v * 0.6;
      // Each circle enters and leaves on its own; near the center the filter merges them into one blob
      const r = 6 + (Math.sin(v * 1.6 + i * 1.3) + 1) * 15;
      el.setAttribute("cx", (50 + Math.cos(a) * r).toFixed(2));
      el.setAttribute("cy", (50 + Math.sin(a) * r).toFixed(2));
    }
  };
  useMotionValueEvent(t, "change", place);
  useEffect(() => place(t.get()));

  return (
    <svg ref={svgRef} viewBox="0 0 100 100" className={cn("h-auto w-full", className)} aria-hidden="true">
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
      <g filter={`url(#${id})`} fill={pick(colors, 0)}>
        <circle cx="50" cy="50" r="15" />
        {Array.from({ length: count }, (_, i) => (
          <circle
            key={i}
            ref={(el) => {
              dots.current[i] = el;
            }}
            cx="50"
            cy="50"
            r={i % 2 ? 7 : 9}
          />
        ))}
      </g>
    </svg>
  );
}

/* ---------- orbiting-circles ---------- */

export interface OrbitRing {
  /** Radius as a fraction of the container's half width (0 to 1) */
  radius: number;
  /** Seconds per revolution */
  duration: number;
  reverse?: boolean;
  /** Items on the orbit; draws dots when omitted */
  items?: ReactNode[];
  /** Number of dots when items is omitted */
  dots?: number;
}

export interface OrbitingCirclesProps extends BaseProps {
  rings?: OrbitRing[];
  center?: ReactNode;
}

const defaultRings: OrbitRing[] = [
  { radius: 0.4, duration: 9, dots: 2 },
  { radius: 0.72, duration: 16, reverse: true, dots: 3 },
  { radius: 0.96, duration: 24, dots: 4 },
];

export function OrbitingCircles({ rings = defaultRings, center, colors, speed = 1, className }: OrbitingCirclesProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { active } = useLoopActive(ref);
  const t = useClock(active, speed);

  return (
    <div ref={ref} className={cn("relative aspect-square w-full", className)}>
      {rings.map((ring, i) => (
        <OrbitRingView key={i} ring={ring} t={t} color={pick(colors, i)} />
      ))}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {center ?? (
          <span
            className="block size-10 rounded-full"
            style={{ background: pick(colors, 0), boxShadow: `0 0 24px color-mix(in oklch, ${pick(colors, 0)} 50%, transparent)` }}
          />
        )}
      </div>
    </div>
  );
}

function OrbitRingView({ ring, t, color }: { ring: OrbitRing; t: MotionValue<number>; color: string }) {
  const dir = ring.reverse ? -1 : 1;
  const rotate = useTransform(t, (v) => ((v / ring.duration) * 360 * dir) % 360);
  const counter = useTransform(rotate, (r) => -r);
  const items = ring.items ?? Array.from({ length: ring.dots ?? 3 }, () => null);
  const size = `${ring.radius * 100}%`;

  return (
    <>
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border"
        style={{ width: size, height: size }}
      />
      <motion.div className="absolute inset-0" style={{ rotate }}>
        {items.map((item, j) => {
          const a = (j / items.length) * Math.PI * 2;
          return (
            <motion.div
              key={j}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${50 + Math.cos(a) * ring.radius * 50}%`,
                top: `${50 + Math.sin(a) * ring.radius * 50}%`,
                rotate: counter,
              }}
            >
              {item ?? <span aria-hidden="true" className="block size-2.5 rounded-full" style={{ background: color }} />}
            </motion.div>
          );
        })}
      </motion.div>
    </>
  );
}

/* ---------- motion-path ---------- */

export interface MotionPathProps extends BaseProps {
  d?: string;
  viewBox?: string;
  /** Seconds for one trip */
  duration?: number;
  /** Whether to draw the trail line */
  showPath?: boolean;
}

const defaultMotionPath = "M20 80 C20 20 80 20 100 50 S180 80 180 20";

export function MotionPath({
  d = defaultMotionPath,
  viewBox = "0 0 200 100",
  duration = 4,
  showPath = true,
  colors,
  speed = 1,
  className,
}: MotionPathProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const { active } = useLoopActive(svgRef);
  const t = useClock(active, speed, duration * 0.35);
  const trail = [0, 0.015, 0.03, 0.045];

  const place = (v: number) => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    trail.forEach((lag, i) => {
      const el = dots.current[i];
      if (!el) return;
      const p = ((((v / duration) - lag) % 1) + 1) % 1;
      const pt = path.getPointAtLength(p * len);
      el.setAttribute("cx", pt.x.toFixed(2));
      el.setAttribute("cy", pt.y.toFixed(2));
    });
  };
  useMotionValueEvent(t, "change", place);
  useEffect(() => place(t.get()));

  const c = pick(colors, 0);
  return (
    <svg ref={svgRef} viewBox={viewBox} className={cn("h-auto w-full overflow-visible", className)} aria-hidden="true">
      <path
        ref={pathRef}
        d={d}
        fill="none"
        stroke={showPath ? "var(--border)" : "none"}
        strokeWidth="1.5"
        strokeDasharray="3 4"
      />
      {trail.map((_, i) => (
        <circle
          key={i}
          ref={(el) => {
            dots.current[i] = el;
          }}
          cx="-100"
          cy="-100"
          r={5 - i}
          fill={c}
          opacity={1 - i * 0.22}
          style={i === 0 ? { filter: `drop-shadow(0 0 4px ${c})` } : undefined}
        />
      ))}
    </svg>
  );
}

/* ---------- icon-morph ---------- */

export interface IconMorphProps {
  icon: IconMorphName;
  /** Controlled state; when omitted the component manages it itself */
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  /** Accessible names for [unpressed, pressed] */
  labels?: [string, string];
  className?: string;
}

const iconLabels: Record<IconMorphName, [string, string]> = {
  "menu-close": ["Open menu", "Close menu"],
  "play-pause": ["Play", "Pause"],
  "plus-minus": ["Expand", "Collapse"],
};

// Both states have the same path command structure, so framer-motion can tween point by point
const morphPaths: Record<IconMorphName, { stroke: boolean; from: string[]; to: string[] }> = {
  "menu-close": {
    stroke: true,
    from: ["M4 6 L20 6", "M4 12 L20 12", "M4 18 L20 18"],
    to: ["M6 6 L18 18", "M12 12 L12 12", "M6 18 L18 6"],
  },
  "play-pause": {
    stroke: false,
    from: ["M7 5 L12.5 8.5 L12.5 15.5 L7 19 Z", "M12.5 8.5 L18 12 L18 12 L12.5 15.5 Z"],
    to: ["M6.5 5 L10.5 5 L10.5 19 L6.5 19 Z", "M13.5 5 L17.5 5 L17.5 19 L13.5 19 Z"],
  },
  "plus-minus": {
    stroke: true,
    from: ["M5 12 L19 12", "M12 5 L12 19"],
    to: ["M5 12 L19 12", "M12 12 L12 12"],
  },
};

export function IconMorph({ icon, pressed, defaultPressed = false, onPressedChange, labels, className }: IconMorphProps) {
  const reduce = useReducedMotion() ?? false;
  const [inner, setInner] = useState(defaultPressed);
  const on = pressed ?? inner;
  const spec = morphPaths[icon];
  const names = labels ?? iconLabels[icon];
  const transition = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 320, damping: 26 };

  return (
    <button
      type="button"
      aria-label={on ? names[1] : names[0]}
      onClick={() => {
        setInner(!on);
        onPressedChange?.(!on);
      }}
      className={cn(
        "inline-grid size-11 place-items-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
        {spec.from.map((from, i) => (
          <motion.path
            key={i}
            initial={false}
            animate={{ d: on ? spec.to[i] : from }}
            transition={transition}
            fill={spec.stroke ? "none" : "currentColor"}
            stroke={spec.stroke ? "currentColor" : "none"}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </button>
  );
}

/* ---------- animated-beam ---------- */

export interface AnimatedBeamProps extends BaseProps {
  /** Number of input nodes on the left (1 to 5) */
  inputs?: number;
  /** Number of output nodes on the right (1 to 4) */
  outputs?: number;
  /** Seconds for one round (inputs flow to the center, then out) */
  duration?: number;
}

export function AnimatedBeam({ inputs = 3, outputs = 2, duration = 3, colors, speed = 1, className }: AnimatedBeamProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { active } = useLoopActive(svgRef);
  const t = useClock(active, speed, duration * 0.3);
  const ins = spread(Math.min(5, Math.max(1, inputs)), 30, 170);
  const outs = spread(Math.min(4, Math.max(1, outputs)), 50, 150);
  const c = pick(colors, 0);

  return (
    <svg ref={svgRef} viewBox="0 0 400 200" className={cn("h-auto w-full", className)} aria-hidden="true">
      {ins.map((y, i) => (
        <BeamPath key={`i${i}`} d={`M40 ${y} C120 ${y} 120 100 200 100`} t={t} duration={duration} window={[0, 0.5]} lag={i * 0.04} color={c} />
      ))}
      {outs.map((y, i) => (
        <BeamPath key={`o${i}`} d={`M200 100 C280 100 280 ${y} 360 ${y}`} t={t} duration={duration} window={[0.5, 1]} lag={i * 0.04} color={c} />
      ))}
      {ins.map((y, i) => (
        <BeamNode key={`n${i}`} x={40} y={y} glyph={i} />
      ))}
      {outs.map((y, i) => (
        <BeamNode key={`m${i}`} x={360} y={y} glyph={i + 2} />
      ))}
      <circle cx="200" cy="100" r="24" fill={c} style={{ filter: `drop-shadow(0 0 10px color-mix(in oklch, ${c} 55%, transparent))` }} />
      <path d="M192 100 L198 106 L209 94" fill="none" stroke="var(--primary-foreground)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function spread(n: number, from: number, to: number) {
  if (n === 1) return [(from + to) / 2];
  return Array.from({ length: n }, (_, i) => from + ((to - from) * i) / (n - 1));
}

function BeamPath({
  d,
  t,
  duration,
  window: [start, end],
  lag,
  color,
}: {
  d: string;
  t: MotionValue<number>;
  duration: number;
  window: [number, number];
  lag: number;
  color: string;
}) {
  const dash = 0.25;
  // Each runs one trip only inside its own time window; outside the window the dot is moved off the path
  const offset = useTransform(t, (v) => {
    const cycle = ((v / duration) % 1 + 1) % 1;
    const local = (cycle - start - lag) / (end - start);
    if (local < 0 || local > 1) return dash;
    return dash - local * (1 + dash);
  });
  return (
    <>
      <path d={d} fill="none" stroke="var(--border)" strokeWidth="2" />
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${dash} 2`}
        style={{ strokeDashoffset: offset, filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </>
  );
}

function BeamNode({ x, y, glyph }: { x: number; y: number; glyph: number }) {
  const g = glyph % 4;
  return (
    <g>
      <circle cx={x} cy={y} r="16" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
      <g fill="var(--muted-foreground)">
        {g === 0 && <circle cx={x} cy={y} r="5" />}
        {g === 1 && <rect x={x - 5} y={y - 5} width="10" height="10" rx="2" />}
        {g === 2 && <path d={`M${x} ${y - 6} L${x + 6} ${y + 5} L${x - 6} ${y + 5} Z`} />}
        {g === 3 && <path d={`M${x} ${y - 6} L${x + 6} ${y} L${x} ${y + 6} L${x - 6} ${y} Z`} />}
      </g>
    </g>
  );
}

/* ---------- flowing-connectors ---------- */

const flowEdges = [
  "M50 100 C110 100 130 45 200 45",
  "M50 100 C110 100 130 155 200 155",
  "M200 45 C270 45 290 100 350 100",
  "M200 155 C270 155 290 100 350 100",
  "M200 45 L200 155",
];
const flowNodes: [number, number][] = [
  [50, 100],
  [200, 45],
  [200, 155],
  [350, 100],
];

export function FlowingConnectors({ colors, speed = 1, className }: BaseProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { active } = useLoopActive(svgRef);
  const t = useClock(active, speed, 0.5);
  const dashOffset = useTransform(t, (v) => -((v * 24) % 9));
  const dotOffset = useTransform(t, (v) => -((v * 0.18) % (1 / 3)));
  const c = pick(colors, 0);

  return (
    <svg ref={svgRef} viewBox="0 0 400 200" className={cn("h-auto w-full", className)} aria-hidden="true">
      {flowEdges.map((d, i) => (
        <g key={i}>
          <motion.path
            d={d}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeOpacity="0.5"
            strokeWidth="1.5"
            strokeDasharray="4 5"
            style={{ strokeDashoffset: dashOffset }}
          />
          <motion.path
            d={d}
            fill="none"
            stroke={c}
            strokeWidth="5"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`0.001 ${1 / 3 - 0.001}`}
            style={{ strokeDashoffset: dotOffset }}
          />
        </g>
      ))}
      {flowNodes.map(([x, y], i) => (
        <rect key={i} x={x - 18} y={y - 14} width="36" height="28" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/* ---------- radar-sweep ---------- */

export interface RadarSweepProps extends BaseProps {
  /** Seconds per sweep */
  duration?: number;
  /** Number of blips */
  blips?: number;
}

function polar(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)];
}

export function RadarSweep({ duration = 4, blips = 7, colors, speed = 1, className }: RadarSweepProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const sweepRef = useRef<SVGGElement>(null);
  const { active } = useLoopActive(svgRef);
  const t = useClock(active, speed, duration * 0.3);
  const angle = useTransform(t, (v) => ((v / duration) * 360) % 360);
  useMotionValueEvent(angle, "change", (a) => sweepRef.current?.setAttribute("transform", `rotate(${a.toFixed(2)})`));
  useEffect(() => {
    sweepRef.current?.setAttribute("transform", `rotate(${angle.get().toFixed(2)})`);
  }, [angle]);

  const c = pick(colors, 0);
  const slices = 18;
  const step = 4;
  // A fixed formula produces the blip positions, so server and browser agree
  const points = Array.from({ length: blips }, (_, i) => ({
    deg: (i * 137.5 + 20) % 360,
    r: 25 + ((i * 53) % 60),
  }));

  return (
    <svg ref={svgRef} viewBox="-100 -100 200 200" className={cn("h-auto w-full", className)} aria-hidden="true">
      <circle r="96" fill={`color-mix(in oklch, ${c} 6%, transparent)`} stroke="var(--border)" />
      {[32, 64].map((r) => (
        <circle key={r} r={r} fill="none" stroke="var(--border)" />
      ))}
      <path d="M-96 0 H96 M0 -96 V96" stroke="var(--border)" />
      <g ref={sweepRef}>
        {Array.from({ length: slices }, (_, k) => {
          const [x0, y0] = polar(96, -(k + 1) * step);
          const [x1, y1] = polar(96, -k * step);
          return (
            <path
              key={k}
              d={`M0 0 L${x0.toFixed(2)} ${y0.toFixed(2)} A96 96 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`}
              fill={c}
              opacity={0.32 * (1 - k / slices)}
            />
          );
        })}
        <line x1="0" y1="0" x2="0" y2="-96" stroke={c} strokeWidth="1.5" />
      </g>
      {points.map((p, i) => (
        <Blip key={i} deg={p.deg} r={p.r} angle={angle} color={c} />
      ))}
      <circle r="3" fill={c} />
    </svg>
  );
}

function Blip({ deg, r, angle, color }: { deg: number; r: number; angle: MotionValue<number>; color: string }) {
  const [x, y] = polar(r, deg);
  // Brightest at the moment the sweep passes, then fades
  const opacity = useTransform(angle, (a) => {
    const behind = (a - deg + 360) % 360;
    return Math.max(0.08, 1 - behind / 220);
  });
  return <motion.circle cx={x} cy={y} r="3.5" fill={color} style={{ opacity }} />;
}

/* ---------- liquid-fill ---------- */

export interface LiquidFillProps extends BaseProps {
  /** 0 to 100 */
  value: number;
  shape?: LiquidShape;
  /** Name for screen readers, for example "Battery" */
  label?: string;
  /** Whether to show the percentage in the center */
  showValue?: boolean;
}

const shapePaths: Record<LiquidShape, string> = {
  circle: "M4 50 A46 46 0 1 0 96 50 A46 46 0 1 0 4 50 Z",
  drop: "M50 5 C50 5 16 44 16 64 A34 34 0 0 0 84 64 C84 44 50 5 50 5 Z",
  heart: "M50 90 C22 70 5 54 5 33 A21 21 0 0 1 50 24 A21 21 0 0 1 95 33 C95 54 78 70 50 90 Z",
};

export function LiquidFill({ value, shape = "circle", label = "Progress", showValue = true, colors, speed = 1, className }: LiquidFillProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGPathElement>(null);
  const frontRef = useRef<SVGPathElement>(null);
  const clipWaveRef = useRef<SVGPathElement>(null);
  const { active, reduce } = useLoopActive(svgRef);
  const t = useClock(active, speed, 0.6);
  const id = useSvgId("liquid");
  const pct = Math.max(0, Math.min(100, value));
  const target = 96 - pct * 0.92;
  const levelSource = useMotionValue(target);
  const level = useSpring(levelSource, { stiffness: 60, damping: 16 });

  useEffect(() => {
    if (reduce) {
      levelSource.set(target);
      level.jump(target);
    } else levelSource.set(target);
  }, [target, reduce, levelSource, level]);

  const place = () => {
    const v = t.get();
    const y = level.get();
    const front = `translate(${(-((v * 30) % 50)).toFixed(2)} ${y.toFixed(2)})`;
    const back = `translate(${(-50 + ((v * 18) % 50)).toFixed(2)} ${(y - 1.5).toFixed(2)})`;
    frontRef.current?.setAttribute("transform", front);
    clipWaveRef.current?.setAttribute("transform", front);
    backRef.current?.setAttribute("transform", back);
  };
  useMotionValueEvent(t, "change", place);
  useMotionValueEvent(level, "change", place);
  useEffect(place);

  const c0 = pick(colors, 0);
  const wave = wavePath(50, 3.5, 200, 120);
  const text = (
    <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="18" fontWeight="600" style={{ fontVariantNumeric: "tabular-nums" }}>
      {Math.round(pct)}%
    </text>
  );

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn("aspect-square w-full", className)}
    >
      <svg ref={svgRef} viewBox="0 0 100 100" className="size-full" aria-hidden="true">
        <defs>
          <clipPath id={`${id}-shape`}>
            <path d={shapePaths[shape]} />
          </clipPath>
          <clipPath id={`${id}-wave`}>
            <path ref={clipWaveRef} d={wave} />
          </clipPath>
        </defs>
        <path d={shapePaths[shape]} fill="var(--muted)" />
        <g clipPath={`url(#${id}-shape)`}>
          <path ref={backRef} d={wave} fill={c0} fillOpacity="0.35" />
          <path ref={frontRef} d={wave} fill={c0} />
        </g>
        {showValue && (
          <>
            <g fill="var(--foreground)">{text}</g>
            <g fill="var(--primary-foreground)" clipPath={`url(#${id}-wave)`}>
              {text}
            </g>
          </>
        )}
        <path d={shapePaths[shape]} fill="none" stroke="var(--border)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/* ---------- Main component ---------- */

export interface SvgEffectProps extends BaseProps {
  effect: SvgEffectName;
  /** Path used by line-draw and motion-path */
  d?: string;
  viewBox?: string;
  /** Custom shapes used by line-draw */
  children?: ReactNode;
  trigger?: LineDrawTrigger;
  duration?: number;
  delay?: number;
  /** Used by icon-morph */
  icon?: IconMorphName;
  /** Used by liquid-fill, 0 to 100 */
  value?: number;
  shape?: LiquidShape;
  label?: string;
}

/** Switches between ten SVG effects with effect; each effect can also be imported as its own component for its full props */
export function SvgEffect({ effect, d, viewBox, children, trigger, duration, delay, icon, value, shape, label, ...base }: SvgEffectProps) {
  switch (effect) {
    case "line-draw":
      return (
        <LineDraw d={d} viewBox={viewBox} trigger={trigger} duration={duration} delay={delay} title={label} {...base}>
          {children}
        </LineDraw>
      );
    case "blob-morph":
      return <BlobMorph {...base} />;
    case "gooey":
      return <Gooey {...base} />;
    case "orbiting-circles":
      return <OrbitingCircles {...base} />;
    case "motion-path":
      return <MotionPath d={d} viewBox={viewBox} duration={duration} {...base} />;
    case "icon-morph":
      return <IconMorph icon={icon ?? "menu-close"} className={base.className} />;
    case "animated-beam":
      return <AnimatedBeam duration={duration} {...base} />;
    case "flowing-connectors":
      return <FlowingConnectors {...base} />;
    case "radar-sweep":
      return <RadarSweep duration={duration} {...base} />;
    case "liquid-fill":
      return <LiquidFill value={value ?? 60} shape={shape} label={label} {...base} />;
  }
}
