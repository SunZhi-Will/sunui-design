"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type JSX,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

import { cn } from "@/lib/utils";

export const buttonEffects = [
  "rolling-text",
  "direction-fill",
  "shine-sweep",
  "rotating-border",
  "ripple",
  "magnetic",
  "jelly",
  "press-3d",
  "icon-slide",
  "expand-label",
  "border-draw",
  "neon-glow",
  "background-sweep",
  "shutter-fill",
  "underline-reveal",
  "send-feedback",
] as const;
export type ButtonEffect = (typeof buttonEffects)[number];

type NativeButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "children" | "onClick" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"
>;

export interface EffectButtonProps extends NativeButtonProps {
  /** 要套用的效果 */
  effect?: ButtonEffect;
  children?: ReactNode;
  /** send-feedback 會等待回傳的 Promise 完成才顯示勾勾 */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<unknown>;
  /** icon-slide 與 expand-label 使用的圖示，預設為箭頭與加號 */
  icon?: ReactNode;
  /** 基本轉場秒數 */
  duration?: number;
  /** send-feedback 給讀屏的狀態文字 */
  statusLabels?: { loading: string; done: string };
}

interface ImplProps {
  native: NativeButtonProps;
  children?: ReactNode;
  className?: string;
  onClick?: EffectButtonProps["onClick"];
  icon?: ReactNode;
  duration: number;
  reduce: boolean;
  forwardedRef: Ref<HTMLButtonElement>;
  statusLabels: { loading: string; done: string };
}

const ease = [0.65, 0, 0.35, 1] as const;

const base =
  "relative inline-flex h-10 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md px-5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";
const solid = "bg-primary text-primary-foreground";
const outline = "border border-border bg-background text-foreground";

export const EffectButton = forwardRef<HTMLButtonElement, EffectButtonProps>(function EffectButton(
  {
    effect = "shine-sweep",
    children,
    className,
    onClick,
    icon,
    duration = 0.4,
    statusLabels = { loading: "Sending", done: "Sent" },
    type = "button",
    ...native
  },
  ref,
) {
  const reduce = useReducedMotion() ?? false;
  const Impl = impls[effect];
  return (
    <Impl
      native={{ type, ...native }}
      className={className}
      onClick={onClick}
      icon={icon}
      duration={duration}
      reduce={reduce}
      forwardedRef={ref}
      statusLabels={statusLabels}
    >
      {children}
    </Impl>
  );
});

/* ---------- 共用小工具 ---------- */

