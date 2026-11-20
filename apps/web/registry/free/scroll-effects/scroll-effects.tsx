"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { Children, useEffect, useRef, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

/** Nine scroll effects, each a named component */
export const scrollEffects = [
  "parallax",
  "horizontal-scroll",
  "zoom-on-scroll",
  "velocity-skew",
  "scroll-marquee",
  "circle-reveal",
  "split-doors",
  "stacking-cards",
  "scroll-draw-path",
] as const;
export type ScrollEffectId = (typeof scrollEffects)[number];

type ScrollOffset = NonNullable<Parameters<typeof useScroll>[0]>["offset"];

export interface ScrollEffectBaseProps {
  /** Pass this when used inside a scrollable container (the container needs position: relative); by default it follows the whole window scroll */
  container?: RefObject<HTMLElement | null>;
  /** Externally supplied progress from 0 to 1; when given, scroll is not read and pinned sections no longer stretch (good for thumbnails or autoplay) */
  progress?: MotionValue<number>;
  /** Height of one "screen"; pinned sections use it as their unit. Inside a container pass the container height, e.g. "480px" */
  stageHeight?: string;
  className?: string;
}

const DEFAULT_STAGE = "100dvh";

/** Reads the target's progress relative to the scroll container; ...{ layoutEffect: false } lets the parent's container ref attach first */
function useSectionProgress(
  target: RefObject<HTMLElement | null>,
  container: RefObject<HTMLElement | null> | undefined,
  offset: ScrollOffset,
  external?: MotionValue<number>,
) {
  const { scrollYProgress } = useScroll({ target, container, offset, ...{ layoutEffect: false } });
  return external ?? scrollYProgress;
}

/** Total length of a pinned section: with external progress it takes only one screen */
function trackHeight(stage: string, screens: number, external: boolean) {
  return external ? stage : `calc(${stage} * ${screens})`;
}

const tint = (n: number) => `color-mix(in oklab, var(--primary) ${n}%, var(--background))`;

/* ------------------------------------------------------------------ */
/* 1. parallax: far, middle and near layers move at different speeds */
/* ------------------------------------------------------------------ */

export interface ParallaxLayersProps extends ScrollEffectBaseProps {
  /** Central foreground content, moves normally with the page */
  children?: ReactNode;
  far?: ReactNode;
  mid?: ReactNode;
  near?: ReactNode;
  /** Maximum offset of the near layer (px); the far and middle layers scale down proportionally */
  distance?: number;
}

