"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type FloatingActionMenuItem = {
  id: string;
  label: string;
  icon: ReactNode;
  /** 有 href 時渲染成連結 */
  href?: string;
  onSelect?: () => void;
  /** 自訂按鈕底色，例如 "bg-emerald-500 text-white" */
  className?: string;
};

export type FloatingActionMenuPlacement = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export interface FloatingActionMenuProps {
  items: FloatingActionMenuItem[];
  /** radial：扇形展開；stack：沿垂直方向堆疊 */
  variant?: "radial" | "stack";
  placement?: FloatingActionMenuPlacement;
  /** true 時固定在視窗角落；false 時定位在最近的 relative 容器內 */
  fixed?: boolean;
  /** 扇形半徑或堆疊間距（px） */
  spread?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 觸發按鈕的圖示，預設為加號 */
  icon?: ReactNode;
  labels?: {
    menu?: string;
    open?: string;
    close?: string;
  };
  className?: string;
}

const defaultLabels = { menu: "Quick actions", open: "Open quick actions", close: "Close quick actions" };

const placementClass: Record<FloatingActionMenuPlacement, string> = {
  "bottom-right": "bottom-6 right-6",
  "bottom-left": "bottom-6 left-6",
  "top-right": "top-6 right-6",
  "top-left": "top-6 left-6",
};

// 扇形起訖角度（螢幕座標，y 向下）
const arcRange: Record<FloatingActionMenuPlacement, [number, number]> = {
  "bottom-right": [180, 270],
  "bottom-left": [360, 270],
  "top-right": [180, 90],
  "top-left": [0, 90],
};

function offsetFor(
  index: number,
  count: number,
  variant: "radial" | "stack",
  placement: FloatingActionMenuPlacement,
  spread: number,
) {
  if (variant === "stack") {
    const dir = placement.startsWith("bottom") ? -1 : 1;
    return { x: 0, y: dir * spread * (index + 1) };
  }
  const [from, to] = arcRange[placement];
  const t = count <= 1 ? 0.5 : index / (count - 1);
  const angle = ((from + (to - from) * t) * Math.PI) / 180;
  return { x: Math.round(Math.cos(angle) * spread), y: Math.round(Math.sin(angle) * spread) };
}

const itemVariants: Variants = {
  hidden: { x: 0, y: 0, scale: 0.4, opacity: 0 },
  visible: (c: { x: number; y: number; i: number; reduce: boolean }) => ({
    x: c.x,
    y: c.y,
    scale: 1,
    opacity: 1,
    transition: c.reduce
      ? { duration: 0 }
      : { type: "spring", stiffness: 420, damping: 26, delay: c.i * 0.035 },
  }),
  exit: (c: { i: number; reduce: boolean }) => ({
    x: 0,
    y: 0,
    scale: 0.4,
    opacity: 0,
    transition: c.reduce ? { duration: 0 } : { duration: 0.15, delay: c.i * 0.02 },
  }),
};

export function FloatingActionMenu({
  items,
  variant = "radial",
  placement = "bottom-right",
  fixed = true,
  spread,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  icon,
  labels,
  className,
}: FloatingActionMenuProps) {
  const reduce = useReducedMotion() ?? false;
  const menuId = useId();
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const text = { ...defaultLabels, ...labels };
  const distance = spread ?? (variant === "radial" ? 92 : 58);
  const labelOnLeft = placement.endsWith("right");

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInner(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  // 打開時把焦點移到第一個項目
  const focusOnOpen = useRef(false);
  useEffect(() => {
    if (open && focusOnOpen.current) {
      focusOnOpen.current = false;
      requestAnimationFrame(() => itemRefs.current[0]?.focus());
    }
  }, [open]);

  // 點擊外部關閉
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, setOpen]);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const nodes = itemRefs.current.filter(Boolean) as HTMLElement[];
    const current = nodes.indexOf(document.activeElement as HTMLElement);
    const move = (to: number) => {
      e.preventDefault();
      nodes[(to + nodes.length) % nodes.length]?.focus();
    };
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        return move(current + 1);
      case "ArrowUp":
      case "ArrowLeft":
        return move(current - 1);
      case "Home":
        return move(0);
      case "End":
        return move(nodes.length - 1);
      case "Escape":
        e.preventDefault();
        return close(true);
      case "Tab":
        return close(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn(fixed ? "fixed z-50" : "absolute z-10", placementClass[placement], "size-14", className)}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            aria-orientation="vertical"
            aria-label={text.menu}
            className="absolute inset-0"
            onKeyDown={onMenuKeyDown}
          >
            {items.map((item, i) => {
              const { x, y } = offsetFor(i, items.length, variant, placement, distance);
              const shared = {
                role: "menuitem" as const,
                "aria-label": item.label,
                className: cn(
                  "group absolute inset-0 m-auto flex size-11 items-center justify-center rounded-full border border-border bg-card text-card-foreground shadow-lg outline-none",
                  "transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  item.className,
                ),
                onClick: () => {
                  item.onSelect?.();
                  close(true);
                },
              };
              const content = (
                <>
                  <span className="flex size-5 items-center justify-center [&>svg]:size-5" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span
                    className={cn(
                      "pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-sm transition-opacity",
                      "group-hover:opacity-100 group-focus-visible:opacity-100",
                      labelOnLeft ? "right-[calc(100%+0.5rem)]" : "left-[calc(100%+0.5rem)]",
                    )}
                    aria-hidden="true"
                  >
                    {item.label}
                  </span>
                </>
              );
              const motionProps = {
                custom: { x, y, i, reduce },
                variants: itemVariants,
                initial: "hidden",
                animate: "visible",
                exit: "exit",
              };
              return item.href ? (
                <motion.a
                  key={item.id}
                  href={item.href}
                  ref={(el: HTMLAnchorElement | null) => {
                    itemRefs.current[i] = el;
                  }}
                  {...shared}
                  {...motionProps}
                >
                  {content}
                </motion.a>
              ) : (
                <motion.button
                  key={item.id}
                  type="button"
                  ref={(el: HTMLButtonElement | null) => {
                    itemRefs.current[i] = el;
                  }}
                  {...shared}
                  {...motionProps}
                >
                  {content}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={open ? text.close : text.open}
        onClick={() => {
          focusOnOpen.current = !open;
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) close(true);
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            focusOnOpen.current = true;
            setOpen(true);
            if (open) itemRefs.current[0]?.focus();
          }
        }}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <motion.span
          className="flex [&>svg]:size-6"
          animate={{ rotate: open ? 45 : 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 22 }}
          aria-hidden="true"
        >
          {icon ?? <PlusIcon />}
        </motion.span>
      </motion.button>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
