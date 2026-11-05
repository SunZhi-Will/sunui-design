"use client";

import { animate, useInView, useMotionValue, useReducedMotion, type AnimationPlaybackControls } from "framer-motion";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { cn } from "@/lib/utils";

export type RibbonItem = { src: string; alt: string; title?: string };

export type RibbonCarouselProps = {
  items: RibbonItem[];
  /** Cylinder radius in px. Smaller is more curved. */
  radius?: number;
  cardWidth?: number;
  cardHeight?: number;
  /** Gap between cards along the curve, in px. */
  gap?: number;
  /** Cards shown on each side of the active one. */
  visible?: number;
  /** convex: the ribbon bends away from you; concave: it wraps around you. */
  curve?: "convex" | "concave";
  /** Wrap around from the last card to the first. */
  loop?: boolean;
  /** Advance every few seconds while visible. Off by default and with reduced motion. */
  autoplay?: boolean | number;
  onChange?: (index: number, item: RibbonItem) => void;
  /** Accessible name for the carousel. */
  label?: string;
  /** Names for the arrow buttons. */
  labels?: { previous: string; next: string };
  className?: string;
};

const gentle = { type: "spring", stiffness: 240, damping: 30 } as const;
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Cards on a curved ribbon. Drag or flick sideways (it snaps to the nearest
 * card), use the arrow keys, or click a side card to bring it to the middle.
 */
