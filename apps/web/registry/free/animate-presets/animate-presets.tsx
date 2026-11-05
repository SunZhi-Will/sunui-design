"use client";

import {
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
  type Easing,
  type TargetAndTransition,
  type Transition,
  type Variants,
} from "framer-motion";
import { Children, useCallback, useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const entrancePresets = [
  "fadeIn",
  "fadeInUp",
  "fadeInDown",
  "fadeInLeft",
  "fadeInRight",
  "blurIn",
  "zoomIn",
  "bounceIn",
  "backInUp",
  "backInDown",
  "backInLeft",
  "backInRight",
  "flipInX",
  "flipInY",
  "rotateIn",
  "rollIn",
  "lightSpeedIn",
  "jackInTheBox",
  "puffIn",
  "swirlIn",
  "slideInUp",
  "slideInDown",
  "slideInLeft",
  "slideInRight",
  "clipRevealUp",
  "clipRevealDown",
  "clipRevealLeft",
  "clipRevealRight",
  "clipRevealCircle",
  "trackingIn",
] as const;

export const exitPresets = [
  "fadeOut",
  "fadeOutUp",
  "fadeOutDown",
  "blurOut",
  "zoomOut",
  "bounceOut",
  "backOutDown",
  "flipOutX",
  "flipOutY",
  "rotateOut",
  "rollOut",
  "lightSpeedOut",
  "puffOut",
  "hinge",
  "slideOutUp",
  "slideOutDown",
] as const;

export const emphasisPresets = [
  "bounce",
  "flash",
  "pulse",
  "heartbeat",
  "headShake",
  "shake",
  "shakeY",
  "jello",
  "rubberBand",
  "swing",
  "tada",
  "wobble",
  "vibrate",
  "spin",
  "ping",
  "float",
] as const;

export const animatePresets = [...entrancePresets, ...exitPresets, ...emphasisPresets] as const;

export type EntrancePreset = (typeof entrancePresets)[number];
export type ExitPreset = (typeof exitPresets)[number];
export type EmphasisPreset = (typeof emphasisPresets)[number];
export type AnimatePreset = (typeof animatePresets)[number];
export type PresetFamily = "entrance" | "exit" | "emphasis";
export type AnimateTrigger = "mount" | "inView" | "hover" | "click" | "loop";

interface PresetDef {
  /** 起始狀態（強調類由 to 的最後一格自動推出） */
  from?: TargetAndTransition;
  to: TargetAndTransition;
  duration: number;
  ease?: Easing | Easing[];
  /** 固定樣式，例如 3D 透視或旋轉軸心 */
  style?: CSSProperties & { originX?: number; originY?: number; transformPerspective?: number };
}

const out: Easing = [0.22, 1, 0.36, 1];
const inEase: Easing = [0.55, 0, 1, 0.45];
const persp = { transformPerspective: 500 };

// 每個預設只描述「從哪裡到哪裡」，時間與觸發交給 Animate
const entrance: Record<EntrancePreset, PresetDef> = {
  fadeIn: { from: { opacity: 0 }, to: { opacity: 1 }, duration: 0.5 },
  fadeInUp: { from: { opacity: 0, y: 24 }, to: { opacity: 1, y: 0 }, duration: 0.55, ease: out },
  fadeInDown: { from: { opacity: 0, y: -24 }, to: { opacity: 1, y: 0 }, duration: 0.55, ease: out },
  fadeInLeft: { from: { opacity: 0, x: -24 }, to: { opacity: 1, x: 0 }, duration: 0.55, ease: out },
  fadeInRight: { from: { opacity: 0, x: 24 }, to: { opacity: 1, x: 0 }, duration: 0.55, ease: out },
  blurIn: { from: { opacity: 0, filter: "blur(12px)" }, to: { opacity: 1, filter: "blur(0px)" }, duration: 0.6, ease: out },
  zoomIn: { from: { opacity: 0, scale: 0.5 }, to: { opacity: 1, scale: 1 }, duration: 0.5, ease: out },
  bounceIn: {
    from: { opacity: 0, scale: 0.3 },
    to: { opacity: [0, 1, 1, 1, 1, 1], scale: [0.3, 1.1, 0.9, 1.03, 0.97, 1] },
    duration: 0.75,
  },
  backInUp: {
    from: { opacity: 0.7, y: 120, scale: 0.7 },
    to: { opacity: [0.7, 0.7, 1], y: [120, 0, 0], scale: [0.7, 0.7, 1] },
    duration: 0.8,
  },
  backInDown: {
    from: { opacity: 0.7, y: -120, scale: 0.7 },
    to: { opacity: [0.7, 0.7, 1], y: [-120, 0, 0], scale: [0.7, 0.7, 1] },
    duration: 0.8,
  },
  backInLeft: {
    from: { opacity: 0.7, x: -160, scale: 0.7 },
    to: { opacity: [0.7, 0.7, 1], x: [-160, 0, 0], scale: [0.7, 0.7, 1] },
    duration: 0.8,
  },
  backInRight: {
    from: { opacity: 0.7, x: 160, scale: 0.7 },
    to: { opacity: [0.7, 0.7, 1], x: [160, 0, 0], scale: [0.7, 0.7, 1] },
    duration: 0.8,
  },
  flipInX: {
    from: { opacity: 0, rotateX: 90 },
    to: { opacity: [0, 0.6, 1, 1, 1], rotateX: [90, -20, 10, -5, 0] },
    duration: 0.8,
    style: persp,
  },
  flipInY: {
    from: { opacity: 0, rotateY: 90 },
    to: { opacity: [0, 0.6, 1, 1, 1], rotateY: [90, -20, 10, -5, 0] },
    duration: 0.8,
    style: persp,
  },
  rotateIn: { from: { opacity: 0, rotate: -200 }, to: { opacity: 1, rotate: 0 }, duration: 0.7, ease: out },
  rollIn: { from: { opacity: 0, x: "-100%", rotate: -120 }, to: { opacity: 1, x: "0%", rotate: 0 }, duration: 0.7, ease: out },
  lightSpeedIn: {
    from: { opacity: 0, x: "100%", skewX: -30 },
    to: { opacity: [0, 1, 1, 1], x: ["100%", "0%", "0%", "0%"], skewX: [-30, 20, -5, 0] },
    duration: 0.7,
    ease: "easeOut",
  },
  jackInTheBox: {
    from: { opacity: 0, scale: 0.1, rotate: 30 },
    to: { opacity: [0, 1, 1, 1], scale: [0.1, 0.6, 1, 1], rotate: [30, -10, 3, 0] },
    duration: 0.8,
    style: { originY: 1 },
  },
  puffIn: {
    from: { opacity: 0, scale: 2, filter: "blur(8px)" },
    to: { opacity: 1, scale: 1, filter: "blur(0px)" },
    duration: 0.6,
    ease: out,
  },
  swirlIn: { from: { opacity: 0, scale: 0, rotate: -540 }, to: { opacity: 1, scale: 1, rotate: 0 }, duration: 0.8, ease: out },
  slideInUp: { from: { y: "100%" }, to: { y: "0%" }, duration: 0.5, ease: out },
  slideInDown: { from: { y: "-100%" }, to: { y: "0%" }, duration: 0.5, ease: out },
  slideInLeft: { from: { x: "-100%" }, to: { x: "0%" }, duration: 0.5, ease: out },
  slideInRight: { from: { x: "100%" }, to: { x: "0%" }, duration: 0.5, ease: out },
  clipRevealUp: { from: { clipPath: "inset(100% 0% 0% 0%)" }, to: { clipPath: "inset(0% 0% 0% 0%)" }, duration: 0.7, ease: out },
  clipRevealDown: { from: { clipPath: "inset(0% 0% 100% 0%)" }, to: { clipPath: "inset(0% 0% 0% 0%)" }, duration: 0.7, ease: out },
  clipRevealLeft: { from: { clipPath: "inset(0% 0% 0% 100%)" }, to: { clipPath: "inset(0% 0% 0% 0%)" }, duration: 0.7, ease: out },
  clipRevealRight: { from: { clipPath: "inset(0% 100% 0% 0%)" }, to: { clipPath: "inset(0% 0% 0% 0%)" }, duration: 0.7, ease: out },
  clipRevealCircle: {
    from: { clipPath: "circle(0% at 50% 50%)" },
    to: { clipPath: "circle(75% at 50% 50%)" },
    duration: 0.8,
    ease: out,
  },
  trackingIn: {
    from: { opacity: 0, letterSpacing: "-0.5em" },
    to: { opacity: 1, letterSpacing: "0em" },
    duration: 0.7,
    ease: out,
  },
};

const exit: Record<ExitPreset, PresetDef> = {
  fadeOut: { from: { opacity: 1 }, to: { opacity: 0 }, duration: 0.5 },
  fadeOutUp: { from: { opacity: 1, y: 0 }, to: { opacity: 0, y: -24 }, duration: 0.5, ease: inEase },
  fadeOutDown: { from: { opacity: 1, y: 0 }, to: { opacity: 0, y: 24 }, duration: 0.5, ease: inEase },
  blurOut: { from: { opacity: 1, filter: "blur(0px)" }, to: { opacity: 0, filter: "blur(12px)" }, duration: 0.55 },
  zoomOut: { from: { opacity: 1, scale: 1 }, to: { opacity: 0, scale: 0.5 }, duration: 0.5, ease: inEase },
  bounceOut: {
    from: { opacity: 1, scale: 1 },
    to: { opacity: [1, 1, 1, 1, 0], scale: [1, 0.9, 1.1, 1.1, 0.3] },
    duration: 0.75,
  },
  backOutDown: {
    from: { opacity: 1, y: 0, scale: 1 },
    to: { opacity: [1, 0.7, 0], y: [0, 0, 120], scale: [1, 0.7, 0.7] },
    duration: 0.8,
  },
  flipOutX: { from: { opacity: 1, rotateX: 0 }, to: { opacity: [1, 1, 0], rotateX: [0, -20, 90] }, duration: 0.7, style: persp },
  flipOutY: { from: { opacity: 1, rotateY: 0 }, to: { opacity: [1, 1, 0], rotateY: [0, -15, 90] }, duration: 0.7, style: persp },
  rotateOut: { from: { opacity: 1, rotate: 0 }, to: { opacity: 0, rotate: 200 }, duration: 0.6, ease: inEase },
  rollOut: { from: { opacity: 1, x: "0%", rotate: 0 }, to: { opacity: 0, x: "100%", rotate: 120 }, duration: 0.6, ease: inEase },
  lightSpeedOut: { from: { opacity: 1, x: "0%", skewX: 0 }, to: { opacity: 0, x: "100%", skewX: 30 }, duration: 0.5, ease: inEase },
  puffOut: {
    from: { opacity: 1, scale: 1, filter: "blur(0px)" },
    to: { opacity: 0, scale: 2, filter: "blur(8px)" },
    duration: 0.55,
  },
  hinge: {
    from: { opacity: 1, rotate: 0, y: 0 },
    to: { opacity: [1, 1, 1, 1, 1, 0], rotate: [0, 80, 60, 80, 60, 60], y: [0, 0, 0, 0, 0, 160] },
    duration: 1.6,
    ease: "easeInOut",
    style: { originX: 0, originY: 0 },
  },
  slideOutUp: { from: { y: "0%" }, to: { y: "-100%" }, duration: 0.5, ease: inEase },
  slideOutDown: { from: { y: "0%" }, to: { y: "100%" }, duration: 0.5, ease: inEase },
};

const emphasis: Record<EmphasisPreset, PresetDef> = {
  bounce: { to: { y: [0, -24, 0, -12, 0, -4, 0] }, duration: 0.9, ease: "easeOut" },
  flash: { to: { opacity: [1, 0, 1, 0, 1] }, duration: 0.9 },
  pulse: { to: { scale: [1, 1.06, 1] }, duration: 0.8, ease: "easeInOut" },
  heartbeat: { to: { scale: [1, 1.25, 1, 1.25, 1] }, duration: 1, ease: "easeInOut" },
  headShake: { to: { x: [0, -6, 5, -3, 2, 0], rotateY: [0, -9, 7, -5, 3, 0] }, duration: 0.9, style: persp },
  shake: { to: { x: [0, -10, 10, -10, 10, -6, 6, 0] }, duration: 0.7 },
  shakeY: { to: { y: [0, -8, 8, -8, 8, -4, 4, 0] }, duration: 0.7 },
  jello: {
    to: { skewX: [0, -12.5, 6.25, -3.1, 1.56, -0.78, 0], skewY: [0, -12.5, 6.25, -3.1, 1.56, -0.78, 0] },
    duration: 0.9,
  },
  rubberBand: {
    to: { scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1], scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1] },
    duration: 0.9,
  },
  swing: { to: { rotate: [0, 15, -10, 5, -5, 0] }, duration: 0.9, style: { originY: 0 } },
  tada: {
    to: { scale: [1, 0.9, 0.9, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1], rotate: [0, -3, -3, 3, -3, 3, -3, 3, -3, 0] },
    duration: 1,
  },
  wobble: { to: { x: ["0%", "-25%", "20%", "-15%", "10%", "-5%", "0%"], rotate: [0, -5, 3, -3, 2, -1, 0] }, duration: 1 },
  vibrate: { to: { x: [0, -2, 2, -2, 2, 0], y: [0, 2, -2, 2, -2, 0] }, duration: 0.3, ease: "linear" },
  spin: { to: { rotate: [0, 360] }, duration: 1, ease: "linear" },
  ping: { to: { scale: [1, 1.35, 1], opacity: [1, 0.2, 1] }, duration: 0.9, ease: "easeOut" },
  float: { to: { y: [0, -10, 0] }, duration: 2.4, ease: "easeInOut" },
};

