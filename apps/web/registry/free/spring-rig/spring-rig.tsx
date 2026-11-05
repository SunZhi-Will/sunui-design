"use client";

import { useInView, useReducedMotion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Springs                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * How a channel moves toward its goal. Spring feels use tension and friction
 * (mass 1); `fall` accelerates at a constant rate and bounces when it lands.
 * Channels are unitless, so the same feel works for an angle or a lift.
 */
export const springFeels = {
  default: { tension: 170, friction: 26 },
  gentle: { tension: 120, friction: 14 },
  wobbly: { tension: 180, friction: 12 },
  stiff: { tension: 210, friction: 20 },
  slow: { tension: 280, friction: 60 },
  snappy: { tension: 420, friction: 30 },
  fall: { gravity: 34, bounce: 0.3 },
} as const;

export type SpringFeelName = keyof typeof springFeels;
type SpringFeel = { tension: number; friction: number } | { gravity: number; bounce: number };

/** Smoothstep: 0 below `from`, 1 above `to`, an eased ramp between. */
export function ramp(value: number, from: number, to: number) {
  const k = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return k * k * (3 - 2 * k);
}

const clamp = (v: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, v));

/* -------------------------------------------------------------------------- */
/* Rigs                                                                       */
/* -------------------------------------------------------------------------- */

/** What a rig sees on every frame. Coordinates are in the 120 x 120 viewBox. */
export type RigPointer = {
  /** The pointer (or the autoplay ghost) is over the drawing. */
  on: boolean;
  /** A button or finger is down. */
  pressed: boolean;
  /** Milliseconds since the pointer arrived (0 when off). */
  t: number;
  /** Milliseconds since the pointer left (0 while on). */
  out: number;
  x: number;
  y: number;
  /** Smoothed pointer velocity, viewBox units per second. */
  vx: number;
  vy: number;
  /** Current channel values, for goals that depend on the pose (aiming, reach). */
  at: readonly number[];
  /** 1 when the pointer is on (px, py), easing to 0 at `radius` away. */
  near: (px: number, py: number, radius: number) => number;
  ramp: typeof ramp;
};

export type RigGoal = number[] | { goal: number[]; feel?: (SpringFeelName | undefined)[] };

/**
 * A drawing with springs inside. `rig` turns the pointer into one goal per
 * channel; every channel springs toward its goal with its own feel; `draw`
 * turns the current channel values into SVG. Define rigs outside components.
 */
export type Rig = {
  channels: number;
  feel?: SpringFeelName | SpringFeelName[];
  /** Accessible name for the drawing. */
  label: string;
  rig: (p: RigPointer) => RigGoal;
  draw: (at: readonly number[]) => ReactNode;
};

/** Identity helper that types a custom rig. */
export const defineRig = (rig: Rig) => rig;

/* Shopping bag: leans toward the pointer, handles swing with its speed,
   hops when the pointer arrives, squashes on press. */
const bag = defineRig({
  channels: 4,
  label: "Shopping bag",
  feel: ["wobbly", "wobbly", "snappy", "snappy"],
  rig: (p) => {
    if (!p.on) return { goal: [0, 0, 0, 0], feel: [undefined, undefined, "snappy", "fall"] };
    const hop = p.t < 140 ? 1 : 0;
    return {
      goal: [clamp((p.x - 60) / 60), clamp(-p.vx / 160), p.pressed ? 1 : 0, hop],
      feel: [undefined, undefined, undefined, hop ? "snappy" : "fall"],
    };
  },
  draw: ([lean, swing, squash, hop]) => (
    <>
      <ellipse cx={60} cy={103} rx={28 - hop * 8} ry={3} opacity={0.3} />
      <g transform={`translate(0 ${-hop * 12}) rotate(${lean * 8} 60 100) translate(60 100) scale(${1 + squash * 0.08} ${1 - squash * 0.12}) translate(-60 -100)`}>
        <g transform={`rotate(${swing * 26} 60 50)`}>
          <path d="M47 50 C47 31 73 31 73 50" />
        </g>
        <path d="M34 50 H86 L90 100 H30 Z" className="fill-background" />
        <path d="M34 58 H86" opacity={0.5} />
        <circle cx={47} cy={50} r={1.6} />
        <circle cx={73} cy={50} r={1.6} />
        <g data-accent="">
          <path d="M60 86 C52 80 50 75 54 72 C57 70 60 73 60 75 C60 73 63 70 66 72 C70 75 68 80 60 86 Z" />
        </g>
      </g>
    </>
  ),
});

