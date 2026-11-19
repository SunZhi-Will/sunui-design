"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Easing,
  type MotionValue,
  type Variants,
} from "framer-motion";
import {
  Children,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "@/lib/utils";

/** All animation principle ids. The demo and the docs both read from here */
export const motionPrinciples = [
  "burst",
  "easing",
  "overshoot",
  "squash-stretch",
  "motion-trail",
  "impact-shake",
  "anticipation",
  "follow-through",
  "bounce",
  "wiggle",
  "pulse",
  "ping-pong",
  "stop-motion",
  "repeater",
  "kaleidoscope",
  "line-boil",
  "exploded-view",
  "stagger",
] as const;

export type MotionPrincipleName = (typeof motionPrinciples)[number];
export type MotionPrincipleTrigger = "mount" | "inView" | "hover" | "click" | "loop";
export type ExplodeAxis = "x" | "y" | "z";

/** Principles that run continuously. The rest are one-shot actions (replayable) */
export const loopingMotionPrinciples: readonly MotionPrincipleName[] = [
  "motion-trail",
  "wiggle",
  "pulse",
  "ping-pong",
  "stop-motion",
  "repeater",
  "kaleidoscope",
  "line-boil",
];

export function isLoopingMotionPrinciple(effect: MotionPrincipleName) {
  return loopingMotionPrinciples.includes(effect);
}

/** Named easing curves (cubic-bezier). Pass one straight to the ease prop or to framer-motion */
export const easings = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  in: [0.42, 0, 1, 1],
  out: [0, 0, 0.58, 1],
  inOut: [0.65, 0, 0.35, 1],
  outQuart: [0.25, 1, 0.5, 1],
  outExpo: [0.16, 1, 0.3, 1],
  inOutQuint: [0.83, 0, 0.17, 1],
  outBack: [0.34, 1.56, 0.64, 1],
  inBack: [0.36, 0, 0.66, -0.56],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type EasingName = keyof typeof easings;
export type EaseValue = EasingName | readonly [number, number, number, number];

function toEase(e: EaseValue): Easing {
  return typeof e === "string" ? easings[e] : e;
}

// Default duration (seconds) and distance (px) for each principle. For line-boil, duration is how many seconds each "hand-drawn frame" is held
const base: Record<MotionPrincipleName, { duration: number; distance: number }> = {
  burst: { duration: 0.7, distance: 44 },
  easing: { duration: 1.2, distance: 160 },
  overshoot: { duration: 0.9, distance: 0 },
  "squash-stretch": { duration: 1.1, distance: 56 },
  "motion-trail": { duration: 2.6, distance: 150 },
  "impact-shake": { duration: 0.9, distance: 80 },
  anticipation: { duration: 1.2, distance: 140 },
  "follow-through": { duration: 1.8, distance: 140 },
  bounce: { duration: 1.6, distance: 90 },
  wiggle: { duration: 1.4, distance: 0 },
  pulse: { duration: 1.3, distance: 0 },
  "ping-pong": { duration: 1.2, distance: 150 },
  "stop-motion": { duration: 3, distance: 160 },
  repeater: { duration: 2.4, distance: 48 },
  kaleidoscope: { duration: 14, distance: 34 },
  "line-boil": { duration: 0.14, distance: 0 },
  "exploded-view": { duration: 2.6, distance: 28 },
  stagger: { duration: 0.5, distance: 16 },
};

/* ---------- shared helpers ---------- */

/** Stable pseudo-random number (0 to 1) from an index, identical on the server and the client */
function rand(i: number, salt = 1) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function subscribeVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}

/** Whether the tab is in the foreground. Loops pause while another tab is active */
function usePageVisible() {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== "hidden",
    () => true,
  );
}

