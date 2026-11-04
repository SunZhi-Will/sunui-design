"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface StorySlide {
  id: string;
  content: ReactNode;
  /** 覆寫這一張的停留時間（毫秒），例如最後幾張放久一點 */
  duration?: number;
}

export interface StoryPlayerProps {
  slides: StorySlide[];
  /** 預設每張停留時間（毫秒） */
  duration?: number;
  /** 未指定時自動播放；reduced motion 下只有明確給 true 才自動前進 */
  autoPlay?: boolean;
  onEnd?: () => void;
  endActions?: { label: ReactNode; onClick: () => void }[];
  /** CSS aspect-ratio，預設 9 / 16 */
  aspect?: string;
  labels?: {
    region?: string;
    pause?: string;
    play?: string;
    replay?: string;
    endTitle?: ReactNode;
    slideOf?: (n: number, total: number) => string;
  };
  className?: string;
}

const defaultLabels = {
  region: "Story",
  pause: "Pause",
  play: "Play",
  replay: "Replay",
  endTitle: "That's everything",
  slideOf: (n: number, total: number) => `Slide ${n} of ${total}`,
};

const springs = { gentle: { type: "spring", stiffness: 240, damping: 30 } } as const;
const ease = [0.23, 1, 0.32, 1] as const;

export function StoryPlayer({
  slides,
  duration = 5000,
  autoPlay,
  onEnd,
  endActions = [],
  aspect = "9 / 16",
  labels,
  className,
}: StoryPlayerProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const auto = autoPlay ?? !reduce;
  const total = slides.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const elapsed = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [playing, setPlaying] = useState(auto);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [docVisible, setDocVisible] = useState(true);
  const ended = index >= total;

  useEffect(() => setPlaying(autoPlay ?? !reduce), [autoPlay, reduce]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    const onVis = () => setDocVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  function go(delta: 1 | -1) {
    const next = Math.max(0, Math.min(total, index + delta));
    if (next === index) return;
    elapsed.current = 0;
    setDirection(delta);
    setIndex(next);
    if (next === total) onEnd?.();
  }

  const goRef = useRef(go);
  goRef.current = go;

  // 換頁時把前面的進度條填滿、目前與後面的歸零
  useEffect(() => {
    bars.current.forEach((bar, i) => {
      if (bar) bar.style.transform = `scaleX(${i < index ? 1 : 0})`;
    });
  }, [index]);

  // 進度條由 rAF 直接寫 transform，不經過 React state
  useEffect(() => {
    if (ended || !playing || paused || !inView || !docVisible) return;
    const span = slides[index]?.duration ?? duration;
    let prev = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      elapsed.current += now - prev;
      prev = now;
      const p = Math.min(1, elapsed.current / span);
      const bar = bars.current[index];
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (p >= 1) return goRef.current(1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, ended, playing, paused, inView, docVisible, duration, slides]);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    held.current = false;
    holdTimer.current = setTimeout(() => {
      held.current = true;
      setPaused(true);
    }, 220);
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (held.current) {
      held.current = false;
      setPaused(false);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    go(e.clientX - r.left < r.width / 3 ? -1 : 1);
  }

  function onPointerCancel() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (held.current) setPaused(false);
    held.current = false;
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === " " && e.target === e.currentTarget) setPlaying((p) => !p);
    else return;
    e.preventDefault();
  }

  const replay = () => {
    elapsed.current = 0;
    setDirection(-1);
    setPaused(false);
    setPlaying(true);
    setIndex(0);
  };

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { x: `${d * 100}%`, opacity: 1 }),
    center: { x: "0%", opacity: 1 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { x: `${d * -100}%`, opacity: 1 }),
  };

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="story"
      aria-label={t.region}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        "relative w-full max-w-[320px] overflow-hidden rounded-xl border border-border bg-card text-card-foreground outline-none select-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      style={{ aspectRatio: aspect }}
    >
      <div
        className="absolute inset-0 touch-manipulation"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={ended ? "end" : slides[index].id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduce ? { duration: 0.2 } : springs.gentle}
            className="absolute inset-0 flex flex-col pt-10"
          >
            {ended ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
                <p className="text-lg font-semibold tracking-tight">{t.endTitle}</p>
                <ul className="flex flex-wrap justify-center gap-2" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
                  {[...endActions, { label: t.replay, onClick: replay }].map((a, i) => (
                    <motion.li
                      key={i}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.24, ease, delay: reduce ? 0 : 0.08 + i * 0.06 }}
                    >
                      <button
                        type="button"
                        onClick={a.onClick}
                        className={cn(
                          "rounded-md px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          i === 0 ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted",
                        )}
                      >
                        {a.label}
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </div>
            ) : (
              slides[index].content
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 分段進度條 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 top-3 flex gap-1">
        {slides.map((s, i) => (
          <span key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-foreground/15">
            <span
              ref={(el) => {
                bars.current[i] = el;
              }}
              className="block h-full origin-left bg-foreground"
              style={{ transform: `scaleX(${i < index || ended ? 1 : 0})` }}
            />
          </span>
        ))}
      </div>

      {!ended && (
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? t.pause : t.play}
          className="absolute top-5 right-2 flex size-8 items-center justify-center rounded-full text-foreground/70 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {!playing ? <path d="M8 5.5v13l10-6.5z" /> : <path d="M9 5v14M15 5v14" />}
          </svg>
        </button>
      )}

      <span className="sr-only" aria-live="polite">
        {ended ? (typeof t.endTitle === "string" ? t.endTitle : "") : t.slideOf(index + 1, total)}
      </span>
    </div>
  );
}