/* Price tag on a string: a pendulum pushed by the pointer's speed.
   Press to pull it down; it springs back on release. */
const tag = defineRig({
  channels: 2,
  label: "Price tag",
  feel: ["wobbly", "snappy"],
  rig: (p) => {
    if (!p.on) return { goal: [0, 0], feel: [undefined, "wobbly"] };
    const push = clamp(p.vx / 90 + (p.x - 60) / 140, -1.2, 1.2);
    return { goal: [push, p.pressed ? 1 : 0], feel: [undefined, p.pressed ? "snappy" : "wobbly"] };
  },
  draw: ([angle, pull]) => {
    const drop = pull * 10;
    return (
      <>
        <g transform={`rotate(${-angle * 32} 60 14)`}>
          <path d={`M60 14 L60 ${42 + drop}`} />
          <g transform={`translate(0 ${drop})`}>
            <path d="M60 38 L77 52 V96 Q77 100 73 100 H47 Q43 100 43 96 V52 Z" className="fill-background" />
            <circle cx={60} cy={50} r={3} />
            <g data-accent="">
              <circle cx={53} cy={68} r={3.5} />
              <circle cx={67} cy={84} r={3.5} />
              <path d="M69 64 L51 88" />
            </g>
          </g>
        </g>
        <circle cx={60} cy={14} r={2.5} className="fill-background" />
      </>
    );
  },
});

/* Gift box: the lid pops when the pointer arrives, stays ajar while it is
   near, leans toward it, and falls back with a bounce when it leaves. */
const box = defineRig({
  channels: 3,
  label: "Gift box",
  feel: ["snappy", "wobbly", "snappy"],
  rig: (p) => {
    if (!p.on) return { goal: [0, 0, 0], feel: ["fall", undefined, "snappy"] };
    const pop = p.t < 130 || p.pressed;
    const ajar = 0.25 + p.near(60, 52, 40) * 0.35;
    return {
      goal: [pop ? 1 : ajar, clamp((p.x - 60) / 60), p.pressed ? 1 : p.t < 130 ? 0.6 : 0],
      feel: [pop ? "snappy" : "wobbly"],
    };
  },
  draw: ([lid, tilt, squash]) => (
    <>
      <ellipse cx={60} cy={103} rx={30} ry={3} opacity={0.3} />
      <g data-accent="" opacity={ramp(lid, 0.45, 0.95)}>
        <path d="M60 46 V36 M46 48 L40 40 M74 48 L80 40" />
      </g>
      <g transform={`translate(60 100) scale(${1 + squash * 0.06} ${1 - squash * 0.1}) translate(-60 -100)`}>
        <rect x={33} y={62} width={54} height={38} rx={2} className="fill-background" />
        <path d="M60 62 V100" data-accent="" />
      </g>
      <g transform={`translate(0 ${-lid * 22 + squash * 4}) rotate(${tilt * lid * 16} 60 62)`}>
        <rect x={29} y={50} width={62} height={12} rx={2} className="fill-background" />
        <g data-accent="">
          <path d="M60 50 V62" />
          <path d="M60 50 C50 38 43 47 60 50 C77 47 70 38 60 50 Z" />
        </g>
      </g>
    </>
  ),
});

