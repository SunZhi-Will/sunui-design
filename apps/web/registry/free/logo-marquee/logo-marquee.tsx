"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Why a continuous loop is allowed here (DESIGN.md §5.2):
 * the rules ban decorative continuous loops. A logo strip is content (real partner and customer logos);
 * the loop fits more logos than the width allows in one row, it is not decoration. So it stays, with tighter conditions:
 * runs only on screen and in a visible tab; stops on hover or keyboard focus; has a pause button (WCAG 2.2.2);
 * reduced motion turns it into a static wrapped list with no loss of information.
 * Unlike testimonial-marquee (a wall of review cards) and scroll-marquee (large text moved by scroll),
 * this is small logos, wordmarks and short words moving at constant speed over time.
 */

export type MarqueeItem = {
  /** Unique id, used as key */
  id: string;
  /** Logo, wordmark or short text */
  content: ReactNode;
  /** Name for screen readers when the item is icon-only */
  label?: string;
};

export interface LogoMarqueeProps {
  items: MarqueeItem[];
  /** Pixels moved per second */
  speed?: number;
  direction?: "left" | "right";
  /** 2 = second row reversed in direction and order, slightly slower; the second row is a visual copy hidden from assistive tech */
  rows?: 1 | 2;
  /** Gap between items (px) */
  gap?: number;
  /** Pause on mouse hover or keyboard focus */
  pauseOnHover?: boolean;
  /** Fade at the left and right edges */
  fade?: boolean;
  /** Show a pause button (WCAG 2.2.2: continuously moving content should be pausable) */
  showPauseControl?: boolean;
  labels?: {
    /** Name of the whole region */
    region?: string;
    pause?: string;
    play?: string;
  };
  className?: string;
  itemClassName?: string;
}

const defaultLabels = {
  region: "Trusted by",
  pause: "Pause scrolling logos",
  play: "Play scrolling logos",
};

// Use useEffect during SSR to avoid the warning
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Monochrome: secondary text colour by default, brightens to foreground on hover; hover fast in, slow out
const baseItem =
  "flex shrink-0 items-center text-muted-foreground transition-colors duration-150 hover:text-foreground hover:duration-0 [&_svg]:h-7 [&_svg]:w-auto";

export function LogoMarquee({
  items,
  speed = 40,
  direction = "left",
  rows = 1,
  gap = 48,
  pauseOnHover = true,
  fade = true,
  showPauseControl = true,
  labels,
  className,
  itemClassName,
}: LogoMarqueeProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...defaultLabels, ...labels };
  const sectionRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const itemClass = cn(baseItem, itemClassName);

  // Play only on screen and in a visible tab
  useEffect(() => {
    if (reduceMotion) return;
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "64px" });
    io.observe(el);
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduceMotion]);

  if (reduceMotion) {
    return (
      <section aria-label={text.region} className={cn("w-full", className)}>
        <ul className="flex flex-wrap items-center justify-center" style={{ columnGap: gap, rowGap: gap / 2 }}>
          {items.map((item) => (
            <li key={item.id} className={itemClass} aria-label={item.label}>
              {item.content}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const halted = paused || !inView || !tabVisible;
  const reversed = direction === "left" ? "right" : "left";

  return (
    <section
      ref={sectionRef}
      aria-label={text.region}
      className={cn("group/marquee relative flex w-full items-center gap-3", className)}
    >
      <div className="flex min-w-0 flex-1 flex-col" style={{ rowGap: gap / 2 }}>
        <Track items={items} speed={speed} direction={direction} gap={gap} fade={fade} halted={halted} pauseOnHover={pauseOnHover} itemClass={itemClass} />
        {rows === 2 && (
          <Track
            items={[...items].reverse()}
            speed={speed * 0.8}
            direction={reversed}
            gap={gap}
            fade={fade}
            halted={halted}
            pauseOnHover={pauseOnHover}
            itemClass={itemClass}
            hidden
          />
        )}
      </div>

      {showPauseControl && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? text.play : text.pause}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-muted-foreground shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] transition-[color,scale] duration-150 hover:text-foreground hover:duration-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-safe:active:scale-[0.97] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]"
        >
          <svg
            viewBox="0 0 16 16"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {paused ? <path d="M5.5 3.5v9l6.5-4.5z" /> : <path d="M5.75 3.5v9M10.25 3.5v9" />}
          </svg>
        </button>
      )}

      <style>{`@keyframes sunui-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </section>
  );
}

function Track({
  items,
  speed,
  direction,
  gap,
  fade,
  halted,
  pauseOnHover,
  itemClass,
  hidden = false,
}: {
  items: MarqueeItem[];
  speed: number;
  direction: "left" | "right";
  gap: number;
  fade: boolean;
  halted: boolean;
  pauseOnHover: boolean;
  itemClass: string;
  hidden?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [listWidth, setListWidth] = useState(0);
  const [repeat, setRepeat] = useState(1);

  // Measure one copy of the list; repeat it when narrower than the container so the loop is seamless
  useIsoLayoutEffect(() => {
    const container = containerRef.current;
    const list = listRef.current;
    if (!container || !list) return;
    const measure = () => {
      const single = list.scrollWidth / repeat;
      if (single <= 0) return;
      setListWidth(single);
      setRepeat(Math.max(1, Math.ceil(container.clientWidth / single)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [repeat, items]);

  // Remove links or buttons in the copies from the Tab order, so the keyboard only reaches the first copy
  useEffect(() => {
    containerRef.current
      ?.querySelectorAll<HTMLElement>('[aria-hidden="true"] a, [aria-hidden="true"] button, [aria-hidden="true"] [tabindex]')
      .forEach((el) => el.setAttribute("tabindex", "-1"));
  });

  const duration = listWidth > 0 ? (listWidth * repeat) / Math.max(speed, 1) : 0;
  const group = Array.from({ length: repeat }, (_, r) =>
    items.map((item) => ({ ...item, key: `${r}-${item.id}`, ghost: hidden || r > 0 })),
  ).flat();
  const itemStyle: CSSProperties = { paddingRight: gap };
  // The only gradient allowed: an edge fade mask
  const mask = fade ? "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" : undefined;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      aria-hidden={hidden || undefined}
    >
      <div
        className={cn(
          "flex w-max",
          pauseOnHover &&
            "group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused]",
        )}
        style={{
          // Not the animation shorthand, or the inline play-state would override the hover pause
          animationName: duration ? "sunui-marquee" : undefined,
          animationDuration: `${duration}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationDirection: direction === "right" ? "reverse" : "normal",
          animationPlayState: halted ? "paused" : undefined,
        }}
      >
        <ul ref={listRef} className="flex shrink-0 items-center">
          {group.map((item) => (
            <li
              key={item.key}
              className={itemClass}
              style={itemStyle}
              aria-label={item.ghost ? undefined : item.label}
              aria-hidden={item.ghost || undefined}
            >
              {item.content}
            </li>
          ))}
        </ul>
        {/* The second copy is visual only and hidden from assistive tech; not inert, or logos in the copy would not light up on hover */}
        <ul className="flex shrink-0 items-center" aria-hidden="true">
          {group.map((item) => (
            <li key={item.key} className={itemClass} style={itemStyle}>
              {item.content}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
