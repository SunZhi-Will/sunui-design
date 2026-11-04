"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * LOGO 浮動選單：移植自 CardFlow 的 FloatingMenu。
 * 滑入或聚焦 LOGO 時，從 LOGO 延伸出一條膠囊面板，放各頁面的入口。
 */

/* ---------- 浮動選單（LOGO 展開） ---------- */

export type LogoMenuItem = {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
};

const menuIcon = (children: ReactNode, small: boolean) => (
  <svg
    className={small ? "h-3 w-3" : "h-3.5 w-3.5"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

/** 原版的兩個入口：個人卡片編輯、網格頁面 */
export const menuGlyphs = {
  profile: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </>
  ),
};

export type LogoMenuProps = {
  items: LogoMenuItem[];
  /** 展開方向：向下或向右 */
  direction?: "down" | "right";
  /** LOGO 內容，預設為原版的 ✨ */
  logo?: ReactNode;
  /** 受控開關；不傳則滑入展開、離開 150ms 後收合 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  label?: string;
  className?: string;
};

export function LogoMenu({
  items,
  direction = "down",
  logo = "✨",
  open: openProp,
  onOpenChange,
  label = "Menu",
  className,
}: LogoMenuProps) {
  const isRight = direction === "right";
  const [openState, setOpenState] = useState(false);
  const isOpen = openProp ?? openState;
  const timer = useRef<number | null>(null);

  const setOpen = (v: boolean) => {
    setOpenState(v);
    onOpenChange?.(v);
  };
  const enter = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setOpen(true);
  };
  const leave = () => {
    timer.current = window.setTimeout(() => setOpen(false), 150);
  };
  useEffect(() => () => void (timer.current && window.clearTimeout(timer.current)), []);

  // 展開時按 Escape 收合
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenState(false);
      onOpenChange?.(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onOpenChange]);

  const itemClass = cn(
    "flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-lg outline-none transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 hover:shadow-xl focus-visible:border-purple-300 focus-visible:bg-purple-50 focus-visible:text-purple-600 motion-reduce:transition-none",
    isRight ? "h-6 w-6" : "h-8 w-8",
  );

  return (
    <div className={cn("absolute left-6 top-6 z-50", className)}>
      <div
        className={cn("relative flex items-center", isRight ? "flex-row" : "flex-col")}
        onMouseEnter={enter}
        onMouseLeave={leave}
        onFocus={enter}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && leave()}
      >
        {/* LOGO 按鈕 */}
        <button
          type="button"
          aria-label={label}
          aria-expanded={isOpen}
          onClick={() => setOpen(!isOpen)}
          className={cn(
            "group relative z-50 flex items-center justify-center rounded-full border border-gray-200 bg-white/90 shadow-lg outline-none backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-xl focus-visible:ring-2 focus-visible:ring-purple-300 motion-reduce:transition-none",
            isRight ? "h-8 w-8" : "h-12 w-12",
          )}
        >
          <span
            className={cn(
              "font-bold leading-none text-gray-800 transition-colors group-hover:text-purple-600",
              isRight ? "text-base" : "text-xl",
            )}
          >
            {logo}
          </span>
        </button>

        {/* 向右展開箭頭提示 */}
        {isRight && (
          <div className="ml-1.5 flex items-center justify-center opacity-60" aria-hidden="true">
            <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}

        {/* 從 LOGO 延伸的面板 */}
        <div
          inert={!isOpen}
          className={cn(
            "absolute z-30 transition-all duration-500 ease-out motion-reduce:transition-none",
            isRight ? "left-0 top-1/2 -translate-y-1/2" : "left-1/2 top-0 -translate-x-1/2",
            isOpen
              ? isRight
                ? "scale-x-100 opacity-100"
                : "scale-y-100 opacity-100"
              : isRight
                ? "pointer-events-none scale-x-0 opacity-0"
                : "pointer-events-none scale-y-0 opacity-0",
          )}
          style={{ transformOrigin: isRight ? "left center" : "top center" }}
        >
          <nav
            aria-label={label}
            className={cn(
              "relative flex items-center rounded-full border border-gray-200 bg-white/95 shadow-xl backdrop-blur-sm",
              isRight ? "h-8 flex-row pl-10 pr-4" : "w-12 flex-col pb-6 pt-14",
            )}
          >
            <div className={isRight ? "flex flex-row gap-2" : "flex flex-col gap-3"}>
              {items.map((item) =>
                item.href ? (
                  <a key={item.label} href={item.href} onClick={item.onClick} className={itemClass} title={item.label} aria-label={item.label}>
                    {menuIcon(item.icon, isRight)}
                  </a>
                ) : (
                  <button key={item.label} type="button" onClick={item.onClick} className={itemClass} title={item.label} aria-label={item.label}>
                    {menuIcon(item.icon, isRight)}
                  </button>
                ),
              )}
            </div>

            {/* 箭頭指示器 */}
            <div
              className={cn("absolute", isRight ? "right-2 top-1/2 -translate-y-1/2" : "bottom-2 left-1/2 -translate-x-1/2")}
              aria-hidden="true"
            >
              <svg
                className={cn(
                  "h-3 w-3 text-gray-400 transition-all duration-300 motion-reduce:transition-none",
                  isOpen ? (isRight ? "rotate-90" : "rotate-180") : isRight ? "-rotate-90" : "",
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