export function RibbonCarousel({
  items,
  radius = 620,
  cardWidth = 240,
  cardHeight = 320,
  gap = 20,
  visible = 3,
  curve = "convex",
  loop = true,
  autoplay = false,
  onChange,
  label = "Carousel",
  labels = { previous: "Previous", next: "Next" },
  className,
}: RibbonCarouselProps) {
  const reduce = useReducedMotion();
  const n = items.length;
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const inView = useInView(root, { amount: 0.3 });
  const pos = useMotionValue(0);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const drag = useRef<null | { id: number; x: number; start: number; moved: boolean }>(null);
  const [active, setActive] = useState(0);
  const [scale, setScale] = useState(1);
  const [paused, setPaused] = useState(false);
  const step = cardWidth + gap;

  const wrapDist = (d: number) => (loop ? ((((d + n / 2) % n) + n) % n) - n / 2 : d);
  const indexOf = (p: number) => (loop ? ((Math.round(p) % n) + n) % n : Math.max(0, Math.min(n - 1, Math.round(p))));

  // Fit narrow containers.
  // Height comes from CSS (aspect-ratio on the sizer), so scaling never moves
  // the page; measured before paint so the first frame is already right.
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = (w: number) => setScale(Math.min(1, w / (cardWidth * 1.55)));
    fit(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => fit(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [cardWidth]);

  // Write card transforms straight to the DOM on every position change.
  useIsoLayoutEffect(() => {
    if (reduce) return;
    const paint = (p: number) => {
      const sign = curve === "convex" ? 1 : -1;
      cards.current.forEach((el, i) => {
        if (!el) return;
        const d = wrapDist(i - p);
        const a = (d * step) / radius;
        const x = Math.sin(a) * radius;
        const z = sign * -(1 - Math.cos(a)) * radius;
        const far = Math.abs(d);
        el.style.transform = `translate3d(${x}px,0,${z}px) rotateY(${sign * a}rad)`;
        el.style.opacity = String(far > visible + 0.5 ? 0 : Math.max(0, 1 - Math.max(0, far - visible + 0.5) * 2) * (1 - far * 0.08));
        el.style.visibility = far > visible + 0.6 ? "hidden" : "visible";
        el.style.zIndex = String(100 - Math.round(far * 10));
      });
      const next = indexOf(p);
      setActive((prev) => (prev === next ? prev : next));
    };
    paint(pos.get());
    return pos.on("change", paint);
  });

  const firstChange = useRef(true);
  useEffect(() => {
    if (firstChange.current) {
      firstChange.current = false;
      return;
    }
    onChange?.(active, items[active]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const settle = (target: number, velocity = 0) => {
    anim.current?.stop();
    const t = loop ? target : Math.max(0, Math.min(n - 1, target));
    anim.current = animate(pos, t, { ...gentle, velocity });
  };
  const go = (delta: number) => settle(Math.round(pos.get()) + delta);

  // Autoplay: only while on screen, tab visible, and nobody is interacting.
  const interval = typeof autoplay === "number" ? autoplay : 4000;
  const playing = !!autoplay && !reduce && inView && !paused;
  useEffect(() => {
    if (!playing) return;
    let id = 0;
    const tick = () => {
      if (document.visibilityState === "visible" && !drag.current) go(1);
    };
    id = window.setInterval(tick, interval);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, interval]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    anim.current?.stop();
    drag.current = { id: e.pointerId, x: e.clientX, start: pos.get(), moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    let p = d.start - dx / (step * scale);
    if (!loop) {
      if (p < 0) p = p * 0.35;
      if (p > n - 1) p = n - 1 + (p - (n - 1)) * 0.35;
    }
    pos.set(p);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return;
    const v = pos.getVelocity();
    settle(Math.round(pos.get() + v * 0.2), v);
    const stop = (ev: MouseEvent) => ev.stopPropagation();
    window.addEventListener("click", stop, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 0);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "Home" && !loop) settle(0);
    else if (e.key === "End" && !loop) settle(n - 1);
    else return;
    e.preventDefault();
  };

  const current = items[active];

  if (reduce) {
    return (
      <ul aria-label={label} className={cn("flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2", className)}>
        {items.map((item, i) => (
          <li key={i} className="shrink-0 snap-center" style={{ width: Math.min(cardWidth, 280) }}>
            <img src={item.src} alt={item.alt} className="aspect-[3/4] w-full rounded-lg border border-border object-cover" />
            {item.title && <p className="mt-2 text-sm font-medium text-foreground">{item.title}</p>}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={root}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="relative w-full cursor-grab touch-pan-y select-none overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      >
        <div
          aria-hidden
          className="pointer-events-none mx-auto my-4 w-full"
          style={{ maxWidth: cardWidth * 1.55, aspectRatio: `${cardWidth * 1.55} / ${cardHeight}` }}
        />
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: cardWidth,
            height: cardHeight,
            marginLeft: -cardWidth / 2,
            marginTop: -cardHeight / 2,
            transform: `scale(${scale})`,
            perspective: radius * 2.2,
            transformStyle: "preserve-3d",
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              ref={(node) => {
                cards.current[i] = node;
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${n}${item.title ? `, ${item.title}` : ""}`}
              aria-hidden={i !== active}
              onClick={() => i !== active && settle(Math.round(pos.get() + wrapDist(i - pos.get())))}
              className={cn(
                "absolute inset-0 overflow-hidden rounded-lg border border-border bg-muted will-change-transform",
                i !== active && "cursor-pointer",
              )}
            >
              <img src={item.src} alt={item.alt} draggable={false} className="pointer-events-none h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <RibbonArrow dir={-1} label={labels.previous} onClick={() => go(-1)} disabled={!loop && active === 0} />
        {/* Fixed width, one line: titles of different lengths never push the arrows. */}
        <p aria-live={playing ? "off" : "polite"} className="flex w-[min(15rem,60vw)] items-baseline justify-center text-sm">
          <span className="truncate font-medium text-foreground">{current?.title ?? current?.alt}</span>
          <span className="ml-2 shrink-0 tabular-nums text-muted-foreground">
            {active + 1}/{n}
          </span>
        </p>
        <RibbonArrow dir={1} label={labels.next} onClick={() => go(1)} disabled={!loop && active === n - 1} />
      </div>
    </div>
  );
}

function RibbonArrow({ dir, label, onClick, disabled }: { dir: 1 | -1; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === 1 ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
      </svg>
    </button>
  );
}