/* Desk lamp: the arm leans toward the pointer and the shade aims at it.
   The light switches on while the pointer is over the drawing. */
function lampPose(arm: number, head: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a1 = rad(-90 + arm * 26);
  const elbow = [60 + 38 * Math.cos(a1), 98 + 38 * Math.sin(a1)] as const;
  const a2 = a1 + rad(58 - arm * 12);
  const joint = [elbow[0] + 32 * Math.cos(a2), elbow[1] + 32 * Math.sin(a2)] as const;
  const h = rad(60 + head * 70);
  return { elbow, joint, h };
}

const lamp = defineRig({
  channels: 3,
  label: "Desk lamp",
  feel: ["gentle", "default", "snappy"],
  rig: (p) => {
    if (!p.on) return { goal: [0, 0, 0], feel: [undefined, undefined, "stiff"] };
    const { joint } = lampPose(p.at[0] ?? 0, p.at[1] ?? 0);
    const aim = (Math.atan2(p.y - joint[1], p.x - joint[0]) * 180) / Math.PI;
    return [clamp((p.x - 60) / 60), clamp((aim - 60) / 70, -1.6, 1.4), 1];
  },
  draw: ([arm, head, light]) => {
    const { elbow, joint, h } = lampPose(arm, head);
    const dir = [Math.cos(h), Math.sin(h)];
    const perp = [-dir[1], dir[0]];
    const mouth = [joint[0] + dir[0] * 14, joint[1] + dir[1] * 14];
    const pt = (base: readonly number[], along: number, side: number) =>
      `${base[0] + dir[0] * along + perp[0] * side} ${base[1] + dir[1] * along + perp[1] * side}`;
    const ray = (spread: number, len: number) => {
      const a = h + (spread * Math.PI) / 180;
      return `M${mouth[0] + Math.cos(a) * 4} ${mouth[1] + Math.sin(a) * 4} L${mouth[0] + Math.cos(a) * len} ${mouth[1] + Math.sin(a) * len}`;
    };
    return (
      <>
        <g data-accent="" opacity={light}>
          <path d={`${ray(-22, 22)} ${ray(0, 26)} ${ray(22, 22)}`} />
        </g>
        <path d="M42 102 H78" />
        <path d={`M60 98 L${elbow[0]} ${elbow[1]} L${joint[0]} ${joint[1]}`} />
        <circle cx={60} cy={98} r={3} className="fill-background" />
        <circle cx={elbow[0]} cy={elbow[1]} r={2.5} className="fill-background" />
        <path
          d={`M${pt(joint, 0, -4)} L${pt(joint, 14, -10)} L${pt(joint, 14, 10)} L${pt(joint, 0, 4)} Z`}
          className="fill-background"
        />
        <circle cx={joint[0]} cy={joint[1]} r={2.5} className="fill-background" />
      </>
    );
  },
});

/* Card stack: three cards fan out one after another when the pointer
   arrives, and the card under the pointer lifts. */
const CARD_ORDER = [0, 2, 1];
function cardPose(i: number, fan: number, lift: number) {
  const angle = (i - 1) * fan * 18;
  const rad = (angle * Math.PI) / 180;
  const cx = 60 + Math.sin(rad) * 38;
  const cy = 104 - Math.cos(rad) * 38 - lift * 8;
  return { angle, cx, cy };
}

