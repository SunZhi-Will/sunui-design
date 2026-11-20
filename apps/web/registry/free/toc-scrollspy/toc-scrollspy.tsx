"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useState, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

export interface TocItem {
  /** id of the matching section element */
  id: string;
  label: ReactNode;
  /** 1 is the main heading, 2 is indented */
  level?: 1 | 2;
}

export interface ScrollSpyOptions {
  /** Pass this when used inside a scrollable container; defaults to the viewport */
  container?: RefObject<HTMLElement | null>;
  /** A section counts as "being read" when its top is within this many px of the scroll area top, usually the fixed header height plus a bit */
  offset?: number;
}

/**
 * Returns the id of the section being read: the last section whose top has scrolled past offset.
 * At the bottom it always returns the last one, so a short final section can still become active.
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
  /** Smooth scroll on click (jumps instantly with reduced motion) */
  smooth?: boolean;
  onNavigate?: (id: string) => void;
  className?: string;
}

/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand color. Used only for selection, offers and current progress */
const spotBg = "bg-[color:var(--sunui-spot,var(--primary))]";

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
      <ul className="relative border-l border-foreground/10">
        {items.map((item) => {
          const on = item.id === active;
          return (
            <li key={item.id} className="relative">
              {on && (
                <motion.span
                  layoutId={`${group}-bar`}
                  transition={reduce ? { duration: 0 } : springs.snappy}
                  className={cn("absolute -left-px inset-y-0 w-0.5", spotBg)}
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
                  on ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
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
