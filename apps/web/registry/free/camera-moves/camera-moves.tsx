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
 * 電影運鏡：把買家自己的內容疊成幾層「場景」，用 move prop 套上一種鏡頭運動。
 * 每一層有 depth（0 = 最遠的背景，1 = 最近的前景），運鏡依深度算出每層的位移、縮放與模糊，
 * 所以視差是對的：搖鏡（pan）各層一起移，推軌（dolly）近景移得多，變焦（zoom）各層等比放大。
 *
 * 用捲動驅動：
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

/** 持續晃動類的運鏡：沒有起點終點，靠時間跑（progress 只當作強度） */
export const ambientCameraMoves: readonly CameraMove[] = ["handheld", "steadicam", "fpv"];

/** 各運鏡的預設長度（秒）；持續晃動類是一個循環週期 */
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

/** 轉完一圈和起點相同，循環時直接接回起點，不倒帶 */
const wrapMoves: readonly CameraMove[] = ["barrel-roll"];

export interface FocusPoint {
  /** 0 到 100，畫面左到右 */
  x: number;
  /** 0 到 100，畫面上到下 */
  y: number;
}

/** 某一刻的虛擬攝影機。位置以「主體距離 = 1」為單位；yaw、pitch 以畫面比例為單位 */
export interface CameraState {
  x: number;
  y: number;
  z: number;
  /** 正值向右看（畫面往左移） */
  yaw: number;
  /** 正值向上看（畫面往下移） */
  pitch: number;
  /** 畫面旋轉角度（deg） */
  roll: number;
  /** 焦距倍率，1 = 起始焦距 */
  f: number;
  /** 環繞角度（rad），orbit 與 bullet-time 用 */
  orbit: number;
  /** 每層額外的 3D 傾斜（deg），讓仰角、俯角、環繞更有立體感 */
  tiltX: number;
  turnY: number;
  /** 景深模糊（px） */
  blurNear: number;
  blurFar: number;
  blurBg: number;
  /** tracking：主體跟著攝影機走，主體層不受橫移影響 */
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
  /** 已套用 reverse 的進度 0..1 */
  e: number;
  /** 持續晃動類的強度 0..1 */
  amp: number;
  /** 時鐘（秒） */
  t: number;
  k: number;
  duration: number;
  focus: FocusPoint;
}

