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
  /** 原價，提供時顯示刪除線與折扣 */
  compareAt?: number;
  /** 商品圖，建議傳 <img> 或中性插圖 */
  image?: ReactNode;
  /** 規格、評分這類一行小字 */
  meta?: ReactNode;
}

export interface HoverCardLabels {
  addToCart?: ReactNode;
  /** 卡片的無障礙名稱 */
  quickView?: string;
  off?: (pct: number) => ReactNode;
}

export interface HoverCardProps {
  /** 觸發文字，例如商品名稱 */
  children: ReactNode;
  product: HoverCardProduct;
  /** 提供時觸發元素是連結；觸控第一次點開卡片，第二次才前往 */
  href?: string;
  onAddToCart?: () => void;
  /** 滑鼠停留多久才開（毫秒） */
  openDelay?: number;
  /** 滑鼠離開多久才關，讓指標能移進卡片 */
  closeDelay?: number;
  /** 介面語言與貨幣格式：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  currency?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: HoverCardLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
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

// 設計語言（DESIGN.md）：紙、紙邊、墨、品牌專色
const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/60 dark:text-[#ededed]/60";
/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";
const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

/**
 * 商品快速預覽卡：hover 延遲開關、鍵盤 focus 也會開、Escape 關閉並把焦點還給觸發元素，
 * 觸控改為點擊開啟。卡片放在觸發元素下方，靠近視窗底部時翻到上方。
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

  // 開啟時：點卡片外面關閉；Escape 關閉，焦點在卡片內就還給觸發元素
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
        skipFocus.current = true; // 這次 focus 不重新開卡片
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

  // 簡單定位：下方放不下而上方較寬就翻上去；右側超出就改為右對齊
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
      // 觸控的 focus 交給 click 處理，避免第一下就開又穿透到連結
      if (pointer.current !== "mouse") return;
      cancel();
      setOpen(true);
    },
    onClick: (e: MouseEvent) => {
      if (pointer.current === "mouse") return;
      // 觸控：第一下開卡片，開著時再點才照常前往連結
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
              "absolute z-50 block w-64 max-w-[calc(100vw-2rem)] rounded-md border p-3 text-left font-normal shadow-[0_1px_0_rgb(0_0_0/0.04)]",
              paper,
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
            <span className={cn("mt-3 flex items-baseline gap-2 border-t border-dashed pt-3 tabular-nums", edge)}>
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
                className={cn("mt-3 inline-flex h-9 w-full items-center justify-center rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", spotFill)}
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
