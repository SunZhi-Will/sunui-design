"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";

import { SocialButton, type SocialButtonItem } from "@/components/ui/social-button";
import { cn } from "@/lib/utils";

export type FloatingCorner = "bottom-right" | "bottom-left" | "top-right" | "top-left";
export type FloatingLayout = "petal" | "column" | "grid";

export interface FloatingSocialProps {
  items: SocialButtonItem[];
  /** petal: quarter-circle arcs, 3 buttons in the first ring, 5 in the next; column: a straight stack; grid: a square block. */
  layout?: FloatingLayout;
  corner?: FloatingCorner;
  /** fixed pins it to the viewport; absolute pins it to the nearest positioned parent. */
  strategy?: "fixed" | "absolute";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name of the main button. */
  label?: string;
  newTabHint?: string;
  className?: string;
}

const gentle = { type: "spring", stiffness: 240, damping: 30 } as const;
const snappy = { type: "spring", stiffness: 520, damping: 34 } as const;
const STEP = 56;

const cornerClass: Record<FloatingCorner, string> = {
  "bottom-right": "bottom-6 right-6",
  "bottom-left": "bottom-6 left-6",
  "top-right": "top-6 right-6",
  "top-left": "top-6 left-6",
};

/** Offset of item i (of total) from the main button, before flipping toward the open side of the corner. */
function place(layout: FloatingLayout, i: number, total: number) {
  if (layout === "column") return { x: 0, y: STEP * (i + 1) };
  if (layout === "grid") {
    const cols = Math.ceil(Math.sqrt(total + 1));
    const slot = i + 1; // slot 0 is the main button
    return { x: (slot % cols) * STEP, y: Math.floor(slot / cols) * STEP };
  }
  // petal: rings of 3, 5, 7... buttons spread over 90 degrees
  let ring = 0;
  let before = 0;
  while (i - before >= Math.min(3 + ring * 2, total - before)) {
    before += Math.min(3 + ring * 2, total - before);
    ring++;
  }
  const inRing = Math.min(3 + ring * 2, total - before);
  const angle = ((Math.PI / 2) / Math.max(inRing - 1, 1)) * (i - before);
  const r = 64 * (ring + 1);
  return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
}

/** A corner button that fans out platform-coloured social buttons. */
export function FloatingSocial({
  items,
  layout = "petal",
  corner = "bottom-right",
  strategy = "fixed",
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  label = "Social links",
  newTabHint,
  className,
}: FloatingSocialProps) {
  const reduce = useReducedMotion();
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const open = controlled ?? uncontrolled;
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const sx = corner.endsWith("right") ? -1 : 1;
  const sy = corner.startsWith("bottom") ? -1 : 1;

  const setOpen = (next: boolean) => {
    if (controlled === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };

  // Escape closes and hands focus back; a press outside closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      mainRef.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
    // setOpen only closes over stable values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const line = reduce ? { duration: 0 } : gentle;

  return (
    <div ref={rootRef} className={cn(strategy, "z-50 size-12", cornerClass[corner], className)}>
      <AnimatePresence>
        {open && (
          <motion.ul id={listId} className="absolute inset-0" aria-label={label}>
            {items.map((item, i) => {
              const p = place(layout, i, items.length);
              return (
                <motion.li
                  key={item.href ?? i}
                  className="absolute left-1 top-1 flex"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: 1, x: p.x * sx, y: p.y * sy, scale: 1 }}
                  exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: 0, y: 0, scale: 0.6, transition: { ...gentle, delay: (items.length - 1 - i) * 0.02 } }}
                  transition={reduce ? { duration: 0 } : { ...gentle, delay: i * 0.03 }}
                >
                  <SocialButton {...item} titleSide={sx < 0 ? "left" : "right"} newTabHint={newTabHint} />
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      <motion.button
        ref={mainRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen(!open)}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        transition={snappy}
        className={cn(
          "relative grid size-12 place-items-center rounded-full outline-none",
          "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]",
          "shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_0_0_1px_rgb(0_0_0/0.06),0_4px_8px_-4px_rgb(0_0_0/0.12),0_12px_20px_-8px_rgb(0_0_0/0.14)]",
          "dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_0_0_1px_rgb(255_255_255/0.12)]",
          "transition-[filter] duration-150 hover:brightness-110 hover:duration-0",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {/* three lines fold into a cross: the outer two slide to the middle and rotate about their own centre, the middle one fades */}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <motion.line x1="5" x2="19" y1="7" y2="7" initial={false} animate={open ? { y: 5, rotate: 45 } : { y: 0, rotate: 0 }} transition={line} />
          <motion.line x1="5" x2="19" y1="12" y2="12" initial={false} animate={{ opacity: open ? 0 : 1 }} transition={reduce ? { duration: 0 } : { duration: 0.1 }} />
          <motion.line x1="5" x2="19" y1="17" y2="17" initial={false} animate={open ? { y: -5, rotate: -45 } : { y: 0, rotate: 0 }} transition={line} />
        </svg>
      </motion.button>
    </div>
  );
}