/** 由運鏡名稱、進度與時間算出攝影機狀態。每個運鏡一段，彼此獨立 */
export function computeCamera({ move, e, amp, t, k, duration, focus }: CameraInput): CameraState {
  const c: CameraState = { ...REST };
  const ox = focus.x / 100 - 0.5;
  const oy = focus.y / 100 - 0.5;
  const T = (2 * Math.PI * t) / Math.max(0.1, duration);
  const A = amp * k;
  switch (move) {
    case "pan":
      // 原地左右轉，各層同樣位移，沒有視差
      c.yaw = lerp(-0.07, 0.07, e) * k;
      break;
    case "tilt":
      // 原地由下往上看
      c.pitch = lerp(-0.03, 0.09, e) * k;
      break;
    case "dolly-in":
      // 攝影機往前走：近景放大得多，遠景幾乎不動
      c.z = 0.28 * e * k;
      c.yaw = ox * 0.3 * e;
      c.pitch = -oy * 0.3 * e;
      break;
    case "zoom-in":
      // 攝影機不動只拉長焦距：各層等比放大，重疊關係不變
      c.f = 1 + 1.2 * e * k;
      c.yaw = ox * e;
      c.pitch = -oy * e;
      break;
    case "tracking":
      // 和主體並行橫移：主體留在畫面中央，背景與前景以不同速度滑過
      c.x = lerp(-0.1, 0.1, e) * k;
      c.track = true;
      break;
    case "orbit":
      // 繞著主體轉約 ±20°，背景與前景往相反方向滑
      c.orbit = lerp(-0.35, 0.35, e) * k;
      c.turnY = -c.orbit * DEG * 0.6;
      c.f = 1.05;
      break;
    case "bullet-time":
      // 和 orbit 相同的環繞，但時間幾乎停住（見 useCameraStage().footage）
      c.orbit = lerp(-0.3, 0.3, e) * k;
      c.turnY = -c.orbit * DEG * 0.6;
      c.f = 1.05;
      break;
    case "crane-up":
      // 升高並往下看，讓主體留在畫面中，地平線往上離開
      c.y = 0.22 * e * k;
      c.z = 0.05 * e * k;
      c.pitch = -0.86 * c.y;
      break;
    case "dolly-zoom": {
      // 往後退同時等比變焦：主體大小不變，只有背景逼近（希區考克的 vertigo effect）
      const b = 1.0 * e * k;
      c.z = -b;
      c.f = 1 + b;
      break;
    }
    case "rack-focus":
      // 焦點從前景移到後方：前景 0 → 7px 模糊，後方 6 → 0px
      c.blurNear = 7 * e * k;
      c.blurFar = 6 * (1 - e) * k;
      c.f = 1 + 0.02 * e;
      break;
    case "handheld":
      // 手持：幾組不同週期的正弦相加，快而不規則
      c.yaw = 0.9 * (0.016 * Math.sin(3 * T) + 0.008 * Math.sin(7 * T + 1) + 0.004 * Math.sin(13 * T + 2)) * A;
      c.pitch = 1.4 * (0.012 * Math.sin(4 * T + 2) + 0.006 * Math.sin(9 * T + 0.5) + 0.003 * Math.sin(17 * T + 1.2)) * A;
      c.roll = (0.02 * Math.sin(5 * T + 1) + 0.008 * Math.sin(11 * T + 3)) * DEG * A;
      c.y = 0.004 * Math.sin(6 * T) * A;
      c.f = 1 + 0.04 * A;
      break;
    case "steadicam":
      // 穩定器：慢而寬的漂移，上下兩次、左右一次
      c.z = 0.06 * (1 - Math.cos(T)) * 0.5 * A;
      c.y = 0.012 * Math.sin(2 * T) * A;
      c.x = 0.02 * Math.sin(T) * A;
      c.yaw = 0.008 * Math.sin(T + 0.5) * A;
      c.roll = 0.018 * Math.sin(T + 1) * DEG * A;
      c.f = 1 + 0.03 * A;
      break;
    case "fpv":
      // 穿越機：左右擺盪、上下起伏、壓坡傾斜，持續往前衝
      c.x = 0.075 * Math.sin(2 * T - 0.4) * A;
      c.y = 0.06 * Math.sin(2 * T) * A;
      c.roll = 0.22 * Math.sin(2 * T + 0.6) * DEG * A;
      c.yaw = 0.03 * Math.sin(2 * T) * A;
      c.z = (0.12 + 0.06 * Math.sin(T)) * A;
      c.f = 1 + 0.14 * A;
      break;
    case "dutch-angle":
      // 只轉畫面約 21°，製造不安
      c.roll = 21 * e * k;
      c.f = 1 + 0.18 * e * k;
      break;
    case "pedestal":
      // 方向不變，整台攝影機垂直升起：近景往下移得多
      c.y = 0.14 * e * k;
      break;
    case "barrel-roll":
      // 畫面轉一整圈，中段放大遮住大部分角落
      c.roll = 360 * e;
      c.f = 1 + 0.6 * Math.sin(Math.PI * e);
      break;
    case "fly-through":
      // 往前穿過最近的一層（例如有窗的牆），它放大到畫面外後淡出
      c.z = 0.6 * e * k;
      c.yaw = ox * 0.4 * e;
      c.pitch = -oy * 0.4 * e;
      break;
    case "low-angle":
      // 降低並往上看：主體變高大，地平線下沉
      c.y = -0.1 * e * k;
      c.pitch = 0.1 * e * k;
      c.tiltX = 10 * e * k;
      c.f = 1 + 0.06 * e * k;
      break;
    case "high-angle":
      // 升高並往下看：主體變小，地面占滿畫面
      c.y = 0.14 * e * k;
      c.pitch = -0.16 * e * k;
      c.tiltX = -10 * e * k;
      c.z = -0.08 * e * k;
      break;
    case "establishing":
      // 大遠景緩慢推進，交代地點
      c.z = 0.12 * e * k;
      c.pitch = -0.01 * e;
      break;
    case "extreme-close-up":
      // 焦距指數拉長約 3.3 倍並對準 focusPoint，背景微糊
      c.f = Math.pow(3.3, e * k);
      c.yaw = ox * e;
      c.pitch = -oy * e;
      c.blurBg = 3 * e;
      break;
  }
  return c;
}

