"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, type Transition } from "framer-motion";
import { useEffect, useRef, useState, type ElementType, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

/** Enabled only on devices with a mouse; on touch devices these effects turn off automatically */
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

/* ───────────── Magnetic ───────────── */

export interface MagneticProps {
  children: ReactNode;
  /** Fraction of the cursor movement to follow; 0.35 means 35% of the distance the cursor moves */
  strength?: number;
  /** Sensing range: how many px beyond the element edge the pull starts */
  radius?: number;
  className?: string;
}

/** Magnetic: the element is gently pulled toward the cursor as it approaches, and springs back when it leaves. Wrap a single button with it. */
export function Magnetic({ children, strength = 0.35, radius = 48, className }: MagneticProps) {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, springs.gentle);
  const y = useSpring(0, springs.gentle);
  const active = fine && !reduce;

  useEffect(() => {
    if (!active) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const inside = e.clientX > r.left - radius && e.clientX < r.right + radius && e.clientY > r.top - radius && e.clientY < r.bottom + radius;
      x.set(inside ? (e.clientX - cx) * strength : 0);
      y.set(inside ? (e.clientY - cy) * strength : 0);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [active, radius, strength, x, y]);

  return (
    <motion.span ref={ref} style={{ x, y }} className={cn("inline-block", className)}>
      {children}
    </motion.span>
  );
}

/* ───────────── InkUnderline ───────────── */

export interface InkUnderlineProps {
  children: ReactNode;
  /** Defaults to a; you can also pass "button" or your own Link component */
  as?: ElementType;
  href?: string;
  /** The current page: its underline stays visible */
  active?: boolean;
  /** Underline colour: ink is the text colour, accent is vermilion */
  tone?: "ink" | "accent";
  className?: string;
  [key: string]: unknown;
}

/** Thin underline: draws in from the left on hover, and retracts to the right on leave. */
export function InkUnderline({ children, as: Tag = "a", active = false, tone = "ink", className, ...rest }: InkUnderlineProps) {
  return (
    <Tag
      {...rest}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/ink relative inline-block py-0.5 outline-offset-4 focus-visible:outline-2",
        "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:transition-transform after:duration-300 after:ease-out motion-reduce:after:transition-none",
        "hover:after:origin-left hover:after:scale-x-100 focus-visible:after:origin-left focus-visible:after:scale-x-100",
        active && "after:scale-x-100",
        // The current page's underline uses the brand accent; the rest keep the text colour
        active ? "after:bg-[color:var(--sunui-spot,var(--primary))]" : tone === "ink" ? "after:bg-foreground" : "after:bg-foreground",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ───────────── TextRoll ───────────── */

export interface TextRollProps {
  /** Text only, so it can roll character by character */
  children: string;
  /** Delay between characters (seconds) */
  stagger?: number;
  /** Class for the layer that rolls in, e.g. switch it to vermilion */
  rollClassName?: string;
  /** Hover state controlled by the parent; detected internally when omitted */
  hovered?: boolean;
  className?: string;
}

/** Text roll: on hover each character rolls up and out while the same character rolls in from below. Use it inside menu links or buttons. */
export function TextRoll({ children, stagger = 0.025, rollClassName, hovered, className }: TextRollProps) {
  const reduce = useReducedMotion();
  const [self, setSelf] = useState(false);
  const on = hovered ?? self;
  const chars = Array.from(children);
  const transition = (i: number): Transition => (reduce ? { duration: 0 } : { ...springs.snappy, delay: i * stagger });

  return (
    <span
      className={cn("relative inline-flex overflow-hidden whitespace-pre leading-[1.2]", className)}
      onPointerEnter={() => setSelf(true)}
      onPointerLeave={() => setSelf(false)}
      onFocus={() => setSelf(true)}
      onBlur={() => setSelf(false)}
    >
      <span className="sr-only">{children}</span>
      {chars.map((c, i) => (
        <span key={i} aria-hidden="true" className="relative inline-block">
          <motion.span className="inline-block" initial={false} animate={{ y: on ? "-110%" : "0%" }} transition={transition(i)}>
            {c}
          </motion.span>
          <motion.span className={cn("absolute left-0 top-0 inline-block", rollClassName)} initial={false} animate={{ y: on ? "0%" : "110%" }} transition={transition(i)}>
            {c}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ───────────── HoverPreviewList ───────────── */

export interface HoverPreviewItem {
  id: string;
  title: ReactNode;
  /** Secondary info on the right, e.g. price or year */
  meta?: ReactNode;
  /** Preview that floats next to the cursor, usually an image */
  preview: ReactNode;
  href?: string;
}

export interface HoverPreviewListProps {
  items: HoverPreviewItem[];
  /** Preview box size (px) */
  previewSize?: { width: number; height: number };
  className?: string;
}

/** Text list: whichever row you hover, its image appears next to the cursor and follows it. Touch devices show no preview. */
export function HoverPreviewList({ items, previewSize = { width: 200, height: 250 }, className }: HoverPreviewListProps) {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const listRef = useRef<HTMLUListElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, reduce ? { stiffness: 10000, damping: 1000 } : springs.gentle);
  const y = useSpring(my, reduce ? { stiffness: 10000, damping: 1000 } : springs.gentle);
  const current = items.find((i) => i.id === hover);

  const move = (e: ReactPointerEvent) => {
    const r = listRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(e.clientX - r.left + 24);
    my.set(e.clientY - r.top - previewSize.height / 2);
  };

  return (
    <ul ref={listRef} className={cn("relative", className)} onPointerMove={move} onPointerLeave={() => setHover(null)}>
      {items.map((item) => {
        const Row = item.href ? "a" : "div";
        return (
          <li key={item.id} className="border-b border-foreground/10 first:border-t">
            <Row
              href={item.href}
              tabIndex={item.href ? undefined : 0}
              onPointerEnter={() => setHover(item.id)}
              onFocus={() => setHover(item.id)}
              onBlur={() => setHover(null)}
              className={cn(
                "flex items-baseline justify-between gap-4 py-4 outline-offset-2 transition-colors focus-visible:outline-2",
                hover && hover !== item.id ? "text-foreground/35" : "text-foreground",
              )}
            >
              <span className="text-lg font-medium tracking-tight sm:text-2xl">{item.title}</span>
              {item.meta && <span className="shrink-0 text-sm tabular-nums opacity-60">{item.meta}</span>}
            </Row>
          </li>
        );
      })}
      {fine && (
        <motion.div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-10" style={{ x, y, width: previewSize.width, height: previewSize.height }}>
          <AnimatePresence>
            {current && (
              <motion.div
                key={current.id}
                className="absolute inset-0 overflow-hidden rounded-xl border border-foreground/10 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                initial={{ opacity: 0, scale: reduce ? 1 : 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
              >
                {current.preview}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </ul>
  );
}
