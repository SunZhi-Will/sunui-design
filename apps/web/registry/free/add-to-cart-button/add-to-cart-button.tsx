"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type AddToCartState = "idle" | "adding" | "added";

export type FlyCorner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export interface AddToCartButtonProps {
  /** Small product image printed on the flying tag */
  thumbnail?: ReactNode;
  /** Text on the tag, usually the price */
  tag?: ReactNode;
  /** Target cart element. When omitted, the tag flies to fallbackCorner */
  cartRef?: RefObject<HTMLElement | null>;
  /** Where the tag lands when there is no cartRef */
  fallbackCorner?: FlyCorner;
  /** Called on click. May return a Promise; the added state starts once it resolves */
  onAdd?: () => void | Promise<void>;
  /** Called the moment the tag reaches the cart (immediately under reduced motion). A good place to update the count */
  onLand?: () => void;
  /** Flight duration in seconds */
  flightDuration?: number;
  /** Arc height in px. Larger values throw the tag higher */
  arcHeight?: number;
  /** How long the added state lasts before returning to idle (ms) */
  resetAfter?: number;
  disabled?: boolean;
  /** Replaces the shopping bag icon on the button (shown in idle and adding; added keeps the check). Any SVG is scaled to 16px */
  icon?: ReactNode;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Overrides the built-in strings. Takes priority over locale */
  labels?: {
    idle?: ReactNode;
    adding?: ReactNode;
    added?: ReactNode;
    /** Announcement for screen readers */
    announce?: string;
  };
  className?: string;
}

