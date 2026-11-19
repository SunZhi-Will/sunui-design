"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface HoverCardProduct {
  name: ReactNode;
  price: number;
  /** Original price; when provided, shows a strikethrough and the discount */
  compareAt?: number;
  /** Product image, ideally an <img> or a neutral illustration */
  image?: ReactNode;
  /** A line of small text such as specs or rating */
  meta?: ReactNode;
}

export interface HoverCardLabels {
  addToCart?: ReactNode;
  /** Accessible name of the card */
  quickView?: string;
  off?: (pct: number) => ReactNode;
}

export interface HoverCardProps {
  /** Trigger text, e.g. the product name */
  children: ReactNode;
  product: HoverCardProduct;
  /** When provided, the trigger is a link; on touch the first tap opens the card and the second goes to the link */
  href?: string;
  onAddToCart?: () => void;
  /** How long the pointer must rest before it opens (ms) */
  openDelay?: number;
  /** How long after the pointer leaves before it closes, so the pointer can move into the card */
  closeDelay?: number;
  /** UI language and currency format: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  currency?: string;
  /** Override the built-in strings; takes precedence over locale */
  labels?: HoverCardLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else uses English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<HoverCardLabels>> = {
  en: { addToCart: "Add to cart", quickView: "Quick view", off: (pct) => <>{pct}% off</> },
  "zh-TW": { addToCart: "加入購物車", quickView: "快速預覽", off: (pct) => <>省 {pct}%</> },
  "zh-CN": { addToCart: "加入购物车", quickView: "快速预览", off: (pct) => <>省 {pct}%</> },
  ja: { addToCart: "カートに追加", quickView: "クイックビュー", off: (pct) => <>{pct}%オフ</> },
};

// Design language (DESIGN.md, craft quality): surface, hairline, text colors and brand accent
const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
const edge = "border-foreground/10";
const ink = "text-foreground";
const inkMuted = "text-muted-foreground";
/** Brand accent: follows the theme's --primary by default; set --sunui-spot to use your own brand color. Used only for selection, offers and current progress */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";
const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

/**
 * Quick product preview card: opens and closes with a hover delay, also opens on keyboard focus, closes on Escape and returns focus to the trigger,
 * and opens on tap for touch. The card sits below the trigger and flips above it near the bottom of the viewport.
 */
export function HoverCard({
  children,
  product,
  href,
  onAddToCart,
  openDelay = 350,
  closeDelay = 200,
  locale = "en-US",
  currency = "USD",
  labels,
  className,
}: HoverCardProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const cardId = useId();
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ above: boolean; alignEnd: boolean }>({ above: false, alignEnd: false });
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointer = useRef<string>("mouse");
  const skipFocus = useRef(false);

  const schedule = (next: boolean, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), ms);
  };
  const cancel = () => clearTimeout(timer.current);
  useEffect(() => () => clearTimeout(timer.current), []);

  // While open: a click outside the card closes it; Escape closes it, and if focus is inside the card it returns to the trigger
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      clearTimeout(timer.current);
      setOpen(false);
      const active = document.activeElement;
      if (active && active !== triggerRef.current && rootRef.current?.contains(active)) {
        skipFocus.current = true; // This focus does not reopen the card
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Simple positioning: flip above when there is no room below and more room above; align right when it overflows on the right
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !cardRef.current) return;
    const tr = triggerRef.current.getBoundingClientRect();
    const card = cardRef.current.getBoundingClientRect();
    const below = window.innerHeight - tr.bottom;
    setPlace({
      above: below < card.height + 12 && tr.top > below,
      alignEnd: tr.left + card.width > window.innerWidth - 8,
    });
  }, [open]);

  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency });
  const pct = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0;

  const triggerProps = {
    ref: triggerRef as never,
    "aria-expanded": open,
    "aria-controls": open ? cardId : undefined,
    onPointerDown: (e: ReactPointerEvent) => {
      pointer.current = e.pointerType;
    },
    onPointerEnter: (e: ReactPointerEvent) => {
      if (e.pointerType === "mouse") schedule(true, openDelay);
    },
    onPointerLeave: (e: ReactPointerEvent) => {
      if (e.pointerType === "mouse") schedule(false, closeDelay);
    },
    onFocus: () => {
      if (skipFocus.current) return void (skipFocus.current = false);
      // On touch, leave focus to click, so the first tap does not open it and then pass through to the link
      if (pointer.current !== "mouse") return;
      cancel();
      setOpen(true);
    },
    onClick: (e: MouseEvent) => {
      if (pointer.current === "mouse") return;
      // Touch: the first tap opens the card, and a tap while open follows the link as usual
      if (!open) {
        e.preventDefault();
        setOpen(true);
      }
      pointer.current = "mouse";
    },
    className: cn(
      "rounded-sm font-medium underline decoration-dotted decoration-1 underline-offset-4 outline-none",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    ),
  };

  return (
    <span
      ref={rootRef}
      className={cn("relative inline-block", className)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) schedule(false, 0);
      }}
    >
      {href ? (
        <a href={href} {...triggerProps}>
          {children}
        </a>
      ) : (
        <button type="button" {...triggerProps}>
          {children}
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.span
            ref={cardRef}
            id={cardId}
            role="group"
            aria-label={t.quickView}
            onPointerEnter={(e) => e.pointerType === "mouse" && cancel()}
            onPointerLeave={(e) => e.pointerType === "mouse" && schedule(false, closeDelay)}
            initial={reduce ? false : { opacity: 0, y: place.above ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: place.above ? 4 : -4 }}
            transition={reduce ? { duration: 0 } : springs.gentle}
            className={cn(
              "absolute z-50 block w-64 max-w-[calc(100vw-2rem)] rounded-md border p-3 text-left font-normal shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]",
              surface,
              edge,
              ink,
              place.above ? "bottom-full mb-2" : "top-full mt-2",
              place.alignEnd ? "right-0" : "left-0",
            )}
          >
            {product.image && (
              <span className={cn("mb-3 block aspect-[4/3] overflow-hidden rounded-sm border", edge)}>{product.image}</span>
            )}
            <span className="block text-sm leading-snug font-medium">{product.name}</span>
            {product.meta && <span className={cn("mt-0.5 block text-xs", inkMuted)}>{product.meta}</span>}
            <span className={cn("mt-3 flex items-baseline gap-2 border-t pt-3 tabular-nums", edge)}>
              <span className="text-base font-semibold tracking-tight">{fmt.format(product.price)}</span>
              {product.compareAt && (
                <>
                  <s className={cn("text-xs", inkMuted)}>{fmt.format(product.compareAt)}</s>
                  <span className={cn("ml-auto text-xs font-medium", spot)}>{t.off(pct)}</span>
                </>
              )}
            </span>
            {onAddToCart && (
              <button
                type="button"
                onClick={onAddToCart}
                className={cn("mt-3 inline-flex h-9 w-full items-center justify-center rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]", spotFill)}
              >
                {t.addToCart}
              </button>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
