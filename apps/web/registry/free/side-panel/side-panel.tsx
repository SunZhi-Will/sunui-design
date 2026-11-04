"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type SidePanelSide = "left" | "right" | "bottom";

export interface SidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** 固定在底部的操作區 */
  footer?: ReactNode;
  side?: SidePanelSide;
  size?: "sm" | "md" | "lg";
  /** 點擊遮罩是否關閉 */
  dismissOnOverlay?: boolean;
  /** 開啟時優先聚焦的元素，預設為面板內第一個可聚焦元素 */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** 渲染到 document.body；false 時渲染在原位置（容器需有 relative 與 overflow-hidden） */
  portal?: boolean;
  labels?: {
    close?: string;
  };
  className?: string;
}

const sizeClass: Record<SidePanelSide, Record<"sm" | "md" | "lg", string>> = {
  left: { sm: "w-72", md: "w-96", lg: "w-[32rem]" },
  right: { sm: "w-72", md: "w-96", lg: "w-[32rem]" },
  bottom: { sm: "h-[35%]", md: "h-[55%]", lg: "h-[80%]" },
};

const sideClass: Record<SidePanelSide, string> = {
  left: "inset-y-0 left-0 max-w-[calc(100%-3rem)] border-r",
  right: "inset-y-0 right-0 max-w-[calc(100%-3rem)] border-l",
  bottom: "inset-x-0 bottom-0 rounded-t-md border-t",
};

// 設計語言（DESIGN.md）：一張紙從邊緣滑進來，紙面、紙邊、墨色
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const gentle = { type: "spring", stiffness: 240, damping: 30 } as const;

const offscreen: Record<SidePanelSide, { x?: string; y?: string }> = {
  left: { x: "-100%" },
  right: { x: "100%" },
  bottom: { y: "100%" },
};

const panelVariants: Variants = {
  hidden: (c: { side: SidePanelSide; reduce: boolean }) =>
    c.reduce
      ? { opacity: 0, transition: { duration: 0 } }
      : { ...offscreen[c.side], opacity: 1, transition: gentle },
  visible: (c: { reduce: boolean }) => ({
    x: 0,
    y: 0,
    opacity: 1,
    transition: c.reduce ? { duration: 0 } : gentle,
  }),
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// 多個面板同時開啟時共用的捲動鎖計數
let lockCount = 0;
let previousOverflow = "";

export function SidePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "right",
  size = "md",
  dismissOnOverlay = true,
  initialFocusRef,
  portal = true,
  labels,
  className,
}: SidePanelProps) {
  const reduce = useReducedMotion() ?? false;
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const closeLabel = labels?.close ?? "Close panel";

  useEffect(() => setMounted(true), []);

  // 捲動鎖與焦點還原
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    if (portal) {
      if (lockCount === 0) {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
      }
      lockCount++;
    }
    const frame = requestAnimationFrame(() => {
      const target =
        initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current;
      target?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      if (portal) {
        lockCount--;
        if (lockCount === 0) document.body.style.overflow = previousOverflow;
      }
      restoreRef.current?.focus?.();
    };
  }, [open, portal, initialFocusRef]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onOpenChange(false);
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    // 焦點陷阱：Tab 在面板內循環
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (n) => n.offsetParent !== null,
    );
    if (nodes.length === 0) {
      e.preventDefault();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const tree = (
    <AnimatePresence>
      {open && (
        <div className={cn(portal ? "fixed" : "absolute", "inset-0 z-50")} onKeyDown={onKeyDown}>
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-[#1c1917]/30 dark:bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
            onClick={() => dismissOnOverlay && onOpenChange(false)}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            custom={{ side, reduce }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={cn(
              "absolute flex flex-col shadow-[0_1px_0_rgb(0_0_0/0.04)] outline-none",
              paper,
              edge,
              ink,
              sideClass[side],
              sizeClass[side][size],
              className,
            )}
          >
            <header className={cn("flex items-start gap-4 border-b px-5 py-4", edge)}>
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-base leading-tight font-semibold tracking-tight">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className={cn("mt-1 text-sm", inkMuted)}>
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label={closeLabel}
                className={cn(
                  "-mt-1 -mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-md outline-none transition-colors hover:text-[#1c1917] focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-[#ece7dc]",
                  inkMuted,
                )}
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" strokeLinejoin="round">
                  <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
                </svg>
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
            {footer && <footer className={cn("border-t px-5 py-3", edge)}>{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!portal) return tree;
  return mounted ? createPortal(tree, document.body) : null;
}
