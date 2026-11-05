"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useState, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

export interface TocItem {
  /** 對應段落元素的 id */
  id: string;
  label: ReactNode;
  /** 1 是主標題，2 會縮排 */
  level?: 1 | 2;
}

export interface ScrollSpyOptions {
  /** 在可捲動容器裡使用時傳入；預設跟著視窗 */
  container?: RefObject<HTMLElement | null>;
  /** 段落頂端距離捲動區頂端多少 px 以內算是「正在讀」，通常是固定 header 的高度再多一點 */
  offset?: number;
}

/**
 * 回傳目前正在讀的段落 id：最後一個頂端已經捲過 offset 的段落。
 * 捲到底時一律回傳最後一個，避免短的結尾段落永遠亮不起來。
 */
export function useScrollSpy(ids: string[], { container, offset = 96 }: ScrollSpyOptions = {}) {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join("|");

  useEffect(() => {
    const root = container?.current ?? null;
    const target: HTMLElement | Window = root ?? window;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const top = root ? root.getBoundingClientRect().top : 0;
      const atEnd = root ? root.scrollTop + root.clientHeight >= root.scrollHeight - 2 : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current = ids[0] ?? null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - top <= offset) current = id;
      }
      if (atEnd && ids.length) current = ids[ids.length - 1];
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, container, offset]);

  return active;
}

export interface TocScrollspyProps extends ScrollSpyOptions {
  items: TocItem[];
  title?: ReactNode;
  /** 點選時平滑捲動（減少動態時直接跳） */
  smooth?: boolean;
  onNavigate?: (id: string) => void;
  className?: string;
}

export function TocScrollspy({ items, title, container, offset = 96, smooth = true, onNavigate, className }: TocScrollspyProps) {
  const reduce = useReducedMotion();
  const group = useId();
  const active = useScrollSpy(
    items.map((i) => i.id),
    { container, offset },
  );

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const root = container?.current;
    const behavior: ScrollBehavior = smooth && !reduce ? "smooth" : "auto";
    if (root) {
      root.scrollTo({ top: root.scrollTop + el.getBoundingClientRect().top - root.getBoundingClientRect().top - offset + 8, behavior });
    } else {
      window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - offset + 8, behavior });
    }
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    onNavigate?.(id);
  };

  return (
    <nav aria-label={typeof title === "string" ? title : "Table of contents"} className={cn("text-sm", className)}>
      {title && <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{title}</p>}
      <ul className="relative border-l border-[#e7e0d0] dark:border-[#38332b]">
        {items.map((item) => {
          const on = item.id === active;
          return (
            <li key={item.id} className="relative">
              {on && (
                <motion.span
                  layoutId={`${group}-bar`}
                  transition={reduce ? { duration: 0 } : springs.snappy}
                  className="absolute -left-px inset-y-0 w-0.5 bg-[#1c1917] dark:bg-[#ece7dc]"
                />
              )}
              <a
                href={`#${item.id}`}
                aria-current={on ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.id);
                }}
                className={cn(
                  "block py-1.5 pr-2 outline-offset-2 transition-colors focus-visible:outline-2",
                  item.level === 2 ? "pl-7" : "pl-4",
                  on ? "font-medium text-[#1c1917] dark:text-[#ece7dc]" : "text-[#1c1917]/55 hover:text-[#1c1917] dark:text-[#ece7dc]/55 dark:hover:text-[#ece7dc]",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