/** Derived from trigger: when a one-shot plays (play / cycle) and when a loop runs (running) */
function useTrigger(trigger: MotionPrincipleTrigger, looping: boolean, cycleSeconds: number) {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.3 });
  const visible = useInView(ref, { amount: 0 });
  const pageVisible = usePageVisible();
  const [hovered, setHovered] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [cycle, setCycle] = useState(0);

  const play = trigger === "inView" ? seen : true;
  const running =
    !reduce &&
    visible &&
    pageVisible &&
    (trigger === "hover" ? hovered : trigger === "click" ? toggled : trigger === "inView" ? seen : true);

  // One-shot with trigger="loop": replays periodically while in view
  useEffect(() => {
    if (looping || trigger !== "loop" || reduce || !visible || !pageVisible) return;
    const id = setInterval(() => setCycle((c) => c + 1), cycleSeconds * 1000);
    return () => clearInterval(id);
  }, [looping, trigger, reduce, visible, pageVisible, cycleSeconds]);

  const handlers: HTMLAttributes<HTMLSpanElement> = {};
  if (trigger === "hover") {
    handlers.onMouseEnter = () => {
      setHovered(true);
      if (!looping && !reduce) setCycle((c) => c + 1);
    };
    handlers.onMouseLeave = () => setHovered(false);
  }
  if (trigger === "click") {
    // Click events bubble up from children, so keyboard activation also fires when a button is wrapped
    handlers.onClick = () => {
      setToggled((v) => !v);
      if (!looping && !reduce) setCycle((c) => c + 1);
    };
  }

  return { ref, reduce, play, running, cycle, handlers };
}

// Layers stacked in the same grid cell (grid 1/1)
const cell = "[grid-area:1/1]";

/* ---------- main component ---------- */

export interface MotionPrincipleProps {
  effect?: MotionPrincipleName;
  /** One-shot actions: when to play. Looping principles: run only on hover / click / inView */
  trigger?: MotionPrincipleTrigger;
  /** Amplitude multiplier, 1 is the default. 0.5 is subtle, 1.5 is exaggerated */
  intensity?: number;
  /** Seconds for a one-shot action or one loop cycle. Omit to use the default */
  duration?: number;
  /** Delay before starting (seconds). One-shot actions only */
  delay?: number;
  /** Travel distance or radius (px): travel for movement types, drop height for bounce, radius for repeater */
  distance?: number;
  /** Color of decorations such as burst lines and pulse rings. Defaults to currentColor */
  color?: string;
  /** Line count for burst, bounce count for bounce, afterimage count for motion-trail, copy count for repeater / kaleidoscope */
  count?: number;
  /** Easing used by easing / ping-pong */
  ease?: EaseValue;
  /** follow-through: an appendage (flag, antenna, tail) attached above the subject that keeps swinging after it stops */
  trailing?: ReactNode;
  /** exploded-view: direction in which the layers spread */
  axis?: ExplodeAxis;
  className?: string;
  children?: ReactNode;
}

interface InnerProps {
  children?: ReactNode;
  d: number;
  delay: number;
  dist: number;
  k: number;
  color: string;
  count?: number;
  ease?: EaseValue;
  trailing?: ReactNode;
  axis: ExplodeAxis;
  running: boolean;
  reduce: boolean;
}

/**
  * Classic animation principles wrapper: animates any child (icon, badge, button, product image) with the principle named by effect.
  * One-shot actions play on trigger. Looping principles pause when off screen or when the tab is hidden. Under reduced motion the child is shown static.
  */
export function MotionPrinciple({
  effect = "bounce",
  trigger = "mount",
  intensity = 1,
  duration,
  delay = 0,
  distance,
  color = "currentColor",
  count,
  ease,
  trailing,
  axis = "z",
  className,
  children,
}: MotionPrincipleProps) {
  const looping = isLoopingMotionPrinciple(effect);
  const d = duration ?? base[effect].duration;
  const dist = distance ?? base[effect].distance;
  const t = useTrigger(trigger, looping, delay + d + 1.2);

  const inner: InnerProps = {
    children,
    d,
    delay,
    dist,
    k: intensity,
    color,
    count,
    ease,
    trailing,
    axis,
    running: t.running,
    reduce: t.reduce,
  };
  const Effect = renderers[effect];

  return (
    <span
      ref={t.ref}
      className={cn("relative inline-block", (trigger === "hover" || trigger === "click") && "cursor-pointer", className)}
      {...t.handlers}
    >
      {looping || t.reduce ? (
        <Effect {...inner} />
      ) : t.play ? (
        <Effect key={t.cycle} {...inner} />
      ) : (
        <Rest {...inner} effect={effect} />
      )}
    </span>
  );
}

