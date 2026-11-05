"use client";

import { motion, useReducedMotion, type TargetAndTransition, type Transition } from "framer-motion";
import { useMemo, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * SunUI 的印章。整套唯一的慶祝，但依「這是什麼結果」換形狀：
 * - tick：小確認（已複製、已儲存、已驗證、已加入）。墨線打勾，不是章
 * - box：交易狀態（已領取、已套用、已售完、已結束）
 * - seal：成就與中獎（中獎、升等、集滿、解鎖）
 * - date：有時間的紀錄（已付款、郵戳、訂單節點），印上日期
 * - chop：個人或中日文情境（受邀、會員名），方形落款章
 * 結果以外的標籤（推薦、熱門）不要用印章。
 */
export type StampShape = "tick" | "box" | "seal" | "date" | "chop";
export type StampTone = "vermilion" | "ink";
export type StampSize = "sm" | "md" | "lg";

export interface StampProps {
  children?: ReactNode;
  shape?: StampShape;
  /** vermilion：正面結果；ink：失效、結束、未中獎。tick 預設 ink，其餘預設 vermilion */
  tone?: StampTone;
  size?: StampSize;
  /** 同一個 seed 永遠得到同樣的角度、位移與墨色紋理，例如訂單或券的 id */
  seed?: string | number;
  /** date 章印的日期；seal 也可當第二行 */
  date?: Date | string | number;
  /** seal 的第二行，例如等級名稱 */
  sub?: ReactNode;
  /** chop 改成白文（朱底紙色字） */
  filled?: boolean;
  /** 加一道斜線，表示作廢 */
  void?: boolean;
  /** false 時直接顯示，不播放蓋下的動作（例如重新整理後的已領取狀態） */
  appear?: boolean;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

const vermilion = "text-[#c8361d] dark:text-[#ec6a4f]";
const ink = "text-[#1c1917]/70 dark:text-[#ece7dc]/70";
const paperText = "text-[#faf7f0] dark:text-[#1f1c18]";

const stampSpring = { type: "spring", stiffness: 620, damping: 20, mass: 0.8 } as const;
const heavySpring = { type: "spring", stiffness: 520, damping: 22, mass: 1.1 } as const;

/** 字串轉成穩定的 0 到 1 亂數，讓同一頁的章各自有點不同 */
function rand(seed: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/** 每種形狀的落定角度範圍：落款章幾乎是正的，圓章轉多少看不太出來 */
const ROTATION: Record<StampShape, [number, number]> = {
  tick: [-6, 0],
  box: [-12, -8],
  date: [-12, -8],
  seal: [-16, -6],
  chop: [-4, -1],
};

/** 墨色不均：用雜訊做遮罩，讓章面有沒沾到墨的小斑點。這是材質，不是漸層 */
function inkMask(seed: string): CSSProperties {
  const s = Math.floor(rand(seed, 7) * 997);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${s}"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 1.75"/></filter><rect width="120" height="120" filter="url(#n)"/></svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  return { maskImage: url, WebkitMaskImage: url, maskSize: "120px 120px", WebkitMaskSize: "120px 120px" };
}

function formatDate(value: Date | string | number) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

const TEXT: Record<StampSize, string> = { sm: "text-[10px]", md: "text-xs", lg: "text-base" };
const PAD: Record<StampSize, string> = { sm: "px-1.5 py-0.5", md: "px-2 py-0.5", lg: "px-3 py-1" };
const SEAL: Record<StampSize, string> = { sm: "size-14", md: "size-[4.5rem]", lg: "size-24" };
const CHOP: Record<StampSize, string> = { sm: "min-h-10 min-w-10 text-xs", md: "min-h-14 min-w-14 text-sm", lg: "min-h-20 min-w-20 text-lg" };
const TICK: Record<StampSize, string> = { sm: "size-3.5", md: "size-4", lg: "size-5" };

export function Stamp({
  children,
  shape = "box",
  tone: toneProp,
  size = "md",
  seed,
  date,
  sub,
  filled = false,
  void: voided = false,
  appear = true,
  delay = 0,
  className,
  style,
}: StampProps) {
  const reduce = useReducedMotion() ?? false;
  const tone = toneProp ?? (shape === "tick" ? "ink" : "vermilion");
  const key = String(seed ?? (typeof children === "string" ? children : shape));
  const { rotate, dx, dy, mask } = useMemo(() => {
    const [lo, hi] = ROTATION[shape];
    return {
      rotate: lo + (hi - lo) * rand(key, 1),
      dx: (rand(key, 2) - 0.5) * 4,
      dy: (rand(key, 3) - 0.5) * 4,
      mask: inkMask(key),
    };
  }, [key, shape]);

  const color = tone === "vermilion" ? vermilion : ink;
  const opacity = tone === "vermilion" ? 0.9 : 0.6;
  const settled: TargetAndTransition = { scale: 1, opacity, rotate, x: dx, y: dy };
  const transition: Transition = reduce ? { duration: 0 } : { ...(size === "lg" ? heavySpring : stampSpring), delay };
  // 圓章與方框從高處壓下；落款章是直直按下去，不轉
  const lifted = shape === "chop" ? { scale: 1.25, opacity: 0, rotate, x: dx, y: dy } : { scale: size === "lg" ? 1.4 : 1.6, opacity: 0, rotate: rotate + 6, x: dx, y: dy };
  const initial = reduce || !appear ? false : lifted;
  const exit = { opacity: 0, transition: { duration: reduce ? 0 : 0.15 } };

  if (shape === "tick") {
    return (
      <motion.span
        aria-hidden="true"
        initial={reduce || !appear ? false : { opacity: 0 }}
        animate={{ opacity: 1, rotate, x: dx }}
        exit={exit}
        transition={reduce ? { duration: 0 } : { duration: 0.12, delay }}
        style={style}
        className={cn("pointer-events-none inline-flex items-center gap-1 font-medium whitespace-nowrap", TEXT[size], tone === "vermilion" ? vermilion : "text-[#1c1917] dark:text-[#ece7dc]", className)}
      >
        <svg viewBox="0 0 24 24" className={TICK[size]} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            initial={reduce || !appear ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.28, ease: "easeOut", delay }}
          />
        </svg>
        {children}
      </motion.span>
    );
  }

  const strike = voided && <span aria-hidden="true" className="absolute top-1/2 -right-1 -left-1 h-0.5 -rotate-12 bg-current" />;
  const base = cn("pointer-events-none relative inline-flex font-bold whitespace-nowrap uppercase mix-blend-multiply dark:mix-blend-screen", color, className);

  if (shape === "seal") {
    return (
      <motion.span aria-hidden="true" initial={initial} animate={settled} exit={exit} transition={transition} style={{ ...mask, ...style }} className={cn(base, "items-center justify-center rounded-full border-2 border-current", SEAL[size])}>
        <span className="absolute inset-[3px] rounded-full border border-current" />
        <span className={cn("flex max-w-[78%] flex-col items-center text-center leading-tight tracking-[0.12em] whitespace-normal", size === "lg" ? "text-sm" : size === "md" ? "text-[10px]" : "text-[9px]")}>
          <span>{children}</span>
          {(sub || date) && <span className="mt-0.5 border-t border-current pt-0.5 font-mono text-[0.8em] tracking-[0.08em]">{sub ?? formatDate(date!)}</span>}
        </span>
        {strike}
      </motion.span>
    );
  }

  if (shape === "date") {
    return (
      <motion.span aria-hidden="true" initial={initial} animate={settled} exit={exit} transition={transition} style={{ ...mask, ...style }} className={cn(base, "flex-col items-center rounded-[3px] border-2 border-current leading-none", PAD[size], TEXT[size])}>
        <span className="tracking-[0.2em]">{children}</span>
        {date !== undefined && <span className="mt-1 w-full border-t border-current pt-1 text-center font-mono text-[0.85em] tracking-[0.08em] tabular-nums">{formatDate(date)}</span>}
        {strike}
      </motion.span>
    );
  }

  if (shape === "chop") {
    return (
      <motion.span
        aria-hidden="true"
        initial={initial}
        animate={settled}
        exit={exit}
        transition={transition}
        style={{ ...mask, ...style }}
        className={cn(base, "items-center justify-center rounded-[2px] border-2 border-current p-1 normal-case [writing-mode:vertical-rl]", CHOP[size], filled && "bg-current")}
      >
        <span className={cn("tracking-[0.1em]", filled && paperText)}>{children}</span>
        {strike}
      </motion.span>
    );
  }

  return (
    <motion.span aria-hidden="true" initial={initial} animate={settled} exit={exit} transition={transition} style={{ ...mask, ...style }} className={cn(base, "items-center rounded-[3px] border-2 border-current tracking-[0.2em]", PAD[size], TEXT[size])}>
      {children}
      {strike}
    </motion.span>
  );
}