export function ParallaxLayers({
  children,
  far,
  mid,
  near,
  distance = 120,
  container,
  progress,
  stageHeight = DEFAULT_STAGE,
  className,
}: ParallaxLayersProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const p = useSectionProgress(ref, container, ["start end", "end start"], progress);
  // The far layer compensates in the opposite direction (looks slower), the near layer speeds up (looks faster)
  const yFar = useTransform(p, [0, 1], [-distance * 0.6, distance * 0.6]);
  const yMid = useTransform(p, [0, 1], [-distance * 0.25, distance * 0.25]);
  const yNear = useTransform(p, [0, 1], [distance * 0.5, -distance * 0.5]);

  return (
    <section
      ref={ref}
      className={cn("relative overflow-hidden bg-background text-foreground", className)}
      style={{ height: stageHeight }}
    >
      <motion.div aria-hidden className="absolute inset-0" style={reduce ? undefined : { y: yFar }}>
        {far ?? (
          <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-[20%] h-[85%] w-full">
            <circle cx="290" cy="60" r="26" fill={tint(45)} />
            <path d="M0 120 L60 80 L120 110 L190 60 L260 105 L330 70 L400 100 V200 H0Z" fill={tint(18)} />
          </svg>
        )}
      </motion.div>
      <motion.div aria-hidden className="absolute inset-0" style={reduce ? undefined : { y: yMid }}>
        {mid ?? (
          <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-[20%] h-[70%] w-full">
            <path d="M0 130 C70 90 120 140 200 110 S330 80 400 120 V200 H0Z" fill={tint(38)} />
          </svg>
        )}
      </motion.div>
      <motion.div aria-hidden className="absolute inset-0" style={reduce ? undefined : { y: yNear }}>
        {near ?? (
          <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-[25%] h-[55%] w-full">
            <path d="M0 120 C90 70 160 150 250 110 S360 90 400 100 V200 H0Z" fill={tint(70)} />
          </svg>
        )}
      </motion.div>
      <div className="relative z-10 flex h-full items-center justify-center p-6 text-center">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. horizontal-scroll: the section pins and a row of panels moves sideways as you scroll down */
/* ------------------------------------------------------------------ */

export interface HorizontalScrollProps extends ScrollEffectBaseProps {
  /** Each child is a panel */
  children: ReactNode;
  /** Class for each panel; the default width is about 80% of the screen */
  panelClassName?: string;
}

export function HorizontalScroll({
  children,
  panelClassName,
  container,
  progress,
  stageHeight = DEFAULT_STAGE,
  className,
}: HorizontalScrollProps) {
  const ref = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const panels = Children.toArray(children);
  const p = useSectionProgress(ref, container, ["start start", "end end"], progress);
  // Scrollable distance = row width minus stage width, measured again when sizes change
  const shift = useMotionValue(0);
  const x = useTransform(() => -p.get() * shift.get());

  useEffect(() => {
    const s = stage.current;
    const r = row.current;
    if (!s || !r) return;
    const measure = () => shift.set(Math.max(0, r.scrollWidth - s.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(s);
    ro.observe(r);
    return () => ro.disconnect();
  }, [shift, reduce]);

  const panelCls = cn("w-[min(80%,28rem)] shrink-0 snap-center", panelClassName);

  if (reduce) {
    // Reduced motion: a plain horizontal scroll list
    return (
      <section ref={ref} className={cn("relative", className)}>
        <div ref={stage} className="overflow-x-auto">
          <div ref={row} className="flex snap-x gap-4 p-6">
            {panels.map((panel, i) => (
              <div key={i} className={panelCls}>
                {panel}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className={cn("relative", className)} style={{ height: trackHeight(stageHeight, Math.max(2, panels.length), !!progress) }}>
      <div ref={stage} className="sticky top-0 flex items-center overflow-hidden" style={{ height: stageHeight }}>
        <motion.div ref={row} className="flex w-max gap-4 px-6" style={{ x }}>
          {panels.map((panel, i) => (
            <div key={i} className={panelCls}>
              {panel}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. zoom-on-scroll: a small image grows to fill the screen, then the title fades in */
/* ------------------------------------------------------------------ */

export interface ZoomOnScrollProps extends ScrollEffectBaseProps {
  src?: string;
  alt?: string;
  /** Custom visual to use when there is no image (e.g. SVG or a gradient) */
  art?: ReactNode;
  /** Title that fades in after the zoom completes */
  title?: ReactNode;
  children?: ReactNode;
}

export function ZoomOnScroll({
  src,
  alt = "",
  art,
  title,
  children,
  container,
  progress,
  stageHeight = DEFAULT_STAGE,
  className,
}: ZoomOnScrollProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const p = useSectionProgress(ref, container, ["start start", "end end"], progress);
  const inset = useTransform(p, [0, 0.6], [32, 0]);
  const clipPath = useTransform(inset, (v) => `inset(${v}% ${v * 1.1}% round ${v > 0.5 ? 16 : 0}px)`);
  const scale = useTransform(p, [0, 0.6], [1.25, 1]);
  const textOpacity = useTransform(p, [0.6, 0.85], [0, 1]);
  const textY = useTransform(p, [0.6, 0.85], [24, 0]);

  const media = src ? (
    <img src={src} alt={alt} className="size-full object-cover" />
  ) : (
    (art ?? <div aria-hidden className="size-full" style={{ background: `linear-gradient(135deg, ${tint(80)}, ${tint(25)})` }} />)
  );

  return (
    <section
      ref={ref}
      className={cn("relative text-foreground", className)}
      style={{ height: reduce ? stageHeight : trackHeight(stageHeight, 2.2, !!progress) }}
    >
      <div className="sticky top-0 overflow-hidden" style={{ height: stageHeight }}>
        <motion.div className="absolute inset-0" style={reduce ? undefined : { clipPath }}>
          <motion.div className="size-full" style={reduce ? undefined : { scale }}>
            {media}
          </motion.div>
        </motion.div>
        {(title || children) && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/55 p-6 text-center"
            style={reduce ? undefined : { opacity: textOpacity }}
          >
            <motion.div style={reduce ? undefined : { y: textY }}>
              {title && <div className="text-3xl font-semibold tracking-tight sm:text-5xl">{title}</div>}
              {children}
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. velocity-skew: skews with scroll velocity and springs back when it stops */
/* ------------------------------------------------------------------ */

export interface VelocitySkewProps extends ScrollEffectBaseProps {
  /** Each child skews on its own */
  children: ReactNode;
  /** Maximum skew angle (deg) */
  maxSkew?: number;
}

export function VelocitySkew({ children, maxSkew = 10, container, progress, className }: VelocitySkewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const { scrollY } = useScroll({ target: ref, container, ...{ layoutEffect: false } });
  // Convert external progress into imaginary pixels so thumbnails can show the skew too
  const zero = useMotionValue(0);
  const fakeY = useTransform(progress ?? zero, (v) => v * 2400);
  const velocity = useVelocity(progress ? fakeY : scrollY);
  const target = useTransform(velocity, [-2500, 2500], [-maxSkew, maxSkew]);
  const skewY = useSpring(target, { stiffness: 320, damping: 40 });

  return (
    <div ref={ref} className={cn("flex flex-col gap-4", className)}>
      {Children.map(children, (child) => (
        <motion.div style={reduce ? undefined : { skewY }}>{child}</motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. scroll-marquee: rows of large text move sideways in opposite directions as you scroll */
/* ------------------------------------------------------------------ */

export interface ScrollMarqueeProps extends ScrollEffectBaseProps {
  rows: string[];
  /** Horizontal travel as a percentage of the total row width */
  distance?: number;
  /** Even rows become outlined text */
  outlineAlternate?: boolean;
  rowClassName?: string;
}

export function ScrollMarquee({
  rows,
  distance = 25,
  outlineAlternate = true,
  rowClassName,
  container,
  progress,
  className,
}: ScrollMarqueeProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const p = useSectionProgress(ref, container, ["start end", "end start"], progress);

  return (
    <section ref={ref} className={cn("relative overflow-hidden py-8 text-foreground", className)}>
      <ul className="sr-only">
        {rows.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
      <div aria-hidden className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <MarqueeRow
            key={i}
            text={r}
            progress={p}
            reverse={i % 2 === 1}
            distance={distance}
            reduce={reduce}
            outline={outlineAlternate && i % 2 === 1}
            className={rowClassName}
          />
        ))}
      </div>
    </section>
  );
}

function MarqueeRow({
  text,
  progress,
  reverse,
  distance,
  reduce,
  outline,
  className,
}: {
  text: string;
  progress: MotionValue<number>;
  reverse: boolean;
  distance: number;
  reduce: boolean;
  outline: boolean;
  className?: string;
}) {
  const x = useTransform(progress, [0, 1], reverse ? [`-${distance}%`, "0%"] : ["0%", `-${distance}%`]);
  return (
    <motion.div
      className={cn(
        "flex w-max gap-[0.4em] whitespace-nowrap text-5xl font-black leading-none tracking-tight sm:text-7xl",
        outline && "text-transparent [-webkit-text-stroke:1.5px_var(--foreground)]",
        className,
      )}
      style={reduce ? undefined : { x }}
    >
      {Array.from({ length: 6 }, (_, k) => (
        <span key={k}>
          {text}
          <span className="px-[0.2em] text-primary [-webkit-text-stroke:0]">·</span>
        </span>
      ))}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. circle-reveal: a circular mask grows from the center to reveal the next section */
/* ------------------------------------------------------------------ */

export interface CircleRevealProps extends ScrollEffectBaseProps {
  /** The visual seen at first */
  front: ReactNode;
  /** The next section revealed by the circle */
  children: ReactNode;
}

export function CircleReveal({ front, children, container, progress, stageHeight = DEFAULT_STAGE, className }: CircleRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const p = useSectionProgress(ref, container, ["start start", "end end"], progress);
  // A radius of 75% is enough to cover all four corners
  const clipPath = useTransform(p, [0.1, 0.9], ["circle(0% at 50% 50%)", "circle(75% at 50% 50%)"]);

  if (reduce) {
    return (
      <section ref={ref} className={cn("relative", className)}>
        <div style={{ minHeight: stageHeight }}>{front}</div>
        <div style={{ minHeight: stageHeight }}>{children}</div>
      </section>
    );
  }

  return (
    <section ref={ref} className={cn("relative", className)} style={{ height: trackHeight(stageHeight, 2, !!progress) }}>
      <div className="sticky top-0 overflow-hidden" style={{ height: stageHeight }}>
        <div className="absolute inset-0">{front}</div>
        <motion.div className="absolute inset-0" style={{ clipPath }}>
          {children}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. split-doors: the visual splits into two doors from the middle and slides apart as you scroll */
/* ------------------------------------------------------------------ */

export interface SplitDoorsProps extends ScrollEffectBaseProps {
  /** Visual on the doors, cut into left and right halves at the exact center */
  cover: ReactNode;
  /** Content behind the doors */
  children: ReactNode;
  /** Class for the doors, default bg-foreground text-background */
  doorClassName?: string;
}

export function SplitDoors({ cover, children, doorClassName, container, progress, stageHeight = DEFAULT_STAGE, className }: SplitDoorsProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const p = useSectionProgress(ref, container, ["start start", "end end"], progress);
  const leftX = useTransform(p, [0.1, 0.8], ["0%", "-100%"]);
  const rightX = useTransform(p, [0.1, 0.8], ["0%", "100%"]);
  const contentScale = useTransform(p, [0.1, 0.8], [0.9, 1]);
  const contentOpacity = useTransform(p, [0.1, 0.6], [0.3, 1]);

  const door = cn("absolute inset-y-0 w-1/2 overflow-hidden bg-foreground text-background", doorClassName);

  if (reduce) {
    return (
      <section ref={ref} className={cn("relative", className)}>
        <div className={cn("relative overflow-hidden bg-foreground text-background", doorClassName)} style={{ minHeight: stageHeight }}>
          {cover}
        </div>
        <div style={{ minHeight: stageHeight }}>{children}</div>
      </section>
    );
  }

  return (
    <section ref={ref} className={cn("relative", className)} style={{ height: trackHeight(stageHeight, 2, !!progress) }}>
      <div className="sticky top-0 overflow-hidden" style={{ height: stageHeight }}>
        <motion.div className="absolute inset-0" style={{ scale: contentScale, opacity: contentOpacity }}>
          {children}
        </motion.div>
        <motion.div aria-hidden className={cn(door, "left-0 shadow-[8px_0_24px_-12px_rgba(0,0,0,0.5)]")} style={{ x: leftX }}>
          <div className="absolute inset-y-0 left-0 w-[200%]">{cover}</div>
        </motion.div>
        <motion.div className={cn(door, "right-0 shadow-[-8px_0_24px_-12px_rgba(0,0,0,0.5)]")} style={{ x: rightX }}>
          {/* The right door carries the readable text for screen readers, the left door is aria-hidden */}
          <div className="absolute inset-y-0 right-0 w-[200%]">{cover}</div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 8. stacking-cards: cards stick to the top and stack up, earlier ones shrink and darken */
/* ------------------------------------------------------------------ */

export interface StackingCardsProps extends ScrollEffectBaseProps {
  /** Each child is a card */
  children: ReactNode;
  cardClassName?: string;
  /** Downward offset of each card (px), so the cards behind show their edge */
  peek?: number;
}

export function StackingCards({
  children,
  cardClassName,
  peek = 14,
  container,
  progress,
  stageHeight = DEFAULT_STAGE,
  className,
}: StackingCardsProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const cards = Children.toArray(children);
  const p = useSectionProgress(ref, container, ["start start", "end end"], progress);
  const cardCls = cn("h-[70%] w-full max-w-md overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg", cardClassName);

  if (reduce) {
    return (
      <section ref={ref} className={cn("flex flex-col items-center gap-4 p-6", className)}>
        {cards.map((card, i) => (
          <div key={i} className={cardCls} style={{ height: `calc(${stageHeight} * 0.7)` }}>
            {card}
          </div>
        ))}
      </section>
    );
  }

  // External progress: all cards stack in one screen and slide in one by one with the progress
  if (progress) {
    return (
      <section ref={ref} className={cn("relative overflow-hidden", className)} style={{ height: stageHeight }}>
        {cards.map((card, i) => (
          <StackCard key={i} index={i} total={cards.length} progress={p} peek={peek} className={cardCls} overlay>
            {card}
          </StackCard>
        ))}
      </section>
    );
  }

  return (
    <section ref={ref} className={cn("relative", className)}>
      {cards.map((card, i) => (
        <div key={i} className="sticky top-0 flex items-center justify-center px-6" style={{ height: stageHeight, paddingTop: i * peek }}>
          <StackCard index={i} total={cards.length} progress={p} peek={peek} className={cardCls}>
            {card}
          </StackCard>
        </div>
      ))}
    </section>
  );
}

function StackCard({
  index,
  total,
  progress,
  peek,
  className,
  overlay = false,
  children,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  peek: number;
  className: string;
  overlay?: boolean;
  children: ReactNode;
}) {
  const depth = total - 1 - index;
  const start = index / total;
  const scale = useTransform(progress, [start, 1], [1, 1 - depth * 0.06]);
  const filter = useTransform(progress, [start, 1], ["brightness(1)", `brightness(${1 - depth * 0.15})`]);
  // Used only in overlay mode: the card slides in from below
  const enter = useTransform(progress, [Math.max(0, (index - 1) / total), start], index === 0 ? ["0%", "0%"] : ["120%", "0%"]);

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center px-6" style={{ paddingTop: index * peek }}>
        <motion.div className={cn(className, "origin-top")} style={{ y: enter, scale, filter }}>
          {children}
        </motion.div>
      </div>
    );
  }
  return (
    <motion.div className={cn(className, "origin-top")} style={{ scale, filter }}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* 9. scroll-draw-path: a curve is drawn as you scroll, linking the sections */
/* ------------------------------------------------------------------ */

export interface ScrollDrawPathProps extends ScrollEffectBaseProps {
  /** Paragraphs laid out along the curve */
  children: ReactNode;
  /** SVG path in a 0 to 100 (width) by 0 to 100 (height) coordinate system, stretched to the whole section */
  d?: string;
  strokeWidth?: number;
  /** Line color, default var(--primary) */
  color?: string;
}

const DEFAULT_PATH = "M50 0 C 92 10, 92 24, 50 33 S 8 56, 50 66 S 92 90, 50 100";

export function ScrollDrawPath({
  children,
  d = DEFAULT_PATH,
  strokeWidth = 3,
  color = "var(--primary)",
  container,
  progress,
  className,
}: ScrollDrawPathProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const p = useSectionProgress(ref, container, ["start center", "end center"], progress);
  const smooth = useSpring(p, { stiffness: 200, damping: 40, restDelta: 0.001 });
  const full = useMotionValue(1);
  const pathLength = reduce ? full : progress ? p : smooth;

  return (
    <section ref={ref} className={cn("relative", className)}>
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full" fill="none">
        <path d={d} stroke="var(--border)" strokeWidth={strokeWidth} strokeDasharray="2 6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <motion.path
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength }}
        />
      </svg>
      <div className="relative z-10">{children}</div>
    </section>
  );
}
