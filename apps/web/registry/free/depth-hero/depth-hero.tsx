"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DepthHeroProps = {
  /** Back layer: a color block, image or gradient node. It fills the section. */
  background?: ReactNode;
  /** The giant word that sits behind the subject. A string renders as an h1. */
  headline: ReactNode;
  /** Front layer: an image with a transparent background, or any node. */
  subject?: ReactNode;
  /** Readable content on top (eyebrow, copy, price, buttons). It does not move. */
  children?: ReactNode;
  /** Strength of the pointer and scroll depth. 0 turns movement off, 1 is the default. */
  depth?: number;
  /** Also move the layers at different speeds while the section scrolls past. */
  scroll?: boolean;
  /** Where the readable content sits. */
  align?: "bottom-left" | "bottom-center" | "top-left";
  className?: string;
  headlineClassName?: string;
  subjectClassName?: string;
};

// 每一層的深度係數：越大離觀眾越近，位移越多
const layers = { background: 0.25, headline: 0.55, subject: 1.2 } as const;
const POINTER_PX = 22;
const pointerSpring = { stiffness: 120, damping: 20, mass: 0.6 };

function useLayer(
  mx: MotionValue<number>,
  my: MotionValue<number>,
  progress: MotionValue<number>,
  factor: number,
  scrollPx: number,
  depth: number,
) {
  const x = useTransform(mx, (v) => v * POINTER_PX * factor * depth);
  const y = useTransform([my, progress], ([v, p]: number[]) => v * POINTER_PX * factor * depth * 0.6 + p * scrollPx * depth);
  return { x, y };
}

export function DepthHero({
  background,
  headline,
  subject,
  children,
  depth = 1,
  scroll = false,
  align = "bottom-left",
  className,
  headlineClassName,
  subjectClassName,
}: DepthHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const [fine, setFine] = useState(false);
  const still = reduce || depth === 0;

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, pointerSpring);
  const my = useSpring(rawY, pointerSpring);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const zero = useMotionValue(0);
  const progress = scroll && !still ? scrollYProgress : zero;

  const bg = useLayer(mx, my, progress, layers.background, 90, depth);
  const head = useLayer(mx, my, progress, layers.headline, 150, depth);
  const subj = useLayer(mx, my, progress, layers.subject, -40, depth);
  const headScale = useTransform(progress, (p) => 1 + p * 0.06 * depth);

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (still || !fine || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    rawX.set(((e.clientX - r.left) / r.width) * 2 - 1);
    rawY.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onPointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const move = (l: { x: MotionValue<number>; y: MotionValue<number> }) => (still ? undefined : l);

  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn("relative isolate flex min-h-[520px] w-full overflow-hidden bg-muted text-foreground", className)}
    >
      {background ? (
        <motion.div aria-hidden className="absolute -inset-8 -z-30" style={move(bg)}>
          {background}
        </motion.div>
      ) : null}

      <motion.div
        className="pointer-events-none absolute inset-0 -z-20 flex items-center justify-center"
        style={still ? undefined : { ...head, scale: headScale }}
      >
        {typeof headline === "string" ? (
          <h1
            className={cn(
              "select-none whitespace-nowrap text-center text-[clamp(4.5rem,22vw,17rem)] font-black leading-[0.8] tracking-tighter",
              headlineClassName,
            )}
          >
            {headline}
          </h1>
        ) : (
          <div className={headlineClassName}>{headline}</div>
        )}
      </motion.div>

      {subject ? (
        <motion.div
          className={cn("pointer-events-none absolute inset-0 -z-10 flex items-end justify-center", subjectClassName)}
          style={move(subj)}
        >
          {subject}
        </motion.div>
      ) : null}

      {children ? (
        <div
          className={cn(
            "relative z-10 flex w-full p-6 sm:p-10",
            align === "top-left" && "items-start justify-start",
            align === "bottom-left" && "items-end justify-start",
            align === "bottom-center" && "items-end justify-center text-center",
          )}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}

export default DepthHero;
