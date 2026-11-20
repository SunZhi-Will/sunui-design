"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const springs = {
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

export interface NotifyBadgeProps {
  /** The element being badged, e.g. a bell or cart icon */
  children: ReactNode;
  /** The count; hidden at 0 (unless showZero) */
  count?: number;
  /** Shows "max+" when exceeded */
  max?: number;
  /** Show only a small dot, no number */
  dot?: boolean;
  showZero?: boolean;
  /** accent: vermilion; ink: the text colour; primary: the theme's primary colour */
  tone?: "accent" | "ink" | "primary";
  /** Badge position */
  placement?: "top-right" | "top-left" | "bottom-right";
  /** Full wording for screen readers, e.g. (n) => `${n} new notifications` */
  label?: (count: number) => string;
  className?: string;
}

/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand colour. Used only for selected state, offers and current progress */
const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";

const tones = {
  accent: spotFill,
  ink: "bg-foreground text-background",
  primary: "bg-primary text-primary-foreground",
};

const places = {
  "top-right": "right-0 top-0 translate-x-1/3 -translate-y-1/3",
  "top-left": "left-0 top-0 -translate-x-1/3 -translate-y-1/3",
  "bottom-right": "bottom-0 right-0 translate-x-1/3 translate-y-1/3",
};

export function NotifyBadge({
  children,
  count = 0,
  max = 99,
  dot = false,
  showZero = false,
  tone = "accent",
  placement = "top-right",
  label = (n) => `${n} new`,
  className,
}: NotifyBadgeProps) {
  const reduce = useReducedMotion();
  const prev = useRef(count);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    if (count > prev.current) setBump((b) => b + 1);
    prev.current = count;
  }, [count]);

  const visible = count > 0 || showZero;
  const text = count > max ? `${max}+` : String(count);

  return (
    <span className={cn("relative inline-flex", className)}>
      {children}
      <span className="sr-only" aria-live="polite">
        {visible ? label(count) : ""}
      </span>
      <span aria-hidden="true" className={cn("pointer-events-none absolute", places[placement])}>
        <AnimatePresence initial={false}>
          {visible && (
            <motion.span
              key="badge"
              className="block"
              initial={{ scale: reduce ? 1 : 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: reduce ? 1 : 0, opacity: 0 }}
              transition={reduce ? { duration: 0 } : springs.stamp}
            >
              {/* When the count goes up it is pressed like a stamp: scales up first, then settles; no motion when it goes down */}
              <motion.span
                key={bump}
                initial={reduce || bump === 0 ? false : { scale: 1.35 }}
                animate={{ scale: 1 }}
                transition={springs.stamp}
                className={cn(
                  "flex items-center justify-center rounded-full ring-2 ring-background",
                  dot ? "size-2.5" : "h-[1.15rem] min-w-[1.15rem] px-1 text-[0.68rem] font-semibold tabular-nums leading-none",
                  tones[tone],
                )}
              >
                {!dot && text}
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}