const cards = defineRig({
  channels: 6,
  label: "Card stack",
  feel: ["wobbly", "wobbly", "wobbly", "snappy", "snappy", "snappy"],
  rig: (p) => {
    if (!p.on) return [0, 0, 0, 0, 0, 0];
    const fan = [0, 1, 2].map((i) => (p.t > i * 70 ? 1 : 0));
    const lift = [0, 1, 2].map((i) => {
      const { cx, cy } = cardPose(i, p.at[i] ?? 0, p.at[i + 3] ?? 0);
      return p.near(cx, cy, 22) * (p.pressed ? 1.6 : 1);
    });
    return [...fan, ...lift];
  },
  draw: (at) => (
    <>
      <ellipse cx={60} cy={106} rx={30} ry={3} opacity={0.3} />
      {CARD_ORDER.map((i) => {
        const { angle } = cardPose(i, at[i] ?? 0, 0);
        const lift = at[i + 3] ?? 0;
        return (
          <g key={i} transform={`rotate(${angle} 60 104) translate(0 ${-lift * 8})`}>
            <rect x={41} y={34} width={38} height={60} rx={5} className="fill-background" />
            <path d="M48 76 H66 M48 83 H60" opacity={0.6} />
            {i === 1 ? (
              <g data-accent="">
                <circle cx={60} cy={54} r={8} />
                <path d="M56 54 L59 57 L64 51" />
              </g>
            ) : (
              <circle cx={60} cy={54} r={8} opacity={0.6} />
            )}
          </g>
        );
      })}
    </>
  ),
});

/** The ready-made drawings. Pick one with the `preset` prop. */
export const springRigs = { bag, tag, box, lamp, cards } as const;
export type SpringRigPreset = keyof typeof springRigs;
export const springRigPresets = Object.keys(springRigs) as SpringRigPreset[];

/* -------------------------------------------------------------------------- */
/* Motion state                                                               */
/* -------------------------------------------------------------------------- */

type Motion = {
  rig: Rig;
  at: number[];
  speed: number[];
  goal: number[];
  base: SpringFeel[];
  feel: SpringFeel[];
  on: boolean;
  pressed: boolean;
  since: number;
  left: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  seen: boolean;
  stamp: number;
};

const feelsOf = (rig: Rig): SpringFeel[] => {
  const names = Array.isArray(rig.feel) ? rig.feel : Array(rig.channels).fill(rig.feel ?? "default");
  return Array.from({ length: rig.channels }, (_, i) => springFeels[(names[i] as SpringFeelName) ?? "default"]);
};

function goalsOf(m: Motion, now: number) {
  const out = m.rig.rig({
    on: m.on,
    pressed: m.pressed,
    t: m.on ? now - m.since : 0,
    out: m.on ? 0 : now - m.left,
    x: m.x,
    y: m.y,
    vx: m.vx,
    vy: m.vy,
    at: m.at,
    near: (px, py, radius) => (m.on ? 1 - ramp(Math.hypot(m.x - px, m.y - py), 0, radius) : 0),
    ramp,
  });
  const goal = Array.isArray(out) ? out : out.goal;
  const feel = Array.isArray(out) ? undefined : out.feel;
  for (let i = 0; i < m.rig.channels; i++) {
    m.goal[i] = goal[i] ?? 0;
    const name = feel?.[i];
    m.feel[i] = name ? springFeels[name] : m.base[i];
  }
}

function createMotion(rig: Rig): Motion {
  const base = feelsOf(rig);
  const zeros = Array<number>(rig.channels).fill(0);
  const m: Motion = {
    rig,
    at: zeros.slice(),
    speed: zeros.slice(),
    goal: zeros.slice(),
    base,
    feel: base.slice(),
    on: false,
    pressed: false,
    since: 0,
    left: -1e9,
    x: 60,
    y: 60,
    vx: 0,
    vy: 0,
    seen: false,
    stamp: 0,
  };
  goalsOf(m, 0);
  m.at = m.goal.slice();
  return m;
}

