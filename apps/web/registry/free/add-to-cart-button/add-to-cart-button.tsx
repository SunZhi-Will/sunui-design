"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type AddToCartState = "idle" | "adding" | "added";

export type FlyCorner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export interface AddToCartButtonProps {
  /** 飛行中的縮圖，通常是商品圖片 */
  thumbnail: ReactNode;
  /** 目標購物車元素；沒給時飛向 fallbackCorner */
  cartRef?: RefObject<HTMLElement | null>;
  /** 沒有 cartRef 時的飛行終點 */
  fallbackCorner?: FlyCorner;
  /** 點擊後呼叫，可回傳 Promise；完成後才進入 added 狀態 */
  onAdd?: () => void | Promise<void>;
  /** 縮圖抵達購物車的那一刻呼叫（減少動態時立即呼叫），適合在此更新數量 */
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

type Flight = { id: number; from: DOMRect; to: { x: number; y: number } };

const labelVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export function AddToCartButton({
  thumbnail,
  cartRef,
  fallbackCorner = "top-right",
  onAdd,
  onLand,
  flightDuration = 0.75,
  arcHeight = 140,
  resetAfter = 1600,
  disabled,
  labels,
  className,
}: AddToCartButtonProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...defaultLabels, ...labels };
  const [state, setState] = useState<AddToCartState>("idle");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
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
    const el = cartRef?.current;
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = fallbackCorner.endsWith("right") ? w - 32 : 32;
    const y = fallbackCorner.startsWith("top") ? 32 : h - 32;
    return { x, y };
  }

  async function handleClick() {
    if (state === "adding" || disabled) return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setState("adding");
    setAnnouncement("");

    let flightDone: Promise<void> = Promise.resolve();
    const from = reduceMotion ? null : (thumbRef.current ?? buttonRef.current)?.getBoundingClientRect();
    if (from) {
      const id = ++flightId.current;
      flightDone = new Promise((resolve) => {
        landResolvers.current.set(id, resolve);
      });
      setFlights((f) => [...f, { id, from, to: targetPoint() }]);
    } else {
      onLand?.();
    }

    try {
      await Promise.all([onAdd?.(), flightDone]);
      setState("added");
      setAnnouncement(text.announce);
      resetTimer.current = setTimeout(() => setState("idle"), resetAfter);
    } catch {
      setState("idle");
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-busy={state === "adding"}
        className={cn(
          "group relative inline-flex h-11 items-center gap-2.5 overflow-hidden rounded-full pr-5 pl-1.5 text-sm font-medium transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          state === "added"
            ? "bg-emerald-600 text-white"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
          className,
        )}
      >
        <span
          ref={thumbRef}
          className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-background/20 [&>img]:size-full [&>img]:object-cover"
          aria-hidden="true"
        >
          <AnimatePresence mode="wait" initial={false}>
            {state === "added" ? (
              <motion.svg
                key="check"
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={reduceMotion ? undefined : { scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                />
              </motion.svg>
            ) : (
              <motion.span
                key="thumb"
                className="grid size-full place-items-center"
                initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: state === "adding" ? 0.85 : 1, opacity: state === "adding" ? 0.5 : 1 }}
                exit={reduceMotion ? undefined : { scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {thumbnail}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="relative grid">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={state}
              variants={labelVariants}
              initial={reduceMotion ? false : "initial"}
              animate="animate"
              exit={reduceMotion ? undefined : "exit"}
              transition={{ duration: 0.18 }}
              className="whitespace-nowrap"
            >
              {state === "idle" ? text.idle : state === "adding" ? text.adding : text.added}
            </motion.span>
          </AnimatePresence>
        </span>
      </button>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>

      {mounted &&
        createPortal(
          flights.map((f) => (
            <Flyer
              key={f.id}
              flight={f}
              duration={flightDuration}
              arcHeight={arcHeight}
              onDone={() => {
                setFlights((all) => all.filter((x) => x.id !== f.id));
                onLand?.();
                landResolvers.current.get(f.id)?.();
                landResolvers.current.delete(f.id);
              }}
            >
              {thumbnail}
            </Flyer>
          )),
          document.body,
        )}
    </>
  );
}

function Flyer({
  flight,
  duration,
  arcHeight,
  onDone,
  children,
}: {
  flight: Flight;
  duration: number;
  arcHeight: number;
  onDone: () => void;
  children: ReactNode;
}) {
  const size = 40;
  const startX = flight.from.left + flight.from.width / 2 - size / 2;
  const startY = flight.from.top + flight.from.height / 2 - size / 2;
  const endX = flight.to.x - size / 2;
  const endY = flight.to.y - size / 2;
  // 二次貝茲曲線的控制點：取中點再往上拉
  const ctrlX = (startX + endX) / 2;
  const ctrlY = Math.min(startY, endY) - arcHeight;

  const x = useMotionValue(startX);
  const y = useMotionValue(startY);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);

  useEffect(() => {
    const controls = animate(0, 1, {
      duration,
      ease: [0.45, 0, 0.55, 1],
      onUpdate: (t) => {
        const u = 1 - t;
        x.set(u * u * startX + 2 * u * t * ctrlX + t * t * endX);
        y.set(u * u * startY + 2 * u * t * ctrlY + t * t * endY);
        scale.set(1 - t * 0.6);
        opacity.set(t > 0.85 ? (1 - t) / 0.15 : 1);
      },
      onComplete: onDone,
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[100] grid place-items-center overflow-hidden rounded-full border-2 border-background bg-card shadow-lg [&>img]:size-full [&>img]:object-cover"
      style={{ x, y, scale, opacity, width: size, height: size }}
    >
      {children}
    </motion.span>
  );
}

export interface CartIconProps {
  /** 購物車內數量；變動時徽章會跳一下 */
  count: number;
  /** 超過時顯示 99+ */
  max?: number;
  label?: string;
  ref?: Ref<HTMLButtonElement>;
  onClick?: () => void;
  className?: string;
}

/** 搭配 AddToCartButton 的購物車目標，數量改變時徽章彈跳 */
export function CartIcon({ count, max = 99, label = "Cart", ref, onClick, className }: CartIconProps) {
  const reduceMotion = useReducedMotion();
  const shown = count > max ? `${max}+` : String(count);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={`${label}, ${count} ${count === 1 ? "item" : "items"}`}
      className={cn(
        "relative grid size-11 place-items-center rounded-full border border-border bg-card text-card-foreground transition-colors hover:bg-muted",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <motion.svg
        key={reduceMotion ? "static" : `cart-${count}`}
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduceMotion || count === 0 ? false : { rotate: -12 }}
        animate={{ rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 12 }}
        aria-hidden="true"
      >
        <path d="M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2" />
        <circle cx="9.5" cy="19.5" r="1.3" />
        <circle cx="17" cy="19.5" r="1.3" />
      </motion.svg>
      <AnimatePresence initial={false}>
        {count > 0 && (
          <motion.span
            key="badge"
            aria-hidden="true"
            className="absolute -top-1 -right-1"
            initial={reduceMotion ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            exit={reduceMotion ? undefined : { scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 18 }}
          >
            {/* 以 count 當 key 重新掛載，觸發每次加入時的彈跳 */}
            <motion.span
              key={count}
              className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] leading-none font-semibold text-white tabular-nums ring-2 ring-background"
              initial={reduceMotion ? false : { scale: 1.45 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 14 }}
            >
              {shown}
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
