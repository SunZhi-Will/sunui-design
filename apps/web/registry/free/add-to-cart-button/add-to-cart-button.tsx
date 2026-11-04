"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type AddToCartState = "idle" | "adding" | "added";

export type FlyCorner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export interface AddToCartButtonProps {
  /** 印在飛行吊牌上的商品小圖 */
  thumbnail?: ReactNode;
  /** 吊牌上的文字，通常是價格 */
  tag?: ReactNode;
  /** 目標購物車元素；沒給時飛向 fallbackCorner */
  cartRef?: RefObject<HTMLElement | null>;
  /** 沒有 cartRef 時的飛行終點 */
  fallbackCorner?: FlyCorner;
  /** 點擊後呼叫，可回傳 Promise；完成後才進入 added 狀態 */
  onAdd?: () => void | Promise<void>;
  /** 吊牌抵達購物車的那一刻呼叫（減少動態時立即呼叫），適合在此更新數量 */
  onLand?: () => void;
  /** 飛行秒數 */
  flightDuration?: number;
  /** 弧線高度（px），越大拋得越高 */
  arcHeight?: number;
  /** added 狀態維持多久後回到 idle（ms） */
  resetAfter?: number;
  disabled?: boolean;
  labels?: {
    idle?: ReactNode;
    adding?: ReactNode;
    added?: ReactNode;
    /** 給螢幕閱讀器的通知 */
    announce?: string;
  };
  className?: string;
}

const defaultLabels = {
  idle: "Add to cart",
  adding: "Adding",
  added: "Added",
  announce: "Item added to cart",
};

// 設計語言（DESIGN.md）：飛出去的是一張紙吊牌
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

type Flight = { id: number; from: DOMRect; to: { x: number; y: number } };

export function AddToCartButton({
  thumbnail,
  tag,
  cartRef,
  fallbackCorner = "top-right",
  onAdd,
  onLand,
  flightDuration = 0.6,
  arcHeight = 120,
  resetAfter = 1600,
  disabled,
  labels,
  className,
}: AddToCartButtonProps) {
  const reduceMotion = useReducedMotion();
  const t = { ...defaultLabels, ...labels };
  const [state, setState] = useState<AddToCartState>("idle");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const flightId = useRef(0);
  const landResolvers = useRef(new Map<number, () => void>());
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  function targetPoint() {
    const r = cartRef?.current?.getBoundingClientRect();
    if (r) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    return {
      x: fallbackCorner.endsWith("right") ? window.innerWidth - 32 : 32,
      y: fallbackCorner.startsWith("top") ? 32 : window.innerHeight - 32,
    };
  }

  async function handleClick() {
    if (state === "adding" || disabled) return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setState("adding");
    setAnnouncement("");

    let landed: Promise<void> = Promise.resolve();
    const from = reduceMotion ? null : buttonRef.current?.getBoundingClientRect();
    if (from) {
      const id = ++flightId.current;
      landed = new Promise((resolve) => landResolvers.current.set(id, resolve));
      setFlights((f) => [...f, { id, from, to: targetPoint() }]);
    } else {
      onLand?.();
    }

    try {
      await Promise.all([onAdd?.(), landed]);
      setState("added");
      setAnnouncement(t.announce);
      resetTimer.current = setTimeout(() => setState("idle"), resetAfter);
    } catch {
      setState("idle");
    }
  }

  return (
    <>
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-busy={state === "adding"}
        whileTap={reduceMotion || disabled ? undefined : { scale: 0.97 }}
        transition={springs.snappy}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress",
          className,
        )}
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {state === "added" ? (
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          ) : (
            <>
              <path d="M5.5 7.5h13l-.9 11.6a1.5 1.5 0 0 1-1.5 1.4H7.9a1.5 1.5 0 0 1-1.5-1.4z" />
              <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
            </>
          )}
        </svg>
        <span className="whitespace-nowrap">{state === "idle" ? t.idle : state === "adding" ? t.adding : t.added}</span>
      </motion.button>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>

      {mounted &&
        createPortal(
          flights.map((f) => (
            <FlyingTag
              key={f.id}
              flight={f}
              duration={flightDuration}
              arcHeight={arcHeight}
              thumbnail={thumbnail}
              tag={tag}
              onDone={() => {
                setFlights((all) => all.filter((x) => x.id !== f.id));
                onLand?.();
                landResolvers.current.get(f.id)?.();
                landResolvers.current.delete(f.id);
              }}
            />
          )),
          document.body,
        )}
    </>
  );
}

