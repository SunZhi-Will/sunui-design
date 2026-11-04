"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "@/lib/utils";

export interface CapsuleNavItem {
  /** 對應頁面上區段的 id，用來判斷目前段落 */
  id: string;
  label: ReactNode;
  /** 預設為 #id；外部連結照常跳轉 */
  href?: string;
}

export interface CapsuleNavProps {
  items: CapsuleNavItem[];
  logo?: ReactNode;
  cta?: ReactNode;
  /** 往下捲時收起、往上捲時出現；焦點在導覽內時不收 */
  hideOnScroll?: boolean;
  /** 預設固定在視窗頂端；false 時改為 sticky，交給捲動容器 */
  fixed?: boolean;
  /** 捲動容器；不給時監聽 window */
  scrollContainer?: RefObject<HTMLElement | null>;
  /** 捲動超過多少 px 後加上底框 */
  threshold?: number;
  /** 點擊連結後捲到區段時保留的頂端距離 */
  offset?: number;
  labels?: { nav?: string; menu?: string; close?: string };
  className?: string;
}

const defaultLabels = { nav: "Main", menu: "Open menu", close: "Close menu" };

const ease = [0.23, 1, 0.32, 1] as const;
const springs = { snappy: { type: "spring", stiffness: 520, damping: 34 } } as const;

export function CapsuleNav({
  items,
  logo,
  cta,
  hideOnScroll = false,
  fixed = true,
  scrollContainer,
  threshold = 8,
  offset = 72,
  labels,
  className,
}: CapsuleNavProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const uid = useId();
  const navRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ids = items.map((i) => i.id).join(",");

  // 捲動狀態機：top → scrolled，rAF 節流
  useEffect(() => {
    const el = scrollContainer?.current ?? null;
    const target: HTMLElement | Window = el ?? window;
    const getY = () => (el ? el.scrollTop : window.scrollY);
    let last = getY();
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = getY();
      setScrolled(y > threshold);
      const delta = y - last;
      if (Math.abs(delta) > 4 || y < 64) {
        const focusInside = navRef.current?.contains(document.activeElement) ?? false;
        setHidden(hideOnScroll && delta > 0 && y >= 64 && !focusInside);
        last = y;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [scrollContainer, threshold, hideOnScroll]);

  // 目前段落：以畫面 40% 到 45% 之間的中線判斷，不監聽 scroll
  useEffect(() => {
    const els = ids
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { root: scrollContainer?.current ?? null, rootMargin: "-40% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids, scrollContainer]);

  // 行動版選單：鎖捲動、焦點陷阱、Esc 關閉並把焦點還給按鈕
  useEffect(() => {
    if (!open) return;
    const lockEl = scrollContainer?.current ?? document.documentElement;
    const prev = lockEl.style.overflow;
    lockEl.style.overflow = "hidden";
    sheetRef.current?.querySelector<HTMLElement>("a[href],button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;
      const focusables = [...sheetRef.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled])")];
      if (!focusables.length) return;
      const first = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      lockEl.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, scrollContainer]);

  function goTo(e: ReactMouseEvent<HTMLAnchorElement>, item: CapsuleNavItem) {
    if (item.href && !item.href.startsWith("#")) return;
    const el = document.getElementById(item.id);
    if (!el) return;
    e.preventDefault();
    const root = scrollContainer?.current;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    const rect = el.getBoundingClientRect();
    if (root) root.scrollTo({ top: rect.top - root.getBoundingClientRect().top + root.scrollTop - offset, behavior });
    else window.scrollTo({ top: rect.top + window.scrollY - offset, behavior });
    setActive(item.id);
    setOpen(false);
  }

  const visible = !hidden || open;

  return (
    <motion.div
      className={cn(
        "pointer-events-none z-30 flex justify-center px-3",
        fixed ? "fixed inset-x-0 top-3" : "sticky top-3",
        className,
      )}
      animate={{ y: visible ? 0 : -88, opacity: visible ? 1 : 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.24, ease }}
    >
      <nav
        ref={navRef}
        aria-label={t.nav}
        className={cn(
          "pointer-events-auto relative flex w-full max-w-2xl items-center gap-2 rounded-full border px-2 py-1.5 text-foreground transition-[background-color,border-color,box-shadow] duration-200",
          scrolled || open ? "border-border bg-background/88 shadow-sm backdrop-blur-sm" : "border-transparent",
        )}
      >
        {logo && <div className="flex shrink-0 items-center pr-1 pl-2">{logo}</div>}

        <ul className="hidden flex-1 items-center justify-center gap-0.5 sm:flex">
          {items.map((item) => {
            const current = active === item.id;
            return (
              <li key={item.id}>
                <a
                  href={item.href ?? `#${item.id}`}
                  onClick={(e) => goTo(e, item)}
                  aria-current={current ? "location" : undefined}
                  className={cn(
                    "relative block rounded-full px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    current ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {current && (
                    <motion.span
                      layoutId={`${uid}-pill`}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-primary/10"
                      transition={reduce ? { duration: 0 } : springs.snappy}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:ml-0">
          {cta && <div className="hidden sm:block">{cta}</div>}
          <button
            ref={menuRef}
            type="button"
            aria-expanded={open}
            aria-controls={`${uid}-sheet`}
            aria-label={open ? t.close : t.menu}
            onClick={() => setOpen((o) => !o)}
            className="flex size-9 items-center justify-center rounded-full text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              ref={sheetRef}
              id={`${uid}-sheet`}
              className="absolute inset-x-0 top-full mt-2 rounded-xl border border-border bg-background p-2 shadow-sm sm:hidden"
              initial={reduce ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease }}
            >
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href ?? `#${item.id}`}
                      onClick={(e) => goTo(e, item)}
                      aria-current={active === item.id ? "location" : undefined}
                      className={cn(
                        "block rounded-lg px-3 py-2.5 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                        active === item.id ? "bg-primary/10 text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              {cta && <div className="mt-2 border-t border-border px-1 pt-2">{cta}</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.div>
  );
}