export interface AddToCartLabels {
  idle: ReactNode;
  adding: ReactNode;
  added: ReactNode;
  announce: string;
  /** Name and item count description for CartIcon */
  cart: string;
  items: (count: number) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Maps any language tag to one of the four built-in languages, falling back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, AddToCartLabels> = {
  en: {
    idle: "Add to cart",
    adding: "Adding",
    added: "Added",
    announce: "Item added to cart",
    cart: "Cart",
    items: (n) => `${n} ${n === 1 ? "item" : "items"}`,
  },
  "zh-TW": {
    idle: "加入購物車",
    adding: "加入中",
    added: "已加入",
    announce: "商品已加入購物車",
    cart: "購物車",
    items: (n) => `${n} 件商品`,
  },
  "zh-CN": {
    idle: "加入购物车",
    adding: "加入中",
    added: "已加入",
    announce: "商品已加入购物车",
    cart: "购物车",
    items: (n) => `${n} 件商品`,
  },
  ja: {
    idle: "カートに追加",
    adding: "追加中",
    added: "追加済み",
    announce: "カートに商品を追加しました",
    cart: "カート",
    items: (n) => `${n} 点`,
  },
};

// Design language (DESIGN.md, craft quality): the raised button has a top-edge highlight and bottom-edge thickness, and what flies out is a floating mini product card
const raised = "shadow-[inset_0_1px_0_rgb(255_255_255/0.16),inset_0_-1px_0_rgb(0_0_0/0.12),0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.10),0_2px_6px_-2px_rgb(0_0_0/0.08)]";
const e1 = "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]";
const e2 = "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_4px_8px_-4px_rgb(0_0_0/0.06),0_12px_20px_-8px_rgb(0_0_0/0.08)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_0_0_1px_rgb(255_255_255/0.10)]";
/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand colour. Used only on the primary button and the count badge */
const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";
const spotInk = "bg-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  pop: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
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
  icon,
  locale = "en",
  labels,
  className,
}: AddToCartButtonProps) {
  const reduceMotion = useReducedMotion();
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
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

  const label = { idle: t.idle, adding: t.adding, added: t.added };
  // Old content exits upward over 100ms, new content enters from below with gentle. Under reduced motion it swaps instantly
  const swap = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0 } } }
    : {
        initial: { opacity: 0, y: "70%" },
        animate: { opacity: 1, y: 0, transition: springs.gentle },
        exit: { opacity: 0, y: "-70%", transition: { duration: 0.1, ease: "easeIn" } },
      };

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
          spotFill,
          raised,
          "group relative isolate inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-md px-4 text-sm font-medium",
          // Simulates top light: at most a 3% lightness difference from top to bottom
          "bg-[linear-gradient(to_bottom,rgb(255_255_255/0.07),transparent_60%)]",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress",
          className,
        )}
      >
        {/* Hover overlay: 0ms in, 150ms out. Uses the foreground colour so it works in both light and dark themes */}
        <span
          aria-hidden="true"
          className={cn(spotInk, "pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-150 group-hover:opacity-[0.08] group-hover:duration-0 group-disabled:hidden")}
        />
        {/* All three states are stacked in one grid cell: width follows the longest row so switching never jumps, and the visible row is centred */}
        <span className="grid place-items-center whitespace-nowrap">
          {(["idle", "adding", "added"] as const).map((s) => (
            <span key={s} aria-hidden="true" className="invisible col-start-1 row-start-1 flex items-center gap-2">
              <span className="size-4" />
              {label[s]}
            </span>
          ))}
          <span className="col-start-1 row-start-1 flex items-center gap-2">
            {/* The icon is the anchor: when the text gets shorter or longer it slides to its new position instead of jumping */}
            <motion.span layout={reduceMotion ? false : "position"} transition={springs.gentle} aria-hidden="true" className="grid size-4 shrink-0 place-items-center">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={state}
                  className="grid place-items-center [&_svg]:size-4"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1, transition: state === "added" ? springs.pop : springs.snappy }}
                  exit={{ opacity: 0, scale: 0.6, transition: { duration: reduceMotion ? 0 : 0.1 } }}
                >
                  {state === "added" ? <Check animate={!reduceMotion} /> : state === "adding" ? <Spinner spin={!reduceMotion} /> : icon ?? <BagIcon />}
                </motion.span>
              </AnimatePresence>
            </motion.span>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span key={state} {...swap}>
                {label[state]}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
      </motion.button>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>

      {mounted &&
        createPortal(
          flights.map((f) => (
            <FlyingCard
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

const svgProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function BagIcon() {
  return (
    <svg {...svgProps}>
      <BagPaths />
    </svg>
  );
}

/** Short loading arc, the only loop allowed */
function Spinner({ spin }: { spin: boolean }) {
  return (
    <motion.svg {...svgProps} animate={spin ? { rotate: 360 } : undefined} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}>
      <circle cx="12" cy="12" r="7.5" opacity="0.25" />
      <path d="M12 4.5a7.5 7.5 0 0 1 7.5 7.5" />
    </motion.svg>
  );
}

/** The check stroke draws in */
function Check({ animate }: { animate: boolean }) {
  return (
    <svg {...svgProps} strokeWidth={1.75}>
      <motion.path
        d="M5 12.5l4.5 4.5L19 7.5"
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
      />
    </svg>
  );
}

const CARD_W = 48;
const CARD_H = 62;

/** Mini product card flying to the cart along a quadratic Bezier curve: it lifts off the button first, tilts along its velocity on the way, then shrinks and fades before entering the cart */
function FlyingCard({
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
  const sx = flight.from.left + flight.from.width / 2 - CARD_W / 2;
  const sy = flight.from.top - CARD_H / 2;
  const ex = flight.to.x - CARD_W / 2;
  const ey = flight.to.y - CARD_H / 2;
  const cx = (sx + ex) / 2;
  const cy = Math.min(sy, ey) - arcHeight;

  const x = useMotionValue(sx);
  const y = useMotionValue(sy + 12);
  const rotate = useMotionValue(0);
  const scale = useMotionValue(0.9);
  const opacity = useMotionValue(0);

  useEffect(() => {
    const controls = animate(0, 1, {
      duration,
      ease: [0.45, 0, 0.55, 1],
      onUpdate: (p) => {
        const u = 1 - p;
        // First 12%: lift off the button, then follow the arc
        const lift = Math.min(p / 0.12, 1);
        x.set(u * u * sx + 2 * u * p * cx + p * p * ex);
        y.set(u * u * sy + 2 * u * p * cy + p * p * ey + (1 - lift) * 12);
        // The tangent direction sets the tilt: more horizontal speed tilts it more, up to 14 degrees
        const vx = 2 * u * (cx - sx) + 2 * p * (ex - cx);
        const vy = 2 * u * (cy - sy) + 2 * p * (ey - cy);
        const len = Math.hypot(vx, vy) || 1;
        rotate.set((vx / len) * 14 * (1 - p * 0.4));
        scale.set(p < 0.12 ? 0.9 + lift * 0.1 : 1 - ((p - 0.12) / 0.88) * 0.6);
        opacity.set(p < 0.08 ? p / 0.08 : p > 0.86 ? (1 - p) / 0.14 : 1);
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
        "pointer-events-none fixed top-0 left-0 z-[100] flex flex-col items-center gap-1 rounded-[10px] bg-card p-1 pb-1.5 font-mono text-[10px] leading-none font-semibold tracking-tight text-foreground tabular-nums",
        e2,
      )}
      style={{ x, y, rotate, scale, opacity, width: CARD_W, height: CARD_H }}
    >
      {thumbnail && (
        <span className="aspect-square w-full overflow-hidden rounded-md bg-muted [&>*]:size-full [&>img]:object-cover">{thumbnail}</span>
      )}
      {tag}
    </motion.span>
  );
}

export interface CartIconProps {
  /** Item count in the cart. When it changes, the badge presses down like a stamp */
  count: number;
  /** Shows 99+ above this */
  max?: number;
  /** Cart name, overrides labels.cart */
  label?: string;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Overrides the built-in strings. Takes priority over locale */
  labels?: Partial<Pick<AddToCartLabels, "cart" | "items">>;
  /** Replaces the default shopping bag icon. Uses the same icon as AddToCartButton; any SVG is scaled to 18px */
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
  onClick?: () => void;
  className?: string;
}

/** Shopping bag, shared by the button and CartIcon */
function BagPaths() {
  return (
    <>
      <path d="M5.5 7.5h13l-.9 11.6a1.5 1.5 0 0 1-1.5 1.4H7.9a1.5 1.5 0 0 1-1.5-1.4z" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
    </>
  );
}

/** Cart target to pair with AddToCartButton: when the count goes up the whole thing dips and springs back, as if it caught something */
export function CartIcon({ count, max = 99, label, locale = "en", labels, icon, ref, onClick, className }: CartIconProps) {
  const reduceMotion = useReducedMotion();
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const scale = useMotionValue(1);
  const y = useMotionValue(0);
  const prev = useRef(count);

  useEffect(() => {
    const grew = count > prev.current;
    prev.current = count;
    if (!grew || reduceMotion) return;
    scale.set(0.9);
    y.set(2);
    const a = animate(scale, 1, springs.pop);
    const b = animate(y, 0, springs.pop);
    return () => {
      a.stop();
      b.stop();
    };
  }, [count, reduceMotion, scale, y]);

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={`${label ?? t.cart}, ${t.items(count)}`}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={springs.snappy}
      className={cn(
        "relative grid size-10 place-items-center rounded-md bg-card text-foreground transition-colors duration-150 hover:bg-muted hover:duration-0",
        e1,
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        className,
      )}
    >
      <motion.span aria-hidden="true" className="grid place-items-center [&_svg]:size-[18px]" style={{ scale, y }}>
        {icon ?? <BagIcon />}
      </motion.span>
      <AnimatePresence initial={false}>
        {count > 0 && (
          // Remount keyed on count so it settles again on every add
          <motion.span
            key={count}
            aria-hidden="true"
            className={cn(
              "absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 font-mono text-[10px] leading-none font-semibold tabular-nums",
              "shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_0_0_2px_var(--background)]",
              spotFill,
            )}
            initial={reduceMotion ? false : { scale: 0.6, y: 3, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            transition={springs.pop}
          >
            {count > max ? `${max}+` : count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