/** Resting state before inView has entered the viewport */
function Rest({ children, effect, trailing, axis, dist }: InnerProps & { effect: MotionPrincipleName }) {
  if (effect === "exploded-view") return <Layers layers={Children.toArray(children)} axis={axis} gap={dist} progress={0} />;
  if (effect === "stagger")
    return (
      <span className="contents">
        {Children.toArray(children).map((c, i) => (
          <span key={i} className="inline-block opacity-0">
            {c}
          </span>
        ))}
      </span>
    );
  if (effect === "follow-through" && trailing) return <WithTrailing trailing={trailing}>{children}</WithTrailing>;
  return <span className="inline-block">{children}</span>;
}

/* ---------- principles ---------- */

// 003 Burst: the child pops while a ring, radiating lines and dots scatter outward
function Burst({ children, d, delay, dist, k, color, count, reduce }: InnerProps) {
  if (reduce) return <span className="inline-block">{children}</span>;
  const n = count ?? 8;
  const R = dist * Math.max(0.4, k);
  const step = (Math.PI * 2) / n;
  const t = { duration: d, delay, ease: [0.2, 0.7, 0.3, 1] as Easing };
  return (
    <span className="relative inline-block">
      <svg
        aria-hidden="true"
        width="0"
        height="0"
        className="pointer-events-none absolute left-1/2 top-1/2 overflow-visible"
        style={{ color }}
      >
        <motion.circle
          cx={0}
          cy={0}
          fill="none"
          stroke="currentColor"
          initial={{ r: R * 0.3, opacity: 0.9, strokeWidth: 6 * k }}
          animate={{ r: R, opacity: 0, strokeWidth: 0.5 }}
          transition={t}
        />
        {Array.from({ length: n }, (_, i) => {
          const a = i * step - Math.PI / 2;
          const c = Math.cos(a);
          const s = Math.sin(a);
          return (
            <motion.path
              key={`l${i}`}
              d={`M${c * R * 0.5} ${s * R * 0.5} L${c * R * 0.95} ${s * R * 0.95}`}
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={{ pathLength: 0, pathOffset: 0, opacity: 1 }}
              animate={{ pathLength: [0, 1, 0.2], pathOffset: [0, 0, 0.8], opacity: [1, 1, 0] }}
              transition={t}
            />
          );
        })}
        {Array.from({ length: n }, (_, i) => {
          const a = i * step + step / 2 - Math.PI / 2;
          const c = Math.cos(a);
          const s = Math.sin(a);
          return (
            <motion.circle
              key={`d${i}`}
              fill="currentColor"
              initial={{ cx: c * R * 0.4, cy: s * R * 0.4, r: 3, opacity: 1 }}
              animate={{ cx: c * R * 1.1, cy: s * R * 1.1, r: 0.5, opacity: 0 }}
              transition={{ ...t, duration: d * 1.15 }}
            />
          );
        })}
      </svg>
      <motion.span
        className="relative inline-block"
        initial={{ scale: 0.6 }}
        animate={{ scale: [0.6, 1 + 0.25 * k, 1 - 0.05 * k, 1] }}
        transition={{ duration: d * 0.8, delay, times: [0, 0.4, 0.75, 1], ease: "easeOut" }}
      >
        {children}
      </motion.span>
    </span>
  );
}

// 009 Easing: same distance and same duration, only the speed curve changes
function EasingMove({ children, d, delay, dist, ease = "inOut", reduce }: InnerProps) {
  if (reduce) return <span className="inline-block">{children}</span>;
  const h = dist / 2;
  return (
    <motion.span
      className="inline-block"
      initial={{ x: -h }}
      animate={{ x: h }}
      transition={{ duration: d, delay, ease: toEase(ease) }}
    >
      {children}
    </motion.span>
  );
}

// 010 Overshoot: shoots past the target, pulls back, then settles
function Overshoot({ children, d, delay, k, reduce }: InnerProps) {
  if (reduce) return <span className="inline-block">{children}</span>;
  return (
    <motion.span
      className="inline-block"
      initial={{ scale: 0, rotate: -30 * k }}
      animate={{
        scale: [0, 1 + 0.22 * k, 1 - 0.07 * k, 1 + 0.03 * k, 1],
        rotate: [-30 * k, 9 * k, -4 * k, 1.5 * k, 0],
      }}
      transition={{ duration: d, delay, times: [0, 0.4, 0.62, 0.82, 1], ease: "easeOut" }}
    >
      {children}
    </motion.span>
  );
}

