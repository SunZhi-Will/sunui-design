"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useRef, useState, type ReactNode, type Ref, type RefObject } from "react";

import { cn } from "@/lib/utils";

export interface StoreHeaderLink {
  label: ReactNode;
  href: string;
}

export interface StoreHeaderLabels {
  nav?: string;
  menu?: string;
  cart?: (count: number) => string;
}

export interface StoreHeaderProps {
  brand: ReactNode;
  links: StoreHeaderLink[];
  cartCount?: number;
  /** 掛在購物車按鈕上，可直接當 add-to-cart-button 的 cartRef（飛行終點） */
  cartRef?: Ref<HTMLButtonElement>;
  onCartClick?: () => void;
  /** 購物車左邊的額外按鈕，例如搜尋、帳號 */
  actions?: ReactNode;
  /** 頁首最上方的一條，例如 AnnouncementStrip；收起時一起收 */
  announcement?: ReactNode;
  /** 頁首放在可捲動容器內時傳入，預設跟隨視窗 */
  scrollContainer?: RefObject<HTMLElement | null>;
  /** 捲過這個距離後，往下捲才會收起 */
  hideAfter?: number;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 ja-JP 這類標籤 */
  locale?: string;
  labels?: StoreHeaderLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<StoreHeaderLabels>> = {
  en: { nav: "Main", menu: "Menu", cart: (n) => (n === 1 ? "Cart, 1 item" : `Cart, ${n} items`) },
  "zh-TW": { nav: "主選單", menu: "選單", cart: (n) => `購物車，${n} 件商品` },
  "zh-CN": { nav: "主菜单", menu: "菜单", cart: (n) => `购物车，${n} 件商品` },
  ja: { nav: "メイン", menu: "メニュー", cart: (n) => `カート、${n}点` },
};

const edge = "border-[#e7e0d0] dark:border-[#38332b]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

/** 位移小於這個值不判斷方向，避免觸控板抖動讓頁首忽隱忽現 */
const JITTER = 4;

export function StoreHeader({
  brand,
  links,
  cartCount = 0,
  cartRef,
  onCartClick,
  actions,
  announcement,
  scrollContainer,
  hideAfter = 120,
  locale = "en",
  labels,
  className,
}: StoreHeaderProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const { scrollY } = useScroll(scrollContainer ? { container: scrollContainer, layoutEffect: false } : undefined);
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const focusInside = useRef(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    const delta = y - prev;
    setCompact(y > 8);
    if (y <= 8) return setHidden(false);
    if (Math.abs(delta) < JITTER) return;
    // 減少動態時不收起，只縮高；鍵盤焦點在頁首內或選單打開時也不收
    const canHide = !reduce && !focusInside.current && !menuOpen;
    if (delta > 0 && y > hideAfter && canHide) setHidden(true);
    else if (delta < 0) setHidden(false);
  });

  const navLink =
    "rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
  const iconButton =
    "relative grid size-9 place-items-center rounded-md text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

  return (
    <motion.header
      initial={false}
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={reduce ? { duration: 0 } : springs.gentle}
      onFocus={() => {
        focusInside.current = true;
        setHidden(false);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) focusInside.current = false;
      }}
      className={cn("sticky top-0 z-40 w-full bg-background font-sans", className)}
    >
      {announcement}
      <div className={cn("border-b transition-colors duration-200", compact ? edge : "border-transparent")}>
        <motion.div
          initial={false}
          animate={{ height: compact ? 52 : 64 }}
          transition={reduce ? { duration: 0 } : springs.gentle}
          className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 sm:px-6"
        >
          <button
            type="button"
            aria-label={t.menu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(iconButton, "-ml-2 md:hidden")}
          >
            <MenuIcon open={menuOpen} />
          </button>

          <div className="min-w-0 shrink-0 text-base font-semibold tracking-tight">{brand}</div>

          <nav aria-label={t.nav} className="ml-6 hidden flex-1 items-center gap-6 md:flex">
            {links.map((link) => (
              <a key={link.href} href={link.href} className={navLink}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {actions}
            <button ref={cartRef} type="button" aria-label={t.cart(cartCount)} onClick={onCartClick} className={iconButton}>
              <BagIcon />
              <AnimatePresence initial={false}>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    aria-hidden="true"
                    initial={reduce ? false : { scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={springs.snappy}
                    className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground tabular-nums"
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.div>

        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.nav
              aria-label={t.nav}
              initial={reduce ? { opacity: 0 } : { height: 0 }}
              animate={reduce ? { opacity: 1 } : { height: "auto" }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { height: 0 }}
              transition={springs.gentle}
              className={cn("overflow-hidden border-t md:hidden", edge)}
            >
              <ul className="flex flex-col px-4 py-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} onClick={() => setMenuOpen(false)} className={cn(navLink, "block py-2.5 text-base")}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}

function BagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 8.5h13l-1 11h-11z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      {open ? <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /> : <path d="M4.5 7.5h15M4.5 12h15M4.5 16.5h15" />}
    </svg>
  );
}
