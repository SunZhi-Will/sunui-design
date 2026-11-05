"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "@/lib/utils";

export interface CapsuleNavItem {
  key: string;
  label: ReactNode;
  href: string;
  /** 對應頁面上的區段 id；捲到該區段時這一項亮起 */
  sectionId?: string;
  /** 目前所在頁面（aria-current="page"） */
  current?: boolean;
}

export interface CapsuleNavCta {
  label: ReactNode;
  href: string;
  onClick?: () => void;
}

export interface CapsuleNavLabels {
  navigation?: string;
  openMenu?: string;
  closeMenu?: string;
  /** 手機版膠囊中間的位置標籤，還沒捲到任何區段時顯示 */
  home?: string;
}

export interface CapsuleNavProps {
  /** 左側品牌（logo 與名稱） */
  brand: ReactNode;
  brandHref?: string;
  /** 品牌連結的無障礙名稱 */
  brandLabel?: string;
  items: CapsuleNavItem[];
  cta?: CapsuleNavCta;
  /** 右端的頁面專屬工具（搜尋、主題切換） */
  tools?: ReactNode;
  /** 捲動超過多少 px 從滿版 header 變成膠囊 */
  threshold?: number;
  /** 往下捲時收起、往上捲時出現；焦點在導覽內時不收 */
  hideOnScroll?: boolean;
  /** 膠囊狀態的最大寬度 */
  maxWidth?: number;
  /** true：固定在視窗頂端；false：sticky 在捲動容器頂端 */
  fixed?: boolean;
  /** 捲動容器；不給時監聽 window */
  scrollContainer?: RefObject<HTMLElement | null>;
  onNavigate?: (item: CapsuleNavItem) => void;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: CapsuleNavLabels;
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

const MESSAGES: Record<SunLocale, Required<CapsuleNavLabels>> = {
  en: { navigation: "Main", openMenu: "Open menu", closeMenu: "Close menu", home: "Home" },
  "zh-TW": { navigation: "主要導覽", openMenu: "開啟選單", closeMenu: "關閉選單", home: "首頁" },
  "zh-CN": { navigation: "主导航", openMenu: "打开菜单", closeMenu: "关闭菜单", home: "首页" },
  ja: { navigation: "メイン", openMenu: "メニューを開く", closeMenu: "メニューを閉じる", home: "ホーム" },
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const HIDE_AFTER = 160;
const JITTER = 6;

// 原站 base.css 的灰階雙主題 token
const themeVars =
  "[--cn-header:rgba(255,255,255,0.85)] [--cn-capsule:rgba(255,255,255,0.98)] [--cn-panel:#ffffff] [--cn-border:rgba(15,23,42,0.06)] [--cn-border-subtle:rgba(15,23,42,0.04)] [--cn-text:rgba(15,23,42,0.95)] [--cn-text-2:rgba(15,23,42,0.75)] [--cn-active:#eaeaea] [--cn-hover:#f4f4f5] [--cn-backdrop:rgba(255,255,255,0.6)] [--cn-panel-shadow:0_18px_60px_rgba(8,8,10,0.12)] dark:[--cn-header:rgba(0,0,0,0.85)] dark:[--cn-capsule:rgba(10,10,10,0.97)] dark:[--cn-panel:#121316] dark:[--cn-border:rgba(255,255,255,0.10)] dark:[--cn-border-subtle:rgba(255,255,255,0.06)] dark:[--cn-text:rgba(255,255,255,0.93)] dark:[--cn-text-2:rgba(255,255,255,0.58)] dark:[--cn-active:rgba(255,255,255,0.10)] dark:[--cn-hover:rgba(255,255,255,0.07)] dark:[--cn-backdrop:rgba(0,0,0,0.6)] dark:[--cn-panel-shadow:0_18px_60px_rgba(0,0,0,0.55)]";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function ToggleIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      role="presentation"
      focusable="false"
      aria-hidden="true"
    >
      {open ? (
        <path
          d="M5 5l10 10M15 5L5 15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M3.5 7h13M3.5 13h13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function CapsuleNav({
  brand,
  brandHref = "/",
  brandLabel,
  items,
  cta,
  tools,
  threshold = 40,
  hideOnScroll = false,
  maxWidth = 600,
  fixed = true,
  scrollContainer,
  onNavigate,
  locale = "en",
  labels,
  className,
}: CapsuleNavProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const panelId = useId();

  const [state, setState] = useState<"top" | "scrolled">("top");
  const [scrolledDown, setScrolledDown] = useState(false);
  const [focused, setFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const hidden = hideOnScroll && scrolledDown && !focused && !menuOpen;

  /* ── 捲動狀態機：TOP 與 SCROLLED 只差在外框，導覽項目全程可見 ── */
  useEffect(() => {
    const target: HTMLElement | Window = scrollContainer?.current ?? window;
    const readY = () =>
      target instanceof Window ? target.scrollY : target.scrollTop;
    let frame = 0;
    let lastY = readY();

    const update = () => {
      frame = 0;
      const y = readY();
      setState(y <= threshold ? "top" : "scrolled");
      // 小幅抖動不反應，避免導覽列閃爍
      if (Math.abs(y - lastY) > JITTER) {
        setScrolledDown(y > lastY && y > HIDE_AFTER);
        lastY = y;
      }
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    target.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      target.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scrollContainer, threshold]);

  /* ── 目前所在區段 ── */
  useEffect(() => {
    const ids = items
      .map((item) => item.sectionId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return;
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (visible) setActiveSection(visible.target.id);
      },
      {
        root: scrollContainer?.current ?? null,
        rootMargin: "-40% 0px -55% 0px",
        threshold: 0,
      },
    );
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [items, scrollContainer]);

  /* ── 選單：焦點管理、Esc、背景鎖定 ── */
  const closeMenu = useCallback((returnFocus = true) => {
    setMenuOpen(false);
    if (returnFocus) menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const lockTarget = fixed
      ? document.documentElement
      : scrollContainer?.current;
    const previousOverflow = lockTarget?.style.overflow ?? "";
    if (lockTarget) lockTarget.style.overflow = "hidden";
    if (!fixed && scrollContainer?.current)
      setContainerHeight(scrollContainer.current.clientHeight);

    const panel = panelRef.current;
    panel
      ?.querySelector<HTMLElement>("a, button, input, select, textarea")
      ?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      // 焦點在「選單鈕 + 面板」之間繞圈
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      const trigger = menuButtonRef.current;
      const stops = trigger ? [trigger, ...focusable] : focusable;
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (lockTarget) lockTarget.style.overflow = previousOverflow;
    };
  }, [menuOpen, closeMenu, fixed, scrollContainer]);

  const isScrolled = state === "scrolled";
  const contextLabel =
    items.find((item) => item.sectionId && item.sectionId === activeSection)
      ?.label ??
    items.find((item) => item.current)?.label ??
    l.home;

  // 從滿版 header 變形成膠囊：用 box-shadow 畫邊線，轉場才平順、不會閃白邊
  const barStyle: CSSProperties = {
    marginTop: isScrolled ? 10 : 0,
    width: isScrolled ? "calc(100% - 24px)" : "100%",
    maxWidth: isScrolled ? maxWidth : "100%",
    height: 52,
    borderRadius: isScrolled ? 26 : 0,
    background: isScrolled ? "var(--cn-capsule)" : "var(--cn-header)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    boxShadow: isScrolled
      ? "0 10px 30px rgba(0,0,0,0.18), 0 0 0 1px var(--cn-border)"
      : "0 1px 0 0 var(--cn-border-subtle)",
    paddingLeft: isScrolled ? 20 : 24,
    paddingRight: isScrolled ? 8 : 16,
    transition: reduce
      ? "none"
      : "all 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, box-shadow 0.25s ease",
  };

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={l.closeMenu}
          onClick={() => closeMenu()}
          className={cn(
            "z-40 bg-[var(--cn-backdrop)]",
            themeVars,
            fixed
              ? "fixed inset-0"
              : "sticky top-0 -mb-[var(--cn-h)] block w-full",
          )}
          style={
            fixed
              ? undefined
              : ({
                  height: containerHeight,
                  "--cn-h": `${containerHeight}px`,
                } as CSSProperties)
          }
        />
      )}

      <motion.header
        data-state={menuOpen ? "menu-open" : state}
        className={cn(
          "@container/capsule pointer-events-none inset-x-0 top-0 z-50 flex flex-col items-center",
          fixed ? "fixed" : "sticky h-0 overflow-visible",
          themeVars,
          className,
        )}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      >
        <div
          className={cn(
            "flex w-full flex-col items-center transition-[transform,opacity] duration-300",
            reduce && "transition-none",
            hidden && "-translate-y-[150%] opacity-0",
          )}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={() => setFocused(false)}
        >
          <div
            className={cn(
              "flex items-center gap-2 text-[var(--cn-text)]",
              hidden ? "pointer-events-none" : "pointer-events-auto",
            )}
            style={barStyle}
          >
            <a
              href={brandHref}
              aria-label={brandLabel}
              className="group flex flex-none items-center gap-2 rounded-2xl text-sm font-semibold whitespace-nowrap"
            >
              {brand}
            </a>

            {/* 手機版：中間顯示目前位置 */}
            <p
              aria-hidden="true"
              className="mx-auto truncate font-mono text-[11px] tracking-[0.04em] text-[var(--cn-text-2)] @3xl/capsule:hidden"
            >
              {contextLabel}
            </p>

            <nav
              aria-label={l.navigation}
              className="mx-auto hidden items-center @3xl/capsule:flex"
            >
              {items.map((item) => {
                const lit =
                  item.current ||
                  (item.sectionId !== undefined &&
                    item.sectionId === activeSection);
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    data-current={
                      item.sectionId && item.sectionId === activeSection
                        ? "true"
                        : undefined
                    }
                    onClick={() => onNavigate?.(item)}
                    className={cn(
                      "relative rounded-2xl px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-200",
                      lit
                        ? "text-[var(--cn-text)]"
                        : "text-[var(--cn-text-2)] hover:text-[var(--cn-text)]",
                    )}
                  >
                    {lit && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 rounded-2xl bg-[var(--cn-active)]"
                      />
                    )}
                    <span className="relative">{item.label}</span>
                  </a>
                );
              })}
            </nav>

            {tools && (
              <>
                <span
                  aria-hidden="true"
                  className="mx-1.5 hidden h-4 w-px bg-[var(--cn-border)] @3xl/capsule:block"
                />
                <div className="flex flex-none items-center gap-0.5">
                  {tools}
                </div>
              </>
            )}

            {cta && (
              <a
                href={cta.href}
                onClick={cta.onClick}
                className="hidden min-h-9 flex-none items-center rounded-full bg-[var(--cn-text)] px-4 text-[13px] font-semibold whitespace-nowrap text-[var(--cn-panel)] transition-opacity hover:opacity-90 @3xl/capsule:inline-flex"
              >
                {cta.label}
              </a>
            )}

            <button
              ref={menuButtonRef}
              type="button"
              aria-expanded={menuOpen}
              aria-controls={panelId}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex size-10 flex-none items-center justify-center rounded-full text-[var(--cn-text-2)] hover:bg-[var(--cn-hover)] hover:text-[var(--cn-text)] @3xl/capsule:hidden"
            >
              <span className="sr-only">
                {menuOpen ? l.closeMenu : l.openMenu}
              </span>
              <ToggleIcon open={menuOpen} />
            </button>
          </div>

          <div
            ref={panelRef}
            id={panelId}
            hidden={!menuOpen}
            role="dialog"
            aria-modal="true"
            aria-label={l.navigation}
            className="pointer-events-auto mt-2 max-h-[calc(100dvh-96px)] w-[calc(100%-24px)] overflow-y-auto overscroll-contain rounded-[10px] border border-[var(--cn-border)] bg-[var(--cn-panel)] p-4 text-[var(--cn-text)] shadow-[var(--cn-panel-shadow)] @3xl/capsule:hidden"
            style={{ maxWidth }}
          >
            <ul role="list" className="m-0 flex list-none flex-col gap-1 p-0">
              {items.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    onClick={() => {
                      onNavigate?.(item);
                      closeMenu(false);
                    }}
                    className="flex min-h-12 items-center rounded-md px-3 text-[17px] hover:bg-[var(--cn-hover)] aria-[current=page]:bg-[var(--cn-active)]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            {cta && (
              <>
                <div className="my-4 border-t border-[var(--cn-border)]" />
                <div className="flex flex-col gap-3">
                  <a
                    href={cta.href}
                    onClick={() => {
                      cta.onClick?.();
                      closeMenu(false);
                    }}
                    className="flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--cn-text)] text-sm font-semibold text-[var(--cn-panel)]"
                  >
                    {cta.label}
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.header>
    </>
  );
}