/** Advance one channel by dt seconds. Returns true once it rests on its goal. */
function step(m: Motion, i: number, dt: number) {
  const feel = m.feel[i];
  const goal = m.goal[i];
  if ("gravity" in feel) {
    const gap = goal - m.at[i];
    if (Math.abs(gap) < 0.001 && Math.abs(m.speed[i]) < Math.max(0.4, feel.gravity * dt)) {
      m.at[i] = goal;
      m.speed[i] = 0;
      return true;
    }
    m.speed[i] += Math.sign(gap || -m.speed[i]) * feel.gravity * dt;
    const next = m.at[i] + m.speed[i] * dt;
    if (gap !== 0 && Math.sign(goal - next) !== Math.sign(gap)) {
      m.at[i] = goal;
      m.speed[i] = -m.speed[i] * feel.bounce;
    } else {
      m.at[i] = next;
    }
    return false;
  }
  // Fixed 1 ms substeps keep stiff springs stable at any frame rate.
  for (let s = 0; s < dt; s += 0.001) {
    const h = Math.min(0.001, dt - s);
    m.speed[i] += (-feel.tension * (m.at[i] - goal) - feel.friction * m.speed[i]) * h;
    m.at[i] += m.speed[i] * h;
  }
  if (Math.abs(m.at[i] - goal) < 0.001 && Math.abs(m.speed[i]) < 0.001) {
    m.at[i] = goal;
    m.speed[i] = 0;
    return true;
  }
  return false;
}

function point(m: Motion, x: number, y: number, now: number) {
  if (m.seen) {
    const dt = Math.max(1, now - m.stamp) / 1000;
    const k = Math.min(1, 12 * dt);
    m.vx += ((x - m.x) / dt - m.vx) * k;
    m.vy += ((y - m.y) / dt - m.vy) * k;
  }
  m.x = x;
  m.y = y;
  m.stamp = now;
  m.seen = true;
}

function enter(m: Motion, now: number) {
  if (!m.on) {
    m.on = true;
    m.since = now;
  }
}

function leave(m: Motion, now: number) {
  if (m.on) {
    m.on = false;
    m.pressed = false;
    m.left = now;
    m.seen = false;
    m.vx = 0;
    m.vy = 0;
  }
}

/* Autoplay: a ghost pointer that comes in from the lower left, draws a
   figure eight over the drawing, leaves to the upper right, then waits. */
const SHOW = { arrive: 600, wander: 2800, depart: 450, away: 1600 };
const SHOW_PERIOD = SHOW.arrive + SHOW.wander + SHOW.depart + SHOW.away;