/** 深度 0..1 換成到攝影機的距離（主體距離 = 1） */
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

/** 把攝影機投影到一層：回傳 transform、filter、opacity */
export function projectLayer(c: CameraState, l: LayerInput) {
  const Z = l.subject ? 1 : depthToDistance(l.depth, l.pivot);
  let sx: number;
  let sy: number;
  let scale: number;
  let ratio: number;
  if (c.orbit !== 0) {
    // 攝影機在以主體為圓心的圓上，永遠朝向主體
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
  // 快撞上攝影機的層淡出（fly-through 穿牆）
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

/** 在 CameraStage 裡取得進度、時鐘與「片中時間」（bullet-time 時放慢到 0.1 倍），讓自己的動畫跟著運鏡 */
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

/** bullet-time 預設的片中時間速率：運鏡中段放慢到 0.1 倍 */
const defaultFootageRate = (move: CameraMove) =>
  move === "bullet-time" ? (p: number) => 1 - 0.9 * Math.pow(Math.sin(Math.PI * clamp(p)), 0.35) : () => 1;

/** 循環的形狀：停在起點、運鏡、停在終點、倒回（wrap 類直接接回起點） */
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
  /** 預設 "inView"；持續晃動類（handheld、steadicam、fpv）在 loop 以外的觸發下會淡入晃動 */
  trigger?: CameraTrigger;
  /** 秒；預設依運鏡（cameraMoveDurations） */
  duration?: number;
  /** 運鏡幅度倍率，預設 1 */
  intensity?: number;
  /** CSS aspect-ratio，例如 "16/9"、"4/5"；傳 null 則由 className 決定高度 */
  aspect?: string | null;
  /** zoom-in、extreme-close-up、dolly-in、fly-through 的目標點（百分比），預設畫面中央 */
  focusPoint?: FocusPoint;
  /** 受控進度 0..1（數字或 MotionValue，例如 useScroll 的 scrollYProgress）。給了就忽略 trigger */
  progress?: number | MotionValue<number>;
  /** 倒著播（dolly-in 變 dolly-out、crane-up 變 crane-down） */
  reverse?: boolean;
  /** 哪個深度等於主體距離，預設 0.6 */
  pivot?: number;
  /** 每層 3D 傾斜用的透視距離（px），預設 900 */
  perspective?: number;
  /** 片中時間速率（依進度），預設只有 bullet-time 會放慢；可用來做 slow motion、speed ramp */
  footageRate?: (progress: number) => number;
  /** 場景的無障礙名稱 */
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

  // 進度或時鐘一變就重算攝影機；props 改變時也重算一次
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

  // 受控進度
  useEffect(() => {
    if (progress === undefined) return;
    if (isMotionValue(progress)) {
      const mv = progress as MotionValue<number>;
      p.set(mv.get());
      return mv.on("change", (v) => p.set(v));
    }
    p.set(progress as number);
  }, [progress, p]);

  // 單次觸發：mount、inView、hover、click
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

  // 時鐘：只在畫面內、分頁可見、沒有減少動態時跑
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
  /** 0 = 最遠的背景，1 = 最近的前景；預設 0.5 */
  depth?: number;
  /** 主體層：dolly-zoom 時大小不變、tracking 時留在畫面中央、orbit 的圓心 */
  subject?: boolean;
  /** rack-focus 用；未指定時 depth >= 0.7 算前景 */
  focus?: "near" | "far";
  /** 預先放大的比例，避免移動時露出邊緣；預設 0.26 × (1 - depth) */
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
