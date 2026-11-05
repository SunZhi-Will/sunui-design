"use client";

import {
  motion,
  useAnimationFrame,
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

/** 全部動畫原理 id；demo 與文件都從這裡讀 */
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

/** 常駐循環的原理；其餘是單次動作（可重播） */
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

/** 具名的緩動曲線（cubic-bezier），可直接傳給 ease prop 或 framer-motion */
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

// 每個原理的預設時長（秒）與距離（px）。line-boil 的 duration 是每張「手繪稿」停留的秒數
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

/* ---------- 共用小工具 ---------- */

/** 以索引產生穩定的偽亂數（0 到 1），SSR 與 client 一致 */
function rand(i: number, salt = 1) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function subscribeVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}

/** 分頁是否在前景；切到別的分頁時循環暫停 */
function usePageVisible() {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== "hidden",
    () => true,
  );
}

/** 依 trigger 決定：單次動作何時播放（play / cycle），循環何時在跑（running） */
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

  // trigger="loop" 的單次動作：在畫面內定期重播
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
    // click 事件會從子元素冒泡上來：包一顆 button 時鍵盤操作也會觸發
    handlers.onClick = () => {
      setToggled((v) => !v);
      if (!looping && !reduce) setCycle((c) => c + 1);
    };
  }

  return { ref, reduce, play, running, cycle, handlers };
}

// 疊在同一格（grid 1/1）的圖層
const cell = "[grid-area:1/1]";

/* ---------- 主元件 ---------- */

export interface MotionPrincipleProps {
  effect?: MotionPrincipleName;
  /** 單次動作：何時播放；循環原理：hover / click / inView 時才跑 */
  trigger?: MotionPrincipleTrigger;
  /** 幅度倍率，1 為預設；0.5 收斂、1.5 誇張 */
  intensity?: number;
  /** 單次動作或一個循環週期的秒數，省略用預設 */
  duration?: number;
  /** 開始前延遲（秒），只用於單次動作 */
  delay?: number;
  /** 位移距離或半徑（px）：移動類為行程、bounce 為落下高度、repeater 為半徑 */
  distance?: number;
  /** 爆開線條、脈衝光環等裝飾的顏色，預設 currentColor */
  color?: string;
  /** burst 的線數、bounce 的彈跳次數、motion-trail 的殘影數、repeater / kaleidoscope 的份數 */
  count?: number;
  /** easing / ping-pong 使用的緩動 */
  ease?: EaseValue;
  /** follow-through：掛在主體上方、停下後繼續擺動的附屬部件（旗子、天線、尾巴） */
  trailing?: ReactNode;
  /** exploded-view：分層展開的方向 */
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
 * 經典動畫原理包裝器：把任何子元素（圖示、徽章、按鈕、商品圖）用 effect 指定的原理動起來。
 * 單次動作在 trigger 時播放，循環原理離開畫面或分頁隱藏時暫停；reduced motion 下直接顯示靜止的子元素。
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

/** inView 尚未進入畫面前的靜止狀態 */
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

/* ---------- 各原理 ---------- */

// 003 爆開：子元素彈一下，同時一圈光環、放射線與小點往外散
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

// 009 緩動：同樣距離、同樣時間，只換速度曲線
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

// 010 超越：衝過頭、拉回、再穩定下來
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

// 011 擠壓與伸展：起跳前壓扁、離地拉長、落地再壓扁（以底部為軸）
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

// 014 動態殘影：沿 8 字軌跡移動，後面跟著逐漸淡出的分身
function MotionTrail({ children, d, dist, count, running, reduce }: InnerProps) {
  const time = useMotionValue(0);
  useAnimationFrame((_, delta) => {
    if (running) time.set(time.get() + Math.min(delta, 64) / 1000);
  });
  if (reduce) return <span className="inline-block">{children}</span>;
  const n = Math.max(2, count ?? 6);
  return (
    <span className="inline-grid place-items-center">
      {Array.from({ length: n }, (_, j) => {
        const i = n - 1 - j; // 殘影先畫，本體最後畫在最上層
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

// 024 衝擊震動：子元素重重落下，著地瞬間整個容器跟著震
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

// 121 預備動作：先往反方向退、壓低蓄力，再一口氣衝出去
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

/** 主體上方掛一個附屬部件（以底部為軸） */
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

// 122 跟隨動作：主體突然停下，附屬部件（或主體本身的上半部）繼續擺動才停
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

// 123 彈跳：落下後一次比一次彈得低，最後停住
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

// 124 抖動：不規則的小幅晃動，持續不停（以上緣為軸，像鈴鐺）
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

// 125 脈搏：一次兩下的心跳，同時往外擴散光環
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

// 127 來回：走到一端，再像倒帶一樣沿原路回來，反覆
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

// 128 定格動畫：每秒約 8 格，每格位置與角度都略有偏差，留下淡淡的前兩格
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

// 134 重複器：把子元素複製一圈，每份錯開一點時間轉動與脈動
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

// 135 萬花筒：八向鏡射的分身一起旋轉，並從中心呼吸般擴散
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

// 136 線條沸騰：SVG 雜訊位移每隔幾格換一次，靜止的畫也像手繪逐格
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

/** 分層圖：progress 0 為組合，1 為完全展開 */
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

// 143 分解圖：子元素當成圖層，沿軸分開再組回去
function Exploded({ children, d, delay, dist, axis, reduce }: InnerProps) {
  const layers = Children.toArray(children);
  return <Layers layers={layers} axis={axis} gap={dist} progress={0} animate={reduce ? undefined : { d, delay }} />;
}

const staggerItem: Variants = {
  hidden: (c: { y: number }) => ({ opacity: 0, y: c.y }),
  show: (c: { d: number; at: number }) => ({ opacity: 1, y: 0, transition: { duration: c.d, delay: c.at, ease: [0.2, 0.7, 0.3, 1] } }),
};

// 002 錯開：每個子元素依序進場
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

/* ---------- 個別匯出 ---------- */

type Shared = Omit<MotionPrincipleProps, "effect">;

/** 002 錯開進場：清單、卡片、長條圖逐一出現。as="ul" / "ol" 時每項包成 li */
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
  /** 每項之間的間隔秒數 */
  stagger?: number;
  duration?: number;
  delay?: number;
  /** 每項往上滑入的距離（px） */
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

/** 143 分解圖：每個子元素是一層，第一個在最底下 */
export function ExplodedView(props: Shared) {
  return <MotionPrinciple {...props} effect="exploded-view" />;
}

/** 134 重複器：子元素複製成一圈 */
export function Repeater(props: Shared) {
  return <MotionPrinciple trigger="loop" {...props} effect="repeater" />;
}

/** 135 萬花筒：子元素（或一張圖）八向鏡射並旋轉 */
export function Kaleidoscope(props: Shared) {
  return <MotionPrinciple trigger="loop" {...props} effect="kaleidoscope" />;
}