function ghostAt(time: number): [number, number] | null {
  const o = ((time % SHOW_PERIOD) + SHOW_PERIOD) % SHOW_PERIOD;
  const loop = (s: number): [number, number] => {
    const a = (2 * Math.PI * s) / SHOW.wander;
    return [60 + 30 * Math.sin(a), 62 + 12 * Math.sin(2 * a)];
  };
  if (o < SHOW.arrive) {
    const e = 1 - (1 - o / SHOW.arrive) ** 3;
    return [10 + 50 * e, 100 - 38 * e];
  }
  if (o < SHOW.arrive + SHOW.wander) return loop(o - SHOW.arrive);
  if (o < SHOW.arrive + SHOW.wander + SHOW.depart) {
    const [sx, sy] = loop(SHOW.wander);
    const e = ((o - SHOW.arrive - SHOW.wander) / SHOW.depart) ** 2;
    return [sx + (112 - sx) * e, sy + (20 - sy) * e];
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export type SpringRigProps = {
  /** Which ready-made drawing to show. Default "bag". Ignored when `rig` is set. */
  preset?: SpringRigPreset;
  /** Your own rig, made with `defineRig`. Define it outside the component. */
  rig?: Rig;
  /** Play by itself with a ghost pointer while on screen. A real pointer takes over. Default false. */
  autoplay?: boolean;
  /** Line width in viewBox units (the drawing is 120 wide). Default 1.5. */
  strokeWidth?: number;
  /** Accessible name. Defaults to the rig's label. Pass "" to mark it decorative. */
  label?: string;
  /** Colour of the accent strokes (any CSS colour or var(--token)). Default: the theme's primary colour. */
  accent?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * An SVG drawing driven by springs: point at it and its parts lean, swing,
 * pop and bounce, each with its own spring. Taps work the same on touch.
 * With reduced motion it draws its resting pose and does not move.
 */
export function SpringRig({
  preset = "bag",
  rig: customRig,
  autoplay = false,
  strokeWidth = 1.5,
  label,
  accent,
  className,
  style,
}: SpringRigProps) {
  const rig = customRig ?? springRigs[preset];
  const reduce = useReducedMotion() ?? false;
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(wrapRef, { margin: "80px" });
  const [pageVisible, setPageVisible] = useState(true);
  const [, setFrame] = useState(0);

  const motion = useMemo(() => createMotion(rig), [rig]);
  const loop = useRef({ raf: 0, last: 0, real: false, ghostFrom: 0, autoplay: false });

  const playing = autoplay && inView && pageVisible && !reduce;

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const tick = (now: number) => {
    const l = loop.current;
    const m = motion;
    const dt = Math.min(Math.max(now - l.last, 0) / 1000, 1 / 30);
    l.last = now;

    if (l.autoplay && !l.real) {
      const elapsed = now - l.ghostFrom;
      if (elapsed >= 0) {
        const at = ghostAt(elapsed);
        if (at) {
          point(m, at[0], at[1], now);
          enter(m, now);
        } else {
          leave(m, now);
        }
      }
    }

    goalsOf(m, now);
    let settled = true;
    for (let i = 0; i < m.rig.channels; i++) if (!step(m, i, dt)) settled = false;
    setFrame((f) => (f + 1) % 1e6);

    l.raf = m.on || l.autoplay || !settled ? requestAnimationFrame(tick) : 0;
  };

  const wake = () => {
    const l = loop.current;
    if (l.raf) return;
    l.last = performance.now();
    l.raf = requestAnimationFrame(tick);
  };

  // Start and stop autoplay; always cancel the loop on unmount or rig change.
  useEffect(() => {
    const l = loop.current;
    l.autoplay = playing;
    if (playing) {
      l.ghostFrom = performance.now();
      wake();
    } else if (!l.real) {
      leave(motion, performance.now());
      wake();
    }
    return () => {
      cancelAnimationFrame(l.raf);
      l.raf = 0;
    };
    // wake and tick only read refs and the memoised motion
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, motion]);

  const toLocal = (e: ReactPointerEvent) => {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return [p.x, p.y] as const;
  };

  const onMove = (e: ReactPointerEvent) => {
    if (reduce) return;
    const p = toLocal(e);
    if (!p) return;
    loop.current.real = true;
    const now = performance.now();
    point(motion, p[0], p[1], now);
    enter(motion, now);
    wake();
  };

  const onLeave = () => {
    if (reduce) return;
    const l = loop.current;
    const now = performance.now();
    leave(motion, now);
    l.real = false;
    if (l.autoplay) l.ghostFrom = now + SHOW.away;
    wake();
  };

  const onPress = (down: boolean) => (e: ReactPointerEvent) => {
    if (reduce) return;
    if (down) onMove(e);
    motion.pressed = down && motion.on;
    wake();
  };

  const name = label ?? rig.label;
  const drawn = rig.draw(reduce ? motion.goal : motion.at);

  return (
    <div
      ref={wrapRef}
      onPointerEnter={onMove}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerDown={onPress(true)}
      onPointerUp={onPress(false)}
      onPointerCancel={onLeave}
      className={cn(
        "relative aspect-square w-full max-w-48 text-foreground select-none [-webkit-tap-highlight-color:transparent]",
        className,
      )}
      style={style}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "size-full overflow-visible",
          accent ? "[&_[data-accent]]:stroke-(--rig-accent)" : "[&_[data-accent]]:stroke-primary",
        )}
        style={accent ? ({ ["--rig-accent" as string]: accent } as CSSProperties) : undefined}
        role={name ? "img" : undefined}
        aria-label={name || undefined}
        aria-hidden={name ? undefined : true}
      >
        {drawn}
      </svg>
    </div>
  );
}