const TAG_W = 44;
const TAG_H = 60;

/** 沿二次貝茲曲線飛向購物車的紙吊牌，途中隨速度方向擺動 */
function FlyingTag({
  flight,
  duration,
  arcHeight,
  thumbnail,
  tag,
  onDone,
}: {
  flight: Flight;
  duration: number;
  arcHeight: number;
  thumbnail?: ReactNode;
  tag?: ReactNode;
  onDone: () => void;
}) {
  const sx = flight.from.left + flight.from.width / 2 - TAG_W / 2;
  const sy = flight.from.top - TAG_H / 2;
  const ex = flight.to.x - TAG_W / 2;
  const ey = flight.to.y - TAG_H / 2;
  const cx = (sx + ex) / 2;
  const cy = Math.min(sy, ey) - arcHeight;

  const x = useMotionValue(sx);
  const y = useMotionValue(sy);
  const rotate = useMotionValue(-6);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);

  useEffect(() => {
    const controls = animate(0, 1, {
      duration,
      ease: [0.4, 0, 0.6, 1],
      onUpdate: (p) => {
        const u = 1 - p;
        x.set(u * u * sx + 2 * u * p * cx + p * p * ex);
        y.set(u * u * sy + 2 * u * p * cy + p * p * ey);
        rotate.set(-6 + p * 18);
        scale.set(1 - p * 0.55);
        opacity.set(p > 0.85 ? (1 - p) / 0.15 : 1);
      },
      onComplete: onDone,
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.span
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed top-0 left-0 z-[100] flex origin-top flex-col items-center gap-1 rounded-[3px] border px-1 pt-3.5 pb-1 font-mono text-[9px] leading-none font-semibold tracking-tight tabular-nums shadow-[0_1px_0_rgb(0_0_0/0.04)]",
        paper,
        edge,
        ink,
      )}
      style={{ x, y, rotate, scale, opacity, width: TAG_W, height: TAG_H }}
    >
      {/* 吊牌打孔 */}
      <span className={cn("absolute top-1.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full border", edge)} />
      {thumbnail && <span className="size-7 overflow-hidden [&>*]:size-full [&>img]:object-cover">{thumbnail}</span>}
      {tag}
    </motion.span>
  );
}

export interface CartIconProps {
  /** 購物車內數量；變動時徽章像蓋章一樣壓一下 */
  count: number;
  /** 超過時顯示 99+ */
  max?: number;
  label?: string;
  ref?: Ref<HTMLButtonElement>;
  onClick?: () => void;
  className?: string;
}

/** 搭配 AddToCartButton 的購物車目標 */
export function CartIcon({ count, max = 99, label = "Cart", ref, onClick, className }: CartIconProps) {
  const reduceMotion = useReducedMotion();

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={`${label}, ${count} ${count === 1 ? "item" : "items"}`}
      className={cn(
        "relative grid size-10 place-items-center rounded-md border border-border text-foreground transition-colors hover:border-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5.5 7.5h13l-.9 11.6a1.5 1.5 0 0 1-1.5 1.4H7.9a1.5 1.5 0 0 1-1.5-1.4z" />
        <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
      </svg>
      <AnimatePresence initial={false}>
        {count > 0 && (
          // 以 count 當 key 重新掛載，每次加入都重新「壓」一次
          <motion.span
            key={count}
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-foreground px-1 font-mono text-[10px] leading-none font-semibold text-background tabular-nums ring-2 ring-background"
            initial={reduceMotion ? false : { scale: 1.5, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            transition={springs.stamp}
          >
            {count > max ? `${max}+` : count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
