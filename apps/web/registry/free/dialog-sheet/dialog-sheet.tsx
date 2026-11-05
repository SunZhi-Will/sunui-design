"use client";

import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo, type Variants } from "framer-motion";
import { cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

export type DialogSheetVariant = "center" | "sheet" | "auto";

export interface DialogSheetProps {
  /** 受控開關；不傳時用 defaultOpen 與 trigger 自己管理 */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 點了會打開的元素，例如一個按鈕 */
  trigger?: ReactNode;
  /** center：置中視窗；sheet：底部面板；auto：桌面置中、窄螢幕（< 640px）變底部面板 */
  variant?: DialogSheetVariant;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** 放在底部的動作列 */
  footer?: ReactNode;
  /** 底部面板可以往下拖曳關閉 */
  draggable?: boolean;
  /** 點遮罩或按 Escape 是否關閉 */
  dismissible?: boolean;
  /** fixed：蓋住整個視窗（portal 到 body）；contained：只蓋住最近的 relative 容器 */
  position?: "fixed" | "contained";
  closeLabel?: string;
  className?: string;
}

function useNarrow(query = "(max-width: 639px)") {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return narrow;
}

/**
 * 離開意圖：滑鼠往視窗上緣移出時呼叫 onIntent（只在桌面、每個 session 預設一次）。
 * 用法：useExitIntent(() => setOpen(true), { storageKey: "exit-offer" })
 */
export function useExitIntent(onIntent: () => void, { enabled = true, delay = 3000, storageKey }: { enabled?: boolean; delay?: number; storageKey?: string } = {}) {
  const fired = useRef(false);
  const cb = useRef(onIntent);
  cb.current = onIntent;
  useEffect(() => {
    if (!enabled || window.matchMedia("(pointer: coarse)").matches) return;
    try {
      if (storageKey && sessionStorage.getItem(storageKey)) return;
    } catch {
      // 無痕模式等情況讀不到 sessionStorage，照常觸發
    }
    let armed = false;
    const timer = window.setTimeout(() => (armed = true), delay);
    const onLeave = (e: MouseEvent) => {
      if (!armed || fired.current || e.relatedTarget || e.clientY > 8) return;
      fired.current = true;
      try {
        if (storageKey) sessionStorage.setItem(storageKey, "1");
      } catch {
        // 寫不進去也沒關係，只是同一個分頁可能再觸發一次
      }
      cb.current();
    };
    document.addEventListener("mouseout", onLeave);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [enabled, delay, storageKey]);
}

export function DialogSheet({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  variant = "auto",
  title,
  description,
  children,
  footer,
  draggable = true,
  dismissible = true,
  position = "fixed",
  closeLabel = "Close",
  className,
}: DialogSheetProps) {
  const reduce = useReducedMotion();
  const narrow = useNarrow();
  const drag = useDragControls();
  const [inner, setInner] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);
  const open = openProp ?? inner;
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();
  const mode = variant === "auto" ? (narrow ? "sheet" : "center") : variant;

  useEffect(() => setMounted(true), []);

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInner(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const raf = requestAnimationFrame(() => panel?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) setOpen(false);
      if (e.key !== "Tab" || !panel) return;
      const items = panel.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    if (position === "fixed") document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      returnFocus.current?.focus?.();
    };
  }, [open, dismissible, position, setOpen]);

  const t = reduce ? { duration: 0 } : springs.gentle;
  const panelVariants: Variants =
    mode === "sheet"
      ? { closed: { y: "100%", transition: t }, open: { y: 0, transition: t } }
      : {
          closed: { opacity: 0, scale: reduce ? 1 : 0.96, transition: reduce ? t : { duration: 0.15 } },
          open: { opacity: 1, scale: 1, transition: reduce ? t : springs.snappy },
        };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) setOpen(false);
  };

  const layer = (
    <AnimatePresence>
      {open && (
        <div className={cn("inset-0 z-50 flex", position === "fixed" ? "fixed" : "absolute", mode === "sheet" ? "items-end" : "items-center justify-center p-4")}>
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-[#1c1917]/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            onClick={() => dismissible && setOpen(false)}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            variants={panelVariants}
            initial="closed"
            animate="open"
            exit="closed"
            drag={mode === "sheet" && draggable && !reduce ? "y" : false}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
            className={cn(
              "relative flex max-h-[85%] w-full flex-col border border-[#e7e0d0] bg-[#faf7f0] text-[#1c1917] outline-none dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]",
              mode === "sheet" ? "rounded-t-lg border-b-0" : "max-w-md rounded-md",
              className,
            )}
          >
            {mode === "sheet" && (
              <div
                className={cn("flex justify-center pb-1 pt-2.5", draggable && "cursor-grab touch-none active:cursor-grabbing")}
                onPointerDown={(e) => draggable && drag.start(e)}
              >
                <span aria-hidden="true" className="h-1 w-10 rounded-full bg-[#e7e0d0] dark:bg-[#38332b]" />
              </div>
            )}
            <div className={cn("flex items-start gap-3 px-5", mode === "sheet" ? "pt-2" : "pt-5")}>
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-base font-semibold tracking-tight">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-sm text-[#1c1917]/65 dark:text-[#ece7dc]/65">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label={closeLabel}
                onClick={() => setOpen(false)}
                className="-mr-1.5 -mt-1 grid size-8 shrink-0 place-items-center rounded-md text-[#1c1917]/60 transition-colors hover:bg-[#e7e0d0]/60 hover:text-[#1c1917] focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-[#ece7dc]/60 dark:hover:bg-[#38332b]/60 dark:hover:text-[#ece7dc]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-4" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {children && <div className="min-h-0 overflow-y-auto px-5 pt-4 text-sm">{children}</div>}
            {footer && <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-dashed border-[#e7e0d0] px-5 py-4 dark:border-[#38332b]">{footer}</div>}
            {!footer && <div className="h-5" />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {isValidElement<{ onClick?: (e: ReactMouseEvent) => void }>(trigger)
        ? cloneElement(trigger, {
            "aria-haspopup": "dialog",
            "aria-expanded": open,
            onClick: (e: ReactMouseEvent) => {
              trigger.props.onClick?.(e);
              setOpen(true);
            },
          } as Record<string, unknown>)
        : trigger}
      {position === "fixed" ? (mounted ? createPortal(layer, document.body) : null) : layer}
    </>
  );
}
