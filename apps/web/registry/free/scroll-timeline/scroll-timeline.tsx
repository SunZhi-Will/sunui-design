"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

export interface TimelineItem {
  id: string;
  /** Small text on the left, e.g. a year, date or time */
  time?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}

export interface ScrollTimelineProps {
  items: TimelineItem[];
  /**
   * scroll: the line draws downward with scrolling and nodes it passes fill in (brand story, campaign flow).
   * progress: progress is set by current, independent of scrolling (order tracking, application status).
   */
  mode?: "scroll" | "progress";
  /** progress mode: how many are completed (counting from 0); -1 means none have started */
  current?: number;
  /** Pass this when scroll mode runs inside a scrollable container */
  container?: RefObject<HTMLElement | null>;
  /** scroll mode: at what height of the scroll area the line head rests (0 top, 1 bottom) */
  anchor?: number;
  className?: string;
}

/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand colour. Used only for selected state, offers and current progress */
const spotBg = "bg-[color:var(--sunui-spot,var(--primary))]";

function Dot({ reached, current, reduce }: { reached: boolean; current: boolean; reduce: boolean | null }) {
  return (
    <span className="absolute left-0 top-1 grid size-4 -translate-x-1/2 place-items-center">
      <span className="absolute inset-0 rounded-full border-[1.5px] border-foreground/25 bg-card" />
      <motion.span
        className={cn("absolute inset-0 rounded-full", current ? spotBg : "bg-muted-foreground/70")}
        initial={false}
        animate={{ scale: reached ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : springs.stamp}
      />
    </span>
  );
}

export function ScrollTimeline({ items, mode = "scroll", current = -1, container, anchor = 0.6, className }: ScrollTimelineProps) {
  const reduce = useReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const dotRefs = useRef<(HTMLLIElement | null)[]>([]);
  const { scrollYProgress } = useScroll({
    target: listRef,
    container,
    offset: [`start ${anchor}`, `end ${anchor}`],
    // Let the parent's container ref attach first, otherwise inside a container it would read as window scroll
    layoutEffect: false,
  });
  const smooth = useSpring(scrollYProgress, reduce ? { stiffness: 10000, damping: 1000 } : springs.gentle);
  const [reachedCount, setReachedCount] = useState(0);
  // progress mode needs to measure node positions, so compute once more after mount
  const [, setMeasured] = useState(false);
  useEffect(() => setMeasured(true), []);

  // Convert each node to a position ratio; a node counts as reached once the line head passes it
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (mode !== "scroll") return;
    const list = listRef.current;
    if (!list) return;
    const h = list.offsetHeight || 1;
    let n = 0;
    dotRefs.current.forEach((el) => {
      if (el && (el.offsetTop + 8) / h <= p + 0.001) n++;
    });
    setReachedCount(n);
  });

  const progressFraction = (() => {
    if (mode !== "progress" || current < 0) return 0;
    const el = dotRefs.current[Math.min(current, items.length - 1)];
    const h = listRef.current?.offsetHeight;
    return el && h ? (el.offsetTop + 8) / h : current / Math.max(1, items.length - 1);
  })();


  return (
    <ol ref={listRef} className={cn("relative ml-2 space-y-8 pl-8", className)}>
      <span aria-hidden="true" className="absolute bottom-2 left-0 top-2 w-px bg-foreground/10" />
      {mode === "scroll" ? (
        <motion.span aria-hidden="true" className={cn("absolute bottom-2 left-0 top-2 w-px origin-top", spotBg)} style={{ scaleY: smooth }} />
      ) : (
        <motion.span
          aria-hidden="true"
          className={cn("absolute bottom-2 left-0 top-2 w-px origin-top", spotBg)}
          initial={false}
          animate={{ scaleY: progressFraction }}
          transition={reduce ? { duration: 0 } : springs.gentle}
        />
      )}
      {items.map((item, i) => {
        const reached = mode === "scroll" ? i < reachedCount : i <= current;
        const isCurrent = mode === "progress" && i === current;
        return (
          <li
            key={item.id}
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
            aria-current={isCurrent ? "step" : undefined}
            className="relative"
          >
            <span className="absolute -left-8 top-0 h-full">
              <Dot reached={reached} current={isCurrent} reduce={reduce} />
            </span>
            <motion.div
              initial={false}
              animate={{ opacity: reached || mode === "progress" ? 1 : 0.45 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
            >
              {item.time && <p className="text-xs tabular-nums text-muted-foreground">{item.time}</p>}
              <p className={cn("mt-0.5 font-medium tracking-tight", mode === "progress" && !reached && "text-foreground/45")}>{item.title}</p>
              {item.description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
}
