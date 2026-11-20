"use client";

// Feature bento grid: each tile has a small illustrative screen showing how the feature works.
// Tiles have no entrance animation (DESIGN.md 5.2): they are already there when scrolled to.
// Mini screens are content and may replay, but only on screen and in a visible tab; with reduced motion they rest on the final, fully informative frame.
// On hover, rise from e1 to e2: two stacked shadows switch opacity, the shadow itself is not animated.

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Three springs; mini screens using framer-motion inside tiles use only these */
export const springs = {
  /** Press feedback, small element moves */
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  /** State changes, expand and collapse */
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  /** One-time settle bounce of a small element */
  pop: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

function useReducedMotionPref() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/**
 * Metronome for mini screens: on screen and in a visible tab, it advances one step every period ms and restarts from 0 after steps.
 * At start and with reduced motion it rests on the last step, so draw the last step fully informative.
 * Attach the returned ref to the mini screen's outer element.
 */
export function useTicker(period: number, steps: number) {
  const reduced = useReducedMotionPref();
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(steps - 1);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const playing = inView && visible && !reduced;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStep((s) => (s + 1) % steps), period);
    return () => window.clearInterval(timer);
  }, [playing, period, steps]);

  return { ref, step: reduced ? steps - 1 : step, playing, reduced };
}

const E1 =
  "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]";
const E2 =
  "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_4px_8px_-4px_rgb(0_0_0/0.06),0_12px_20px_-8px_rgb(0_0_0/0.08)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)] dark:bg-foreground/[0.03]";

export interface BentoTileProps {
  title: ReactNode;
  body?: ReactNode;
  /** Spans two columns at md and up */
  wide?: boolean;
  className?: string;
  /** Mini screen. Illustrative only and marked aria-hidden; title and body must carry the meaning */
  children: ReactNode;
}

export function BentoTile({ title, body, wide, className, children }: BentoTileProps) {
  return (
    <article
      className={cn(
        "group relative flex min-w-0 flex-col rounded-xl bg-card p-1 text-card-foreground",
        E1,
        wide && "md:col-span-2",
        className,
      )}
    >
      {/* e2 stacked over e1, fades in on hover (0ms in, 150ms out); dark mode lifts the surface one step instead */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:duration-0",
          E2,
        )}
      />
      <div className="relative px-5 pb-4 pt-5">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {body ? <p className="mt-1.5 text-pretty text-sm text-muted-foreground">{body}</p> : null}
      </div>
      {/* Inset display area: card 12px, padding 4px, so 8px */}
      <div
        aria-hidden
        className="relative flex min-h-44 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-muted p-5 shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)]"
      >
        {children}
      </div>
    </article>
  );
}

export function LiveBento({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>;
}
