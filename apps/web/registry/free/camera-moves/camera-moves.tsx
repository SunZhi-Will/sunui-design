"use client";

import {
  animate,
  isMotionValue,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/**
 * Cinematic camera moves: stacks your own content into layers of a "scene" and applies one camera move through the move prop.
 * Each layer has a depth (0 = farthest background, 1 = nearest foreground). The move computes each layer's offset, scale and blur from its depth,
 * so parallax is correct: pan moves all layers together, dolly moves near layers more, and zoom scales all layers by the same factor.
 *
 * Driven by scroll:
 *   const { scrollYProgress } = useScroll({ target: ref });
 *   <CameraStage move="dolly-zoom" progress={scrollYProgress}>...</CameraStage>
 */
export const cameraMoves = [
  "pan",
  "tilt",
  "dolly-in",
  "zoom-in",
  "tracking",
  "orbit",
  "crane-up",
  "dolly-zoom",
  "rack-focus",
  "handheld",
  "fpv",
  "dutch-angle",
  "pedestal",
  "barrel-roll",
  "steadicam",
  "fly-through",
  "low-angle",
  "high-angle",
  "establishing",
  "extreme-close-up",
  "bullet-time",
] as const;
export type CameraMove = (typeof cameraMoves)[number];

export type CameraTrigger = "loop" | "mount" | "inView" | "hover" | "click";

/** Continuous-shake moves: no start or end, they run on time (progress only acts as intensity) */
export const ambientCameraMoves: readonly CameraMove[] = ["handheld", "steadicam", "fpv"];

/** Default length of each move in seconds; for continuous-shake moves this is one loop period */
export const cameraMoveDurations: Record<CameraMove, number> = {
  pan: 4,
  tilt: 3.5,
  "dolly-in": 3.2,
  "zoom-in": 3,
  tracking: 4,
  orbit: 3.2,
  "crane-up": 3,
  "dolly-zoom": 3.2,
  "rack-focus": 1.8,
  handheld: 4.7,
  fpv: 4.7,
  "dutch-angle": 1.6,
  pedestal: 3,
  "barrel-roll": 3.1,
  steadicam: 4.7,
  "fly-through": 3.2,
  "low-angle": 1.8,
  "high-angle": 1.8,
  establishing: 7,
  "extreme-close-up": 3,
  "bullet-time": 3,
};

/** A full turn ends where it started, so looping joins back to the start without rewinding */
const wrapMoves: readonly CameraMove[] = ["barrel-roll"];

export interface FocusPoint {
  /** 0 to 100, left to right of the frame */
  x: number;
  /** 0 to 100, top to bottom of the frame */
  y: number;
}

/** The virtual camera at one moment. Position is in units where subject distance = 1; yaw and pitch are in frame fractions */
export interface CameraState {
  x: number;
  y: number;
  z: number;
  /** Positive looks right (the image moves left) */
  yaw: number;
  /** Positive looks up (the image moves down) */
  pitch: number;
  /** Frame rotation in degrees */
  roll: number;
  /** Focal length multiplier, 1 = starting focal length */
  f: number;
  /** Orbit angle (rad), used by orbit and bullet-time */
  orbit: number;
  /** Extra 3D tilt per layer (deg), gives low angle, high angle and orbit more depth */
  tiltX: number;
  turnY: number;
  /** Depth-of-field blur (px) */
  blurNear: number;
  blurFar: number;
  blurBg: number;
  /** tracking: the subject follows the camera, so the subject layer is unaffected by lateral movement */
  track: boolean;
}

const REST: CameraState = {
  x: 0,
  y: 0,
  z: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
  f: 1,
  orbit: 0,
  tiltX: 0,
  turnY: 0,
  blurNear: 0,
  blurFar: 0,
  blurBg: 0,
  track: false,
};

const EASE = [0.65, 0, 0.35, 1] as const;
const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const DEG = 180 / Math.PI;

interface CameraInput {
  move: CameraMove;
  /** Progress 0..1 with reverse already applied */
  e: number;
  /** Intensity of continuous-shake moves, 0..1 */
  amp: number;
  /** Clock (seconds) */
  t: number;
  k: number;
  duration: number;
  focus: FocusPoint;
}

/** Computes the camera state from the move name, progress and time. One block per move, independent of each other */
export function computeCamera({ move, e, amp, t, k, duration, focus }: CameraInput): CameraState {
  const c: CameraState = { ...REST };
  const ox = focus.x / 100 - 0.5;
  const oy = focus.y / 100 - 0.5;
  const T = (2 * Math.PI * t) / Math.max(0.1, duration);
  const A = amp * k;
  switch (move) {
    case "pan":
      // Turn left and right in place; all layers shift equally, no parallax
      c.yaw = lerp(-0.07, 0.07, e) * k;
      break;
    case "tilt":
      // Look up from below in place
      c.pitch = lerp(-0.03, 0.09, e) * k;
      break;
    case "dolly-in":
      // The camera walks forward: near layers grow a lot, far layers barely move
      c.z = 0.28 * e * k;
      c.yaw = ox * 0.3 * e;
      c.pitch = -oy * 0.3 * e;
      break;
    case "zoom-in":
      // The camera stays still and only lengthens the focal length: all layers scale equally, overlap is unchanged
      c.f = 1 + 1.2 * e * k;
      c.yaw = ox * e;
      c.pitch = -oy * e;
      break;
    case "tracking":
      // Moves sideways in parallel with the subject: the subject stays centred, background and foreground slide past at different speeds
      c.x = lerp(-0.1, 0.1, e) * k;
      c.track = true;
      break;
    case "orbit":
      // Circles the subject by about ±20°; background and foreground slide in opposite directions
      c.orbit = lerp(-0.35, 0.35, e) * k;
      c.turnY = -c.orbit * DEG * 0.6;
      c.f = 1.05;
      break;
    case "bullet-time":
      // Same orbit as above, but time almost freezes (see useCameraStage().footage)
      c.orbit = lerp(-0.3, 0.3, e) * k;
      c.turnY = -c.orbit * DEG * 0.6;
      c.f = 1.05;
      break;
    case "crane-up":
      // Rises and looks down, keeping the subject in frame while the horizon leaves upward
      c.y = 0.22 * e * k;
      c.z = 0.05 * e * k;
      c.pitch = -0.86 * c.y;
      break;
    case "dolly-zoom": {
      // Pulls back while zooming in proportionally: the subject keeps its size and only the background closes in (Hitchcock's vertigo effect)
      const b = 1.0 * e * k;
      c.z = -b;
      c.f = 1 + b;
      break;
    }
    case "rack-focus":
      // Focus moves from foreground to background: foreground blur 0 → 7px, background 6 → 0px
      c.blurNear = 7 * e * k;
      c.blurFar = 6 * (1 - e) * k;
      c.f = 1 + 0.02 * e;
      break;
    case "handheld":
      // Handheld: several sine waves with different periods added together, fast and irregular
      c.yaw = 0.9 * (0.016 * Math.sin(3 * T) + 0.008 * Math.sin(7 * T + 1) + 0.004 * Math.sin(13 * T + 2)) * A;
      c.pitch = 1.4 * (0.012 * Math.sin(4 * T + 2) + 0.006 * Math.sin(9 * T + 0.5) + 0.003 * Math.sin(17 * T + 1.2)) * A;
      c.roll = (0.02 * Math.sin(5 * T + 1) + 0.008 * Math.sin(11 * T + 3)) * DEG * A;
      c.y = 0.004 * Math.sin(6 * T) * A;
      c.f = 1 + 0.04 * A;
      break;
    case "steadicam":
      // Stabilizer: slow, wide drift, two vertical cycles and one horizontal
      c.z = 0.06 * (1 - Math.cos(T)) * 0.5 * A;
      c.y = 0.012 * Math.sin(2 * T) * A;
      c.x = 0.02 * Math.sin(T) * A;
      c.yaw = 0.008 * Math.sin(T + 0.5) * A;
      c.roll = 0.018 * Math.sin(T + 1) * DEG * A;
      c.f = 1 + 0.03 * A;
      break;
    case "fpv":
      // FPV drone: swings left and right, bobs up and down, banks into turns, and keeps pushing forward
      c.x = 0.075 * Math.sin(2 * T - 0.4) * A;
      c.y = 0.06 * Math.sin(2 * T) * A;
      c.roll = 0.22 * Math.sin(2 * T + 0.6) * DEG * A;
      c.yaw = 0.03 * Math.sin(2 * T) * A;
      c.z = (0.12 + 0.06 * Math.sin(T)) * A;
      c.f = 1 + 0.14 * A;
      break;
    case "dutch-angle":
      // Rotates only the frame by about 21° to create unease
      c.roll = 21 * e * k;
      c.f = 1 + 0.18 * e * k;
      break;
    case "pedestal":
      // Direction is unchanged and the whole camera rises vertically: near layers move down more
      c.y = 0.14 * e * k;
      break;
    case "barrel-roll":
      // The frame rotates a full turn; the middle section zooms in to hide most of the corners
      c.roll = 360 * e;
      c.f = 1 + 0.6 * Math.sin(Math.PI * e);
      break;
    case "fly-through":
      // Flies forward through the nearest layer (for example a wall with a window), which scales past the frame and then fades out
      c.z = 0.6 * e * k;
      c.yaw = ox * 0.4 * e;
      c.pitch = -oy * 0.4 * e;
      break;
    case "low-angle":
      // Lowers and looks up: the subject looms taller and the horizon sinks
      c.y = -0.1 * e * k;
      c.pitch = 0.1 * e * k;
      c.tiltX = 10 * e * k;
      c.f = 1 + 0.06 * e * k;
      break;
    case "high-angle":
      // Rises and looks down: the subject shrinks and the ground fills the frame
      c.y = 0.14 * e * k;
      c.pitch = -0.16 * e * k;
      c.tiltX = -10 * e * k;
      c.z = -0.08 * e * k;
      break;
    case "establishing":
      // Slow push in on a wide shot to establish the location
      c.z = 0.12 * e * k;
      c.pitch = -0.01 * e;
      break;
    case "extreme-close-up":
      // Focal length stretches exponentially by about 3.3x toward focusPoint, with slight background blur
      c.f = Math.pow(3.3, e * k);
      c.yaw = ox * e;
      c.pitch = -oy * e;
      c.blurBg = 3 * e;
      break;
  }
  return c;
}

/** Converts depth 0..1 into distance from the camera (subject distance = 1) */
export function depthToDistance(depth: number, pivot = 0.6) {
  return Math.pow(2, (pivot - depth) * 3);
}

interface LayerInput {
  depth: number;
  subject: boolean;
  focus?: "near" | "far";
  bleed: number;
  pivot: number;
  perspective: number;
}

/** Projects the camera onto one layer: returns transform, filter and opacity */
export function projectLayer(c: CameraState, l: LayerInput) {
  const Z = l.subject ? 1 : depthToDistance(l.depth, l.pivot);
  let sx: number;
  let sy: number;
  let scale: number;
  let ratio: number;
  if (c.orbit !== 0) {
    // The camera sits on a circle centred on the subject and always faces it
    const xc = (Z - 1) * Math.sin(c.orbit);
    const zc = Math.max(0.05, 1 + (Z - 1) * Math.cos(c.orbit));
    sx = (xc / zc) * 0.45;
    sy = 0;
    scale = (c.f * Z) / zc;
    ratio = zc / Z;
  } else {
    const zp = Math.max(0.02, Z - c.z);
    const lateral = l.subject && c.track ? 0 : c.x;
    sx = (-lateral * c.f) / zp;
    sy = (c.y * c.f) / zp;
    scale = (c.f * Z) / zp;
    ratio = zp / Z;
  }
  sx += -c.yaw * c.f;
  sy += c.pitch * c.f;
  // Layers about to hit the camera fade out (fly-through passing through a wall)
  const opacity = clamp((ratio - 0.06) / 0.14);
  const focus = l.focus ?? (l.depth >= 0.7 ? "near" : "far");
  let blur = focus === "near" ? c.blurNear : c.blurFar;
  if (!l.subject && l.depth < 0.5) blur += c.blurBg;
  const s = scale * (1 + l.bleed);
  const transform =
    `perspective(${l.perspective}px) rotate(${c.roll.toFixed(3)}deg) ` +
    `translate3d(${(sx * 100).toFixed(3)}%, ${(sy * 100).toFixed(3)}%, 0) ` +
    `rotateX(${c.tiltX.toFixed(3)}deg) rotateY(${c.turnY.toFixed(3)}deg) scale(${s.toFixed(4)})`;
  return { transform, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none", opacity };
}

interface StageContext {
  camera: MotionValue<CameraState>;
  progress: MotionValue<number>;
  time: MotionValue<number>;
  footage: MotionValue<number>;
  pivot: number;
  perspective: number;
}

const CameraContext = createContext<StageContext | null>(null);

/** Inside CameraStage, gets progress, the clock and "footage time" (slowed to 0.1x during bullet-time) so your own animation follows the move */
export function useCameraStage() {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error("useCameraStage must be used inside <CameraStage>");
  return { progress: ctx.progress, time: ctx.time, footage: ctx.footage, camera: ctx.camera };
}

function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const on = () => setVisible(document.visibilityState !== "hidden");
    on();
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return visible;
}

/** Default footage time rate for bullet-time: slows to 0.1x in the middle of the move */
const defaultFootageRate = (move: CameraMove) =>
  move === "bullet-time" ? (p: number) => 1 - 0.9 * Math.pow(Math.sin(Math.PI * clamp(p)), 0.35) : () => 1;

/** Shape of the loop: hold at start, move, hold at end, rewind (wrap moves join straight back to the start) */
function loopProgress(t: number, d: number, wrap: boolean) {
  const h = Math.max(0.4, d * 0.25);
  if (wrap) {
    const L = d + 2 * h;
    const u = t % L;
    if (u < h) return 0;
    if (u < h + d) return easeInOutCubic((u - h) / d);
    return 1;
  }
  const L = 2 * (d + h);
  const u = t % L;
  if (u < h) return 0;
  if (u < h + d) return easeInOutCubic((u - h) / d);
  if (u < 2 * h + d) return 1;
  return 1 - easeInOutCubic((u - 2 * h - d) / d);
}

export interface CameraStageProps {
  move?: CameraMove;
  /** Defaults to "inView"; continuous-shake moves (handheld, steadicam, fpv) fade the shake in under triggers other than loop */
  trigger?: CameraTrigger;
  /** Seconds; defaults to the move's value (cameraMoveDurations) */
  duration?: number;
  /** Move amplitude multiplier, default 1 */
  intensity?: number;
  /** CSS aspect-ratio, e.g. "16/9", "4/5"; pass null to let className set the height */
  aspect?: string | null;
  /** Target point (percent) for zoom-in, extreme-close-up, dolly-in and fly-through, defaults to the frame centre */
  focusPoint?: FocusPoint;
  /** Controlled progress 0..1 (a number or a MotionValue, e.g. scrollYProgress from useScroll). When given, trigger is ignored */
  progress?: number | MotionValue<number>;
  /** Play backwards (dolly-in becomes dolly-out, crane-up becomes crane-down) */
  reverse?: boolean;
  /** Which depth equals the subject distance, default 0.6 */
  pivot?: number;
  /** Perspective distance (px) for the per-layer 3D tilt, default 900 */
  perspective?: number;
  /** Footage time rate (by progress). By default only bullet-time slows down; use it for slow motion or speed ramps */
  footageRate?: (progress: number) => number;
  /** Accessible name of the scene */
  label?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function CameraStage({
  move = "dolly-in",
  trigger = "inView",
  duration,
  intensity = 1,
  aspect = "16/9",
  focusPoint,
  progress,
  reverse = false,
  pivot = 0.6,
  perspective = 900,
  footageRate,
  label,
  className,
  style,
  children,
}: CameraStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const inView = useInView(ref, { margin: "60px" });
  const seen = useInView(ref, { once: true, amount: 0.4 });
  const visible = usePageVisible();
  const [hovered, setHovered] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const d = duration ?? cameraMoveDurations[move];
  const ambient = ambientCameraMoves.includes(move);
  const controlled = progress !== undefined;
  const fx = focusPoint?.x ?? 50;
  const fy = focusPoint?.y ?? 50;

  const p = useMotionValue(reduce ? 1 : 0);
  const time = useMotionValue(0);
  const footage = useMotionValue(0);

  const cfg = useRef({ move, reverse, ambient, trigger, intensity, d, fx, fy, reduce, controlled });
  cfg.current = { move, reverse, ambient, trigger, intensity, d, fx, fy, reduce, controlled };

  const compute = (): CameraState => {
    const c = cfg.current;
    const pv = c.reduce && !c.controlled ? 1 : p.get();
    const e = c.reverse ? 1 - pv : pv;
    const amp = c.reduce ? 0 : c.trigger === "loop" && !c.controlled ? 1 : pv;
    return computeCamera({
      move: c.move,
      e,
      amp,
      t: time.get(),
      k: c.intensity,
      duration: c.d,
      focus: { x: c.fx, y: c.fy },
    });
  };
  const camera = useMotionValue<CameraState>(compute());

  // Recompute the camera whenever progress or the clock changes; also once when props change
  useEffect(() => {
    const run = () => camera.set(compute());
    run();
    const a = p.on("change", run);
    const b = time.on("change", run);
    return () => {
      a();
      b();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [move, reverse, ambient, trigger, intensity, d, fx, fy, reduce, controlled]);

  useEffect(() => setMounted(true), []);

  // Controlled progress
  useEffect(() => {
    if (progress === undefined) return;
    if (isMotionValue(progress)) {
      const mv = progress as MotionValue<number>;
      p.set(mv.get());
      return mv.on("change", (v) => p.set(v));
    }
    p.set(progress as number);
  }, [progress, p]);

  // Single-shot triggers: mount, inView, hover, click
  const target =
    trigger === "mount" ? mounted : trigger === "inView" ? seen : trigger === "hover" ? hovered : toggled;
  useEffect(() => {
    if (controlled || trigger === "loop") return;
    if (reduce) {
      p.set(1);
      return;
    }
    const ctrl = animate(p, target ? 1 : 0, {
      duration: ambient ? 0.6 : d,
      ease: EASE,
      delay: trigger === "mount" || trigger === "inView" ? 0.3 : 0,
    });
    return () => ctrl.stop();
  }, [target, trigger, controlled, reduce, ambient, d, p]);

  // Clock: runs only while in view, with the tab visible, and without reduced motion
  const needsClock = trigger === "loop" || ambient || move === "bullet-time" || footageRate !== undefined;
  const running = needsClock && inView && visible && !reduce;
  const rateRef = useRef(footageRate ?? defaultFootageRate(move));
  rateRef.current = footageRate ?? defaultFootageRate(move);
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const wrap = wrapMoves.includes(move);
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const t = time.get() + dt;
      if (trigger === "loop" && !controlled) p.set(ambient ? 1 : loopProgress(t, d, wrap));
      footage.set(footage.get() + dt * rateRef.current(p.get()));
      time.set(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, trigger, controlled, ambient, move, d, p, time, footage]);

  const clickable = trigger === "click" && !controlled;
  const onKeyDown = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      setToggled((v) => !v);
    }
  };

  return (
    <CameraContext.Provider value={{ camera, progress: p, time, footage, pivot, perspective }}>
      <div
        ref={ref}
        role={clickable ? "button" : label ? "img" : undefined}
        aria-label={label}
        aria-pressed={clickable ? toggled : undefined}
        tabIndex={clickable ? 0 : undefined}
        onPointerEnter={trigger === "hover" ? () => setHovered(true) : undefined}
        onPointerLeave={trigger === "hover" ? () => setHovered(false) : undefined}
        onClick={clickable ? () => setToggled((v) => !v) : undefined}
        onKeyDown={clickable ? onKeyDown : undefined}
        data-move={move}
        className={cn(
          "relative isolate overflow-hidden rounded-xl bg-muted",
          clickable && "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className,
        )}
        style={{ aspectRatio: aspect ?? undefined, ...style }}
      >
        {children}
      </div>
    </CameraContext.Provider>
  );
}

export interface CameraLayerProps {
  /** 0 = farthest background, 1 = nearest foreground; default 0.5 */
  depth?: number;
  /** Subject layer: keeps its size during dolly-zoom, stays centred during tracking, and is the centre of the orbit */
  subject?: boolean;
  /** Used by rack-focus; when unspecified, depth >= 0.7 counts as foreground */
  focus?: "near" | "far";
  /** Pre-scale to avoid showing edges while moving; default 0.26 × (1 - depth) */
  bleed?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function CameraLayer({ depth = 0.5, subject = false, focus, bleed, className, style, children }: CameraLayerProps) {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error("<CameraLayer> must be used inside <CameraStage>");
  const { camera, pivot, perspective } = ctx;
  const b = bleed ?? 0.26 * (1 - clamp(depth));
  const opts = { depth: clamp(depth), subject, focus, bleed: b, pivot, perspective };
  const first = projectLayer(camera.get(), opts);
  const transform = useMotionValue(first.transform);
  const filter = useMotionValue(first.filter);
  const opacity = useMotionValue(first.opacity);

  useEffect(() => {
    const o = { depth: clamp(depth), subject, focus, bleed: b, pivot, perspective };
    const run = (c: CameraState) => {
      const r = projectLayer(c, o);
      transform.set(r.transform);
      filter.set(r.filter);
      opacity.set(r.opacity);
    };
    run(camera.get());
    return camera.on("change", run);
  }, [camera, depth, subject, focus, b, pivot, perspective, transform, filter, opacity]);

  return (
    <motion.div
      className={cn("pointer-events-none absolute inset-0 will-change-transform", className)}
      style={{ ...style, transform, filter, opacity, zIndex: Math.round(clamp(depth) * 100) }}
    >
      {children}
    </motion.div>
  );
}