export function presetFamily(preset: AnimatePreset): PresetFamily {
  if ((entrancePresets as readonly string[]).includes(preset)) return "entrance";
  if ((exitPresets as readonly string[]).includes(preset)) return "exit";
  return "emphasis";
}

function getDef(preset: AnimatePreset): PresetDef {
  return (entrance as Record<string, PresetDef>)[preset] ?? (exit as Record<string, PresetDef>)[preset] ?? emphasis[preset as EmphasisPreset];
}

/** 強調類的靜止狀態：每個屬性取關鍵影格的最後一格 */
function restOf(def: PresetDef): TargetAndTransition {
  if (def.from) return def.from;
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(def.to)) {
    rest[key] = Array.isArray(value) ? value[value.length - 1] : value;
  }
  return rest as TargetAndTransition;
}

const tags = {
  div: motion.div,
  span: motion.span,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  p: motion.p,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  figure: motion.figure,
} as const;

export type AnimateTag = keyof typeof tags;

export interface AnimateProps {
  preset: AnimatePreset;
  /** 觸發方式，預設 mount */
  trigger?: AnimateTrigger;
  /** 秒；不給就用預設各自的節奏 */
  duration?: number;
  /** 秒 */
  delay?: number;
  /** trigger="loop" 時每輪之間的停頓（秒） */
  repeatDelay?: number;
  /** 受控播放：給了就忽略 trigger，變成 true 時播放一次 */
  play?: boolean;
  as?: AnimateTag;
  /** 進場 inView 時要露出多少比例才觸發 */
  amount?: number;
  onComplete?: () => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Animate({
  preset,
  trigger = "mount",
  duration,
  delay = 0,
  repeatDelay = 1,
  play,
  as = "div",
  amount = 0.3,
  onComplete,
  className,
  style,
  children,
}: AnimateProps) {
  const reduce = useReducedMotion() ?? false;
  const family = presetFamily(preset);
  const def = getDef(preset);
  const controls = useAnimationControls();
  const ref = useRef<HTMLDivElement>(null);
  const isLoop = play === undefined && trigger === "loop";
  const inView = useInView(ref, { once: !isLoop, amount });
  const played = useRef(false);

  const variants: Variants = useMemo(() => ({ rest: restOf(def), play: def.to }), [def]);
  const transition: Transition = useMemo(
    () => ({ duration: duration ?? def.duration, delay, ease: def.ease ?? "easeOut" }),
    [duration, delay, def],
  );

  const run = useCallback(() => {
    controls.stop();
    controls.set("rest");
    played.current = true;
    if (reduce) {
      // 減少動態：進場與退場直接跳到結果，強調類不動
      if (family !== "emphasis") controls.set("play");
      onComplete?.();
      return;
    }
    void controls.start("play", transition).then(() => onComplete?.());
  }, [controls, reduce, family, transition, onComplete]);

  const restore = useCallback(() => {
    played.current = false;
    if (reduce) controls.set("rest");
    else void controls.start("rest", { duration: 0.35, ease: out });
  }, [controls, reduce]);

  // 受控播放
  useEffect(() => {
    if (play === undefined) return;
    if (play) run();
  }, [play, run]);

  // mount 與 inView
  useEffect(() => {
    if (play !== undefined) return;
    if (trigger === "mount") run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (play !== undefined || trigger !== "inView" || !inView) return;
    run();
  }, [play, trigger, inView, run]);

  // loop：離開畫面就暫停；減少動態時停在可讀的狀態
  useEffect(() => {
    if (!isLoop) return;
    if (reduce) {
      controls.stop();
      controls.set(family === "entrance" ? "play" : "rest");
      return;
    }
    if (!inView) {
      controls.stop();
      return;
    }
    controls.set("rest");
    void controls.start("play", {
      ...transition,
      repeat: Infinity,
      repeatType: family === "emphasis" ? "loop" : "reverse",
      repeatDelay,
    });
    return () => controls.stop();
  }, [isLoop, reduce, inView, family, transition, repeatDelay, controls]);

  // 進場搭配 mount/inView/loop 時從隱藏開始；其他情況先顯示，觸發時才重播
  const startHidden = family === "entrance" && (play !== undefined || trigger === "mount" || trigger === "inView" || trigger === "loop");
  const initial = startHidden && !reduce ? "rest" : family === "entrance" ? "play" : "rest";

  const interactive = play === undefined;
  const Tag = tags[as] as typeof motion.div;

  return (
    <Tag
      ref={ref}
      className={cn(as === "span" && "inline-block", className)}
      style={{ ...def.style, ...style }}
      variants={variants}
      initial={initial}
      animate={controls}
      onHoverStart={interactive && trigger === "hover" ? run : undefined}
      onHoverEnd={interactive && trigger === "hover" && family === "exit" ? restore : undefined}
      onTap={
        interactive && trigger === "click"
          ? () => {
              if (family === "exit" && played.current) restore();
              else run();
            }
          : undefined
      }
    >
      {children}
    </Tag>
  );
}

export interface StaggerProps {
  preset: AnimatePreset;
  /** 只支援 mount 與 inView，整組一起判斷 */
  trigger?: "mount" | "inView";
  /** 每個子元素之間的間隔（秒） */
  stagger?: number;
  delay?: number;
  duration?: number;
  as?: AnimateTag;
  /** 每個子元素外層的標籤 */
  itemAs?: AnimateTag;
  itemClassName?: string;
  amount?: number;
  className?: string;
  children?: ReactNode;
}

/** 依序播放每個子元素的同一個預設 */
export function Stagger({
  preset,
  trigger = "mount",
  stagger = 0.08,
  delay = 0,
  duration,
  as = "div",
  itemAs = "div",
  itemClassName,
  amount = 0.2,
  className,
  children,
}: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const Tag = tags[as] as typeof motion.div;
  const play = trigger === "mount" ? true : inView;

  return (
    <Tag ref={ref} className={className}>
      {Children.toArray(children).map((child, i) => (
        <Animate key={i} preset={preset} play={play} delay={delay + i * stagger} duration={duration} as={itemAs} className={itemClassName}>
          {child}
        </Animate>
      ))}
    </Tag>
  );
}