// 011 Squash and stretch: squashes before the jump, stretches in the air, squashes again on landing (pivot at the bottom)
function SquashStretch({ children, d, delay, dist, k, reduce }: InnerProps) {
  if (reduce) return <span className="inline-block">{children}</span>;
  const h = dist;
  const times = [0, 0.14, 0.3, 0.52, 0.72, 0.8, 0.9, 1];
  const ease: Easing[] = ["easeOut", "easeOut", "easeOut", "easeIn", "easeIn", "easeOut", "easeInOut"];
  const t = { duration: d, delay, times, ease };
  return (
    <span className="relative inline-block">
      <motion.span
        aria-hidden="true"
        className="absolute inset-x-[10%] -bottom-1 h-1.5 rounded-full bg-current opacity-15"
        animate={{ scaleX: [1, 1.12, 0.7, 0.45, 0.8, 1.2, 1, 1] }}
        transition={t}
      />
      <motion.span
        className="inline-block"
        style={{ transformOrigin: "50% 100%" }}
        animate={{
          y: [0, 0, -0.35 * h, -h, -0.15 * h, 0, 0, 0],
          scaleY: [1, 1 - 0.22 * k, 1 + 0.28 * k, 1, 1 + 0.2 * k, 1 - 0.38 * k, 1 + 0.06 * k, 1],
          scaleX: [1, 1 + 0.22 * k, 1 - 0.18 * k, 1, 1 - 0.12 * k, 1 + 0.38 * k, 1 - 0.04 * k, 1],
        }}
        transition={t}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Schedules a per-frame callback only while running. When stopped it uses no frame loop at all */
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

// 014 Motion trail: moves along a figure-8 path with fading copies behind it
function MotionTrail({ children, d, dist, count, running, reduce }: InnerProps) {
  const time = useMotionValue(0);
  useRunningFrame(!!running && !reduce, (delta) => time.set(time.get() + Math.min(delta, 64) / 1000));
  if (reduce) return <span className="inline-block">{children}</span>;
  const n = Math.max(2, count ?? 6);
  return (
    <span className="inline-grid place-items-center">
      {Array.from({ length: n }, (_, j) => {
        const i = n - 1 - j; // Trail copies are drawn first, the main element last on top
        return (
          <TrailCopy key={i} time={time} lag={i * d * 0.035} d={d} amp={dist / 2} index={i} total={n}>
            {children}
          </TrailCopy>
        );
      })}
    </span>
  );
}

function TrailCopy({
  time,
  lag,
  d,
  amp,
  index,
  total,
  children,
}: {
  time: MotionValue<number>;
  lag: number;
  d: number;
  amp: number;
  index: number;
  total: number;
  children?: ReactNode;
}) {
  const x = useTransform(time, (t) => amp * Math.sin(((t - lag) / d) * Math.PI * 2));
  const y = useTransform(time, (t) => amp * 0.35 * Math.sin(((t - lag) / d) * Math.PI * 4));
  const fade = 1 - index / total;
  return (
    <motion.span
      aria-hidden={index > 0 || undefined}
      className={cn(cell, "inline-block")}
      style={{ x, y, opacity: index === 0 ? 1 : fade * fade * 0.55, scale: 1 - index * 0.05 }}
    >
      {children}
    </motion.span>
  );
}

// 024 Impact shake: the child slams down and the whole container shakes the moment it lands
function ImpactShake({ children, d, delay, dist, k, reduce }: InnerProps) {
  if (reduce) return <span className="inline-block">{children}</span>;
  const times = [0, 0.4, 0.52, 0.64, 1];
  return (
    <motion.span
      className="inline-block"
      animate={{
        x: [0, 0, -8 * k, 7 * k, -5 * k, 3 * k, -1.5 * k, 0],
        y: [0, 0, 4 * k, -3 * k, 2 * k, -1 * k, 0, 0],
      }}
      transition={{ duration: d, delay, times: [0, 0.4, 0.48, 0.56, 0.66, 0.76, 0.88, 1], ease: "linear" }}
    >
      <motion.span
        className="inline-block"
        style={{ transformOrigin: "50% 100%" }}
        initial={{ y: -dist, opacity: 0 }}
        animate={{
          y: [-dist, 0, -0.06 * dist, 0, 0],
          opacity: [0, 1, 1, 1, 1],
          scaleY: [1.08, 1 - 0.22 * k, 1 + 0.05 * k, 1, 1],
          scaleX: [0.94, 1 + 0.18 * k, 1 - 0.03 * k, 1, 1],
        }}
        transition={{ duration: d, delay, times, ease: ["easeIn", "easeOut", "easeIn", "linear"] }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

// 121 Anticipation: pulls back the opposite way and crouches to build energy, then bursts out
function Anticipation({ children, d, delay, dist, k, reduce }: InnerProps) {
  if (reduce) return <span className="inline-block">{children}</span>;
  const h = dist / 2;
  const back = dist * 0.16 * k;
  return (
    <motion.span
      className="inline-block"
      style={{ transformOrigin: "50% 100%" }}
      initial={{ x: -h }}
      animate={{
        x: [-h, -h - back, -h - back, 0, h + dist * 0.04 * k, h],
        scaleX: [1, 1 + 0.08 * k, 1 + 0.16 * k, 1 + 0.35 * k, 1 - 0.05 * k, 1],
        scaleY: [1, 1 - 0.06 * k, 1 - 0.18 * k, 1 - 0.22 * k, 1 + 0.04 * k, 1],
        rotate: [0, -4 * k, -6 * k, 5 * k, 0, 0],
      }}
      transition={{
        duration: d,
        delay,
        times: [0, 0.3, 0.46, 0.6, 0.76, 1],
        ease: ["easeOut", "easeInOut", "easeIn", "easeOut", "easeInOut"],
      }}
    >
      {children}
    </motion.span>
  );
}

/** An appendage attached above the subject (pivot at the bottom) */
function WithTrailing({ trailing, rotate, children }: { trailing: ReactNode; rotate?: Partial<FollowKeys>; children?: ReactNode }) {
  return (
    <span className="relative inline-block">
      <span className="absolute bottom-[85%] left-1/2 -translate-x-1/2">
        <motion.span
          aria-hidden="true"
          className="inline-block"
          style={{ transformOrigin: "50% 100%" }}
          animate={rotate?.animate}
          transition={rotate?.transition}
        >
          {trailing}
        </motion.span>
      </span>
      {children}
    </span>
  );
}

interface FollowKeys {
  animate: { rotate: number[] };
  transition: { duration: number; delay: number; times: number[]; ease: Easing };
}

// 122 Follow-through: the subject stops suddenly while the appendage (or the subject's upper half) keeps swinging before it settles
function FollowThrough({ children, d, delay, dist, k, trailing, reduce }: InnerProps) {
  if (reduce) {
    return trailing ? <WithTrailing trailing={trailing}>{children}</WithTrailing> : <span className="inline-block">{children}</span>;
  }
  const h = dist / 2;
  const times = [0, 0.15, 0.5, 0.58, 0.68, 0.78, 0.87, 0.94, 1];
  const swing = [0, -10, -16, 30, -20, 12, -6, 2, 0].map((v) => v * k);
  const move = (
    <motion.span
      className="inline-block"
      initial={{ x: -h }}
      animate={{ x: [-h, -0.8 * h, h, h] }}
      transition={{ duration: d, delay, times: [0, 0.15, 0.5, 1], ease: ["easeIn", "linear", "linear"] }}
    >
      {trailing ? (
        <WithTrailing
          trailing={trailing}
          rotate={{ animate: { rotate: swing }, transition: { duration: d, delay, times, ease: "easeInOut" } }}
        >
          {children}
        </WithTrailing>
      ) : (
        <motion.span
          className="inline-block"
          style={{ transformOrigin: "50% 100%" }}
          animate={{ skewX: swing.map((v) => v * 0.45) }}
          transition={{ duration: d, delay, times, ease: "easeInOut" }}
        >
          {children}
        </motion.span>
      )}
    </motion.span>
  );
  return move;
}

// 123 Bounce: after landing, each bounce is lower than the last until it stops
function Bounce({ children, d, delay, dist, k, count, reduce }: InnerProps) {
  if (reduce) return <span className="inline-block">{children}</span>;
  const n = Math.max(1, count ?? 3);
  const restitution = Math.min(0.7, Math.max(0.2, 0.42 * k));
  const ys = [-dist, 0];
  const segs = [1];
  const ease: Easing[] = ["easeIn"];
  let hgt = 1;
  for (let i = 0; i < n; i++) {
    hgt *= restitution;
    const s = Math.sqrt(hgt);
    ys.push(-dist * hgt, 0);
    segs.push(s, s);
    ease.push("easeOut", "easeIn");
  }
  const total = segs.reduce((a, b) => a + b, 0);
  const times = [0];
  segs.reduce((acc, s) => {
    times.push((acc + s) / total);
    return acc + s;
  }, 0);
  return (
    <motion.span
      className="inline-block"
      initial={{ y: -dist }}
      animate={{ y: ys }}
      transition={{ duration: d, delay, times, ease }}
    >
      {children}
    </motion.span>
  );
}

// 124 Jitter: small irregular shaking that never stops (pivot at the top edge, like a bell)
function Wiggle({ children, d, k, running }: InnerProps) {
  const rot = [0, -9, 7, -11, 5, -4, 10, -6, 3, 0].map((v) => v * k);
  const xs = [0, 1, -1, 1.5, -1, 0.5, -1.5, 1, 0, 0].map((v) => v * k);
  return (
    <motion.span
      className="inline-block"
      style={{ transformOrigin: "50% 10%" }}
      animate={running ? { rotate: rot, x: xs } : { rotate: 0, x: 0 }}
      transition={running ? { duration: d, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
    >
      {children}
    </motion.span>
  );
}

// 125 Pulse: a double heartbeat that sends a ring spreading outward
function Pulse({ children, d, k, color, running }: InnerProps) {
  const loop = { duration: d, repeat: Infinity, ease: "easeOut" as const };
  return (
    <span className="relative inline-grid place-items-center">
      {[0, 0.12].map((lag) => (
        <motion.span
          key={lag}
          aria-hidden="true"
          className={cn(cell, "pointer-events-none size-full rounded-full border-2")}
          style={{ borderColor: color }}
          initial={{ opacity: 0, scale: 1 }}
          animate={running ? { scale: [1, 1.5 + 0.4 * k], opacity: [0.6, 0] } : { opacity: 0, scale: 1 }}
          transition={running ? { ...loop, delay: lag * d, repeatDelay: 0 } : { duration: 0.2 }}
        />
      ))}
      <motion.span
        className={cn(cell, "inline-block")}
        animate={running ? { scale: [1, 1 + 0.16 * k, 1, 1 + 0.1 * k, 1, 1] } : { scale: 1 }}
        transition={running ? { ...loop, times: [0, 0.1, 0.22, 0.32, 0.46, 1] } : { duration: 0.2 }}
      >
        {children}
      </motion.span>
    </span>
  );
}

// 127 Ping-pong: travels to one end, then returns along the same path like a rewind, repeatedly
function PingPong({ children, d, dist, ease = "inOut", running }: InnerProps) {
  const h = dist / 2;
  return (
    <motion.span
      className="inline-block"
      initial={{ x: -h }}
      animate={running ? { x: [-h, h] } : { x: -h }}
      transition={running ? { duration: d, repeat: Infinity, repeatType: "reverse", ease: toEase(ease) } : { duration: 0.4 }}
    >
      {children}
    </motion.span>
  );
}

// 128 Stop motion: about 8 frames per second, each frame slightly off in position and angle, leaving a faint ghost of the previous two frames
function StopMotion({ children, d, dist, k, running, reduce }: InnerProps) {
  const fps = 8;
  const frames = Math.max(4, Math.round(d * fps));
  const [f, setF] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setF((v) => (v + 1) % frames), 1000 / fps);
    return () => clearInterval(id);
  }, [running, frames]);
  if (reduce) return <span className="inline-block">{children}</span>;

  const pose = (i: number): CSSProperties => {
    const u = i / frames;
    const x = -dist / 2 + dist * u + (rand(i, 1) - 0.5) * 10 * k;
    const y = -Math.abs(Math.sin(u * Math.PI * 3)) * dist * 0.25 + (rand(i, 2) - 0.5) * 9 * k;
    const r = (rand(i, 3) - 0.5) * 17 * k;
    const s = 1 + (rand(i, 4) - 0.5) * 0.1 * k;
    return { transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})` };
  };
  const ghosts = [
    { i: (f - 2 + frames) % frames, o: 0.12 },
    { i: (f - 1 + frames) % frames, o: 0.28 },
  ];
  return (
    <span className="inline-grid place-items-center">
      {running &&
        ghosts.map((g) => (
          <span key={g.o} aria-hidden="true" className={cn(cell, "inline-block")} style={{ ...pose(g.i), opacity: g.o }}>
            {children}
          </span>
        ))}
      <span className={cn(cell, "inline-block")} style={pose(f)}>
        {children}
      </span>
    </span>
  );
}

// 134 Repeater: copies the child into a ring, each copy offset slightly in time for rotation and pulsing
function RepeaterFx({ children, d, dist, k, count, running }: InnerProps) {
  const n = Math.max(2, count ?? 8);
  return (
    <span className="inline-grid place-items-center" style={{ padding: dist }}>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          aria-hidden={i > 0 || undefined}
          className={cn(cell, "inline-block")}
          style={{ transform: `rotate(${(i * 360) / n}deg) translateY(${-dist}px)` }}
        >
          <motion.span
            className="inline-block"
            animate={running ? { scale: [1, 1 + 0.25 * k, 1], rotate: [0, 30 * k, 0] } : { scale: 1, rotate: 0 }}
            transition={running ? { duration: d, repeat: Infinity, ease: "easeInOut", delay: (i * d) / n } : { duration: 0.3 }}
          >
            {children}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// 135 Kaleidoscope: eight-way mirrored copies rotate together and spread from the center as if breathing
function KaleidoscopeFx({ children, d, dist, k, count, running }: InnerProps) {
  const n = Math.max(4, Math.round((count ?? 8) / 2) * 2);
  return (
    <span className="inline-grid place-items-center" style={{ padding: dist * 1.2 }}>
      <motion.span
        className={cn(cell, "inline-grid place-items-center")}
        animate={running ? { rotate: [0, 360] } : undefined}
        transition={running ? { duration: d, repeat: Infinity, ease: "linear" } : undefined}
      >
        {Array.from({ length: n }, (_, i) => (
          <span
            key={i}
            aria-hidden={i > 0 || undefined}
            className={cn(cell, "inline-block")}
            style={{ transform: `rotate(${(i * 360) / n}deg)${i % 2 ? " scaleX(-1)" : ""}` }}
          >
            <motion.span
              className="inline-block"
              initial={{ y: -dist }}
              animate={running ? { y: [-dist, -dist * (1 - 0.55 * k), -dist] } : { y: -dist }}
              transition={running ? { duration: d / 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
            >
              {children}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </span>
  );
}

// 136 Line boil: the SVG noise displacement changes every few frames, so a still drawing looks hand-drawn frame by frame
function LineBoil({ children, d, k, running, reduce }: InnerProps) {
  const id = `boil-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setFrame((v) => (v + 1) % 4), Math.max(40, d * 1000));
    return () => clearInterval(t);
  }, [running, d]);
  if (reduce) return <span className="inline-block">{children}</span>;
  return (
    <span className="relative inline-block">
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={frame * 7 + 3} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={3.5 * k} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <span className="inline-block" style={{ filter: `url(#${id})` }}>
        {children}
      </span>
    </span>
  );
}

/** Layered drawing: progress 0 is assembled, 1 is fully exploded */
function Layers({
  layers,
  axis,
  gap,
  progress,
  animate,
}: {
  layers: ReactNode[];
  axis: ExplodeAxis;
  gap: number;
  progress: number;
  animate?: { d: number; delay: number };
}) {
  const n = layers.length;
  const z = axis === "z";
  return (
    <span
      className="inline-grid place-items-center"
      style={z ? { transform: "rotateX(55deg) rotateZ(-38deg)", transformStyle: "preserve-3d" } : undefined}
    >
      {layers.map((layer, i) => {
        const off = z ? i * gap : (i - (n - 1) / 2) * gap;
        const key = z ? "z" : axis;
        const target = animate ? { [key]: [0, off, off, 0] } : { [key]: off * progress };
        return (
          <motion.span
            key={i}
            className={cn(cell, "inline-block")}
            style={z ? { transformStyle: "preserve-3d" } : undefined}
            initial={false}
            animate={target}
            transition={
              animate
                ? { duration: animate.d, delay: animate.delay, times: [0, 0.35, 0.65, 1], ease: "easeInOut" }
                : { duration: 0 }
            }
          >
            {layer}
          </motion.span>
        );
      })}
    </span>
  );
}

// 143 Exploded view: children become layers that separate along an axis and then reassemble
function Exploded({ children, d, delay, dist, axis, reduce }: InnerProps) {
  const layers = Children.toArray(children);
  return <Layers layers={layers} axis={axis} gap={dist} progress={0} animate={reduce ? undefined : { d, delay }} />;
}

const staggerItem: Variants = {
  hidden: (c: { y: number }) => ({ opacity: 0, y: c.y }),
  show: (c: { d: number; at: number }) => ({ opacity: 1, y: 0, transition: { duration: c.d, delay: c.at, ease: [0.2, 0.7, 0.3, 1] } }),
};

// 002 Stagger: each child enters in sequence
function StaggerInner({ children, d, delay, dist, reduce }: InnerProps) {
  return (
    <span className="contents">
      {Children.toArray(children).map((child, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={staggerItem}
          custom={{ y: dist, d, at: delay + i * d * 0.18 }}
          initial={reduce ? false : "hidden"}
          animate="show"
        >
          {child}
        </motion.span>
      ))}
    </span>
  );
}

const renderers: Record<MotionPrincipleName, (p: InnerProps) => ReactNode> = {
  burst: Burst,
  easing: EasingMove,
  overshoot: Overshoot,
  "squash-stretch": SquashStretch,
  "motion-trail": MotionTrail,
  "impact-shake": ImpactShake,
  anticipation: Anticipation,
  "follow-through": FollowThrough,
  bounce: Bounce,
  wiggle: Wiggle,
  pulse: Pulse,
  "ping-pong": PingPong,
  "stop-motion": StopMotion,
  repeater: RepeaterFx,
  kaleidoscope: KaleidoscopeFx,
  "line-boil": LineBoil,
  "exploded-view": Exploded,
  stagger: StaggerInner,
};

/* ---------- individual exports ---------- */

type Shared = Omit<MotionPrincipleProps, "effect">;

/** 002 Staggered entrance: lists, cards and bar charts appear one by one. With as="ul" / "ol" each item is wrapped in an li */
export function Stagger({
  children,
  as = "div",
  stagger = 0.08,
  duration = 0.5,
  delay = 0,
  distance = 16,
  trigger = "inView",
  className,
  itemClassName,
}: {
  children?: ReactNode;
  as?: "div" | "ul" | "ol" | "span";
  /** Interval between items in seconds */
  stagger?: number;
  duration?: number;
  delay?: number;
  /** Distance (px) each item slides up from */
  distance?: number;
  trigger?: Exclude<MotionPrincipleTrigger, "hover">;
  className?: string;
  itemClassName?: string;
}) {
  const t = useTrigger(trigger, false, delay + duration + stagger * Children.count(children) + 1.5);
  const Box = motion[as] as typeof motion.div;
  const Item = (as === "ul" || as === "ol" ? motion.li : as === "span" ? motion.span : motion.div) as typeof motion.div;
  return (
    <Box ref={t.ref as RefObject<HTMLDivElement>} className={className} onClick={t.handlers.onClick}>
      {Children.toArray(children).map((child, i) => (
        <Item
          key={`${t.cycle}-${i}`}
          className={itemClassName}
          variants={staggerItem}
          custom={{ y: distance, d: duration, at: delay + i * stagger }}
          initial={t.reduce ? false : "hidden"}
          animate={t.reduce || t.play ? "show" : "hidden"}
        >
          {child}
        </Item>
      ))}
    </Box>
  );
}

/** 143 Exploded view: each child is a layer, the first one at the bottom */
export function ExplodedView(props: Shared) {
  return <MotionPrinciple {...props} effect="exploded-view" />;
}

/** 134 Repeater: copies the child into a ring */
export function Repeater(props: Shared) {
  return <MotionPrinciple trigger="loop" {...props} effect="repeater" />;
}

/** 135 Kaleidoscope: the child (or an image) is mirrored eight ways and rotated */
export function Kaleidoscope(props: Shared) {
  return <MotionPrinciple trigger="loop" {...props} effect="kaleidoscope" />;
}