function useMergedRef<T>(local: RefObject<T | null>, forwarded: Ref<T>) {
  return useCallback(
    (node: T | null) => {
      local.current = node;
      if (typeof forwarded === "function") forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [local, forwarded],
  );
}

/** 0 到 1 循環的進度值；active 為假時停在原地，speed 可在 hover 時加快 */
function useLoop(active: boolean, period: number, speed = 1) {
  const progress = useMotionValue(0);
  const state = useRef({ active, period, speed });
  useEffect(() => {
    state.current = { active, period, speed };
  }, [active, period, speed]);
  useAnimationFrame((_, delta) => {
    const s = state.current;
    if (!s.active) return;
    progress.set((progress.get() + (delta / 1000 / s.period) * s.speed) % 1);
  });
  return progress;
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

/** hover 類效果共用：rest / hover 兩個狀態，鍵盤 focus-visible 時也觸發 */
const hoverStates = { initial: "rest", animate: "rest", whileHover: "hover", whileFocus: "hover" } as const;
/** 減少動態時：停在 rest，不跟 hover 走 */
const restOnly = { initial: "rest", animate: "rest" } as const;

/* ---------- 各效果 ---------- */

function RollingText({ native, children, className, onClick, duration, reduce, forwardedRef }: ImplProps) {
  const text = typeof children === "string" || typeof children === "number" ? String(children) : null;
  const roll: Variants = {
    rest: (i: number) => ({ y: "0%", transition: { duration, ease, delay: i * 0.015 } }),
    hover: (i: number) => ({ y: "-50%", transition: { duration, ease, delay: i * 0.03 } }),
  };
  return (
    <motion.button
      ref={forwardedRef}
      {...native}
      onClick={onClick}
      {...(reduce ? restOnly : hoverStates)}
      className={cn(base, solid, "hover:bg-primary/90", className)}
    >
      {text === null ? (
        children
      ) : (
        <>
          <span className="sr-only">{text}</span>
          <span aria-hidden="true" className="flex">
            {Array.from(text).map((ch, i) => (
              <span key={i} className="relative inline-block h-[1.25em] overflow-hidden leading-[1.25em]">
                <motion.span className="flex flex-col" custom={i} variants={roll}>
                  <span className="whitespace-pre">{ch}</span>
                  <span className="whitespace-pre">{ch}</span>
                </motion.span>
              </span>
            ))}
          </span>
        </>
      )}
    </motion.button>
  );
}

type Side = "left" | "right" | "top" | "bottom";
const sideOrigin: Record<Side, string> = { left: "0% 50%", right: "100% 50%", top: "50% 0%", bottom: "50% 100%" };

/** 指標從哪一邊進出：取離四邊最近的一邊 */
function nearestSide(e: ReactPointerEvent<HTMLElement>): Side {
  const r = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  const d: Record<Side, number> = { left: x, right: r.width - x, top: y, bottom: r.height - y };
  return (Object.keys(d) as Side[]).reduce((a, b) => (d[b] < d[a] ? b : a));
}

function DirectionFill({ native, children, className, onClick, duration, reduce, forwardedRef }: ImplProps) {
  const fill = useRef<HTMLSpanElement>(null);
  const run = (side: Side, on: boolean) => {
    const el = fill.current;
    if (!el) return;
    const horizontal = side === "left" || side === "right";
    el.style.transformOrigin = sideOrigin[side];
    const t = { duration: reduce ? 0 : duration, ease };
    if (on) animate(el, horizontal ? { scaleX: [0, 1], scaleY: 1 } : { scaleY: [0, 1], scaleX: 1 }, t);
    else animate(el, horizontal ? { scaleX: 0, scaleY: 1 } : { scaleY: 0, scaleX: 1 }, t);
  };
  return (
    <button
      ref={forwardedRef}
      {...native}
      onClick={onClick}
      onPointerEnter={(e) => {
        native.onPointerEnter?.(e);
        if (e.pointerType !== "touch") run(nearestSide(e), true);
      }}
      onPointerLeave={(e) => {
        native.onPointerLeave?.(e);
        if (e.pointerType !== "touch") run(nearestSide(e), false);
      }}
      className={cn(base, outline, "group overflow-hidden hover:text-primary-foreground", className)}
    >
      <span ref={fill} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-primary" style={{ transform: "scaleX(0)" }} />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

function ShineSweep({ native, children, className, onClick, reduce, forwardedRef }: ImplProps) {
  const local = useRef<HTMLButtonElement>(null);
  const ref = useMergedRef(local, forwardedRef);
  const inView = useInView(local);
  const [hover, setHover] = useState(false);
  const progress = useLoop(inView && !reduce, 3.2, hover ? 3 : 1);
  // 前 40% 的時間掃過，其餘時間停在按鈕外
  const x = useTransform(progress, (v) => `${v < 0.4 ? -130 + (v / 0.4) * 440 : 310}%`);
  return (
    <motion.button
      ref={ref}
      {...native}
      onClick={onClick}
      onPointerEnter={(e) => {
        native.onPointerEnter?.(e);
        setHover(true);
      }}
      onPointerLeave={(e) => {
        native.onPointerLeave?.(e);
        setHover(false);
      }}
      className={cn(base, solid, "overflow-hidden hover:bg-primary/90", className)}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[35%] -skew-x-12 bg-gradient-to-r from-transparent via-primary-foreground/35 to-transparent"
        style={{ x }}
      />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

function RotatingBorder({ native, children, className, onClick, reduce, forwardedRef }: ImplProps) {
  const local = useRef<HTMLButtonElement>(null);
  const ref = useMergedRef(local, forwardedRef);
  const inView = useInView(local);
  const progress = useLoop(inView && !reduce, 3);
  const rotate = useTransform(progress, (v) => v * 360);
  return (
    <motion.button
      ref={ref}
      {...native}
      onClick={onClick}
      className={cn(base, "overflow-hidden bg-border p-[1.5px] text-foreground", className)}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[250%]"
        style={{
          x: "-50%",
          y: "-50%",
          rotate,
          background: "conic-gradient(from 0deg, transparent 0deg 240deg, var(--primary) 330deg, transparent 360deg)",
        }}
      />
      <span className="relative z-10 flex h-full w-full items-center justify-center gap-2 rounded-[4.5px] bg-background px-5 transition-colors hover:bg-muted">
        {children}
      </span>
    </motion.button>
  );
}

interface RippleDot {
  id: number;
  x: number;
  y: number;
  size: number;
}

function Ripple({ native, children, className, onClick, reduce, forwardedRef }: ImplProps) {
  const [ripples, setRipples] = useState<RippleDot[]>([]);
  const nextId = useRef(0);
  return (
    <button
      ref={forwardedRef}
      {...native}
      onClick={onClick}
      onPointerDown={(e) => {
        native.onPointerDown?.(e);
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        // 直徑取到最遠角落，確保漣漪蓋滿按鈕
        const size = 2 * Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
        const id = nextId.current++;
        setRipples((list) => [...list, { id, x, y, size }]);
      }}
      className={cn(base, solid, "overflow-hidden hover:bg-primary/90", className)}
    >
      {ripples.map((d) => (
        <motion.span
          key={d.id}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full bg-current"
          style={{ left: d.x - d.size / 2, top: d.y - d.size / 2, width: d.size, height: d.size }}
          initial={{ scale: 0, opacity: 0.35 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          onAnimationComplete={() => setRipples((list) => list.filter((r) => r.id !== d.id))}
        />
      ))}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

function Magnetic({ native, children, className, onClick, reduce, forwardedRef }: ImplProps) {
  const local = useRef<HTMLButtonElement>(null);
  const ref = useMergedRef(local, forwardedRef);
  const inView = useInView(local);
  const spring = { stiffness: 220, damping: 15, mass: 0.4 };
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);
  const labelX = useTransform(x, (v) => v * 0.4);
  const labelY = useTransform(y, (v) => v * 0.4);

  useEffect(() => {
    if (reduce || !inView) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const el = local.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // 扣掉目前位移，以原始中心計算距離
      const dx = e.clientX - (r.left + r.width / 2 - x.get());
      const dy = e.clientY - (r.top + r.height / 2 - y.get());
      const reach = Math.max(r.width, r.height) / 2 + 48;
      if (Math.hypot(dx, dy) < reach) {
        x.set(dx * 0.35);
        y.set(dy * 0.35);
      } else {
        x.set(0);
        y.set(0);
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      x.set(0);
      y.set(0);
    };
  }, [reduce, inView, x, y]);

  return (
    <motion.button
      ref={ref}
      {...native}
      onClick={onClick}
      style={{ ...native.style, x, y }}
      className={cn(base, solid, "rounded-full hover:bg-primary/90", className)}
    >
      <motion.span className="inline-flex items-center gap-2" style={{ x: labelX, y: labelY }}>
        {children}
      </motion.span>
    </motion.button>
  );
}

function Jelly({ native, children, className, onClick, reduce, forwardedRef }: ImplProps) {
  return (
    <motion.button
      ref={forwardedRef}
      {...native}
      onClick={onClick}
      whileHover={
        reduce
          ? undefined
          : { scaleX: [1, 1.14, 0.92, 1.05, 0.98, 1], scaleY: [1, 0.86, 1.08, 0.96, 1.02, 1], transition: { duration: 0.7 } }
      }
      whileTap={reduce ? undefined : { scaleX: 1.1, scaleY: 0.88, transition: { type: "spring", stiffness: 500, damping: 12 } }}
      className={cn(base, solid, "rounded-full hover:bg-primary/90", className)}
    >
      {children}
    </motion.button>
  );
}

function Press3D({ native, children, className, onClick, reduce, forwardedRef }: ImplProps) {
  const t = { duration: reduce ? 0 : 0.08, ease: "easeOut" as const };
  const face: Variants = { rest: { y: 0, transition: t }, hover: { y: 1, transition: t }, pressed: { y: 6, transition: t } };
  return (
    <motion.button
      ref={forwardedRef}
      {...native}
      onClick={onClick}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="pressed"
      className={cn(base, "h-[46px] items-start bg-transparent p-0", className)}
    >
      {/* 底下的厚度：同色加一層暗色，換主題也能看出深度 */}
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 top-1.5 rounded-md bg-primary">
        <span className="absolute inset-0 rounded-md bg-black/35" />
      </span>
      <motion.span
        variants={face}
        className="relative flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-primary-foreground"
      >
        {children}
      </motion.span>
    </motion.button>
  );
}

function IconSlide({ native, children, className, onClick, icon, duration, reduce, forwardedRef }: ImplProps) {
  const t = { duration, ease };
  const out: Variants = { rest: { x: "0%", transition: t }, hover: { x: "130%", transition: t } };
  const into: Variants = { rest: { x: "-130%", transition: t }, hover: { x: "0%", transition: t } };
  return (
    <motion.button
      ref={forwardedRef}
      {...native}
      onClick={onClick}
      {...(reduce ? restOnly : hoverStates)}
      className={cn(base, solid, "hover:bg-primary/90", className)}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="relative size-4 overflow-hidden">
        <motion.span className="absolute inset-0 grid place-items-center" variants={out}>
          {icon ?? <ArrowIcon />}
        </motion.span>
        <motion.span className="absolute inset-0 grid place-items-center" variants={into}>
          {icon ?? <ArrowIcon />}
        </motion.span>
      </span>
    </motion.button>
  );
}

function ExpandLabel({ native, children, className, onClick, icon, duration, reduce, forwardedRef }: ImplProps) {
  const t = { duration, ease };
  const shell: Variants = { rest: { width: "2.5rem", transition: t }, hover: { width: "auto", transition: t } };
  const plus: Variants = { rest: { rotate: 0, transition: t }, hover: { rotate: 90, transition: t } };
  const label: Variants = { rest: { opacity: 0, transition: t }, hover: { opacity: 1, transition: t } };
  // 減少動態時直接展開，標籤不會被藏起來
  const states = reduce ? { initial: "hover", animate: "hover" } : hoverStates;
  return (
    <motion.button
      ref={forwardedRef}
      {...native}
      onClick={onClick}
      {...states}
      variants={shell}
      className={cn(base, solid, "justify-start gap-0 overflow-hidden rounded-full px-0", className)}
    >
      <motion.span aria-hidden="true" className="grid size-10 shrink-0 place-items-center" variants={plus}>
        {icon ?? <PlusIcon />}
      </motion.span>
      <motion.span className="pr-5" variants={label}>
        {children}
      </motion.span>
    </motion.button>
  );
}

const drawLines = [
  { cls: "left-0 top-0 h-0.5 w-full", axis: "x", origin: "0% 50%" },
  { cls: "right-0 top-0 h-full w-0.5", axis: "y", origin: "50% 0%" },
  { cls: "bottom-0 right-0 h-0.5 w-full", axis: "x", origin: "100% 50%" },
  { cls: "bottom-0 left-0 h-full w-0.5", axis: "y", origin: "50% 100%" },
] as const;

function BorderDraw({ native, children, className, onClick, duration, reduce, forwardedRef }: ImplProps) {
  const step = reduce ? 0 : duration * 0.5;
  return (
    <motion.button
      ref={forwardedRef}
      {...native}
      onClick={onClick}
      {...hoverStates}
      className={cn(base, "rounded-none border border-border bg-transparent text-foreground", className)}
    >
      {drawLines.map((l, i) => {
        // 進場依序畫出四邊，離開時反向收回
        const rest = { duration: step, ease: "linear" as const, delay: reduce ? 0 : (3 - i) * step };
        const hover = { duration: step, ease: "linear" as const, delay: reduce ? 0 : i * step };
        const v: Variants =
          l.axis === "x"
            ? { rest: { scaleX: 0, transition: rest }, hover: { scaleX: 1, transition: hover } }
            : { rest: { scaleY: 0, transition: rest }, hover: { scaleY: 1, transition: hover } };
        return (
          <motion.span
            key={i}
            aria-hidden="true"
            className={cn("pointer-events-none absolute -m-px bg-primary", l.cls)}
            style={{ transformOrigin: l.origin }}
            variants={v}
          />
        );
      })}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

function NeonGlow({ native, children, className, onClick, reduce, forwardedRef }: ImplProps) {
  const local = useRef<HTMLButtonElement>(null);
  const ref = useMergedRef(local, forwardedRef);
  const inView = useInView(local);
  const progress = useLoop(inView && !reduce, 2.4);
  const breathe = useTransform(progress, (v) => 0.3 + 0.4 * (0.5 - 0.5 * Math.cos(v * Math.PI * 2)));
  return (
    <motion.button
      ref={ref}
      {...native}
      onClick={onClick}
      className={cn(
        base,
        "group border border-primary bg-transparent text-primary duration-300 hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground",
        className,
      )}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit]"
        style={{ opacity: breathe, boxShadow: "0 0 12px 0 var(--primary), inset 0 0 8px 0 var(--primary)" }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{ boxShadow: "0 0 28px 4px var(--primary)" }}
      />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

function BackgroundSweep({ native, children, className, onClick, duration, reduce, forwardedRef }: ImplProps) {
  const t = { scaleX: { duration: reduce ? 0 : duration, ease }, originX: { duration: 0 } };
  // 從左邊掃入，離開時往右邊收走
  const fill: Variants = { rest: { scaleX: 0, originX: 1, transition: t }, hover: { scaleX: 1, originX: 0, transition: t } };
  return (
    <motion.button
      ref={forwardedRef}
      {...native}
      onClick={onClick}
      {...hoverStates}
      className={cn(base, outline, "overflow-hidden hover:text-primary-foreground focus-visible:text-primary-foreground", className)}
    >
      <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-primary" variants={fill} />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

function ShutterFill({ native, children, className, onClick, duration, reduce, forwardedRef }: ImplProps) {
  const t = { duration: reduce ? 0 : duration, ease };
  const half: Variants = { rest: { scaleX: 0, transition: t }, hover: { scaleX: 1, transition: t } };
  return (
    <motion.button
      ref={forwardedRef}
      {...native}
      onClick={onClick}
      {...hoverStates}
      className={cn(base, outline, "overflow-hidden hover:text-primary-foreground focus-visible:text-primary-foreground", className)}
    >
      <motion.span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[51%] bg-primary" style={{ originX: 0 }} variants={half} />
      <motion.span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[51%] bg-primary" style={{ originX: 1 }} variants={half} />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

function UnderlineReveal({ native, children, className, onClick, duration, reduce, forwardedRef }: ImplProps) {
  const t = { duration: reduce ? 0 : duration, ease };
  const line: Variants = { rest: { scaleX: 0, transition: t }, hover: { scaleX: 1, transition: t } };
  return (
    <motion.button
      ref={forwardedRef}
      {...native}
      onClick={onClick}
      {...hoverStates}
      className={cn(base, "h-auto rounded-sm bg-transparent px-0.5 py-1 text-foreground", className)}
    >
      <span className="relative inline-flex items-center gap-2">
        {children}
        <motion.span aria-hidden="true" className="absolute -bottom-0.5 left-0 h-px w-full bg-current" style={{ originX: 0.5 }} variants={line} />
      </span>
    </motion.button>
  );
}

type Phase = "idle" | "loading" | "done";
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function SendFeedback({ native, children, className, onClick, reduce, forwardedRef, statusLabels }: ImplProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    if (phase !== "idle") return;
    setPhase("loading");
    try {
      const result = onClick?.(e);
      // 有回傳 Promise 就等它；沒有就模擬一段送出時間
      if (result instanceof Promise) await result;
      else await wait(1100);
      if (!mounted.current) return;
      setPhase("done");
      await wait(1600);
      if (mounted.current) setPhase("idle");
    } catch {
      if (mounted.current) setPhase("idle");
    }
  };

  const fade = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

  return (
    <motion.button
      ref={forwardedRef}
      {...native}
      onClick={handleClick}
      layout={!reduce}
      aria-busy={phase === "loading"}
      aria-disabled={phase !== "idle" || undefined}
      transition={{ layout: { duration: 0.3, ease } }}
      style={{ ...native.style, borderRadius: phase === "idle" ? 6 : 20 }}
      className={cn(base, solid, "overflow-hidden", phase !== "idle" && "w-10 px-0", className)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {phase === "idle" && (
          <motion.span key="idle" {...fade} className="inline-flex items-center gap-2">
            {children}
          </motion.span>
        )}
        {phase === "loading" && (
          <motion.span key="loading" {...fade} aria-hidden="true" className="grid place-items-center">
            <motion.svg
              viewBox="0 0 16 16"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              animate={reduce ? undefined : { rotate: 360 }}
              transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
            >
              <circle cx="8" cy="8" r="6" opacity="0.3" />
              <path d="M8 2a6 6 0 0 1 6 6" />
            </motion.svg>
          </motion.span>
        )}
        {phase === "done" && (
          <motion.span key="done" {...fade} aria-hidden="true" className="grid place-items-center">
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <motion.path
                d="M3.5 8.5l3 3 6-7"
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
              />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {phase === "loading" ? statusLabels.loading : phase === "done" ? statusLabels.done : ""}
      </span>
    </motion.button>
  );
}

const impls: Record<ButtonEffect, (props: ImplProps) => JSX.Element> = {
  "rolling-text": RollingText,
  "direction-fill": DirectionFill,
  "shine-sweep": ShineSweep,
  "rotating-border": RotatingBorder,
  ripple: Ripple,
  magnetic: Magnetic,
  jelly: Jelly,
  "press-3d": Press3D,
  "icon-slide": IconSlide,
  "expand-label": ExpandLabel,
  "border-draw": BorderDraw,
  "neon-glow": NeonGlow,
  "background-sweep": BackgroundSweep,
  "shutter-fill": ShutterFill,
  "underline-reveal": UnderlineReveal,
  "send-feedback": SendFeedback,
};
