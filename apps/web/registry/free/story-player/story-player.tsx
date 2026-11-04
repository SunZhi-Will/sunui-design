"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type Direction = "left" | "right";

export interface StoryAction {
  key: string;
  /** 按鈕的 title 與 aria-label */
  label: string;
  icon: ReactNode;
  onClick: () => void;
  /** 進行中：顯示轉圈並停用整排按鈕（原本的下載中狀態） */
  loading?: boolean;
  loadingLabel?: string;
  /** 只在最後一張顯示（原本的「查看所有寵物」） */
  lastOnly?: boolean;
}

export interface StoryPlayerProps {
  /** 每一張卡片的內容，卡片本身是 #0f0f0f 圓角深色底 */
  slides: ReactNode[];
  /** 每張停留毫秒數，最後兩張自動乘以 5 */
  duration?: number;
  autoPlay?: boolean;
  /** 受控模式的目前索引 */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  onPause?: () => void;
  onResume?: () => void;
  /** 最後兩張出現的底部動態島按鈕 */
  actions?: StoryAction[];
  /** 卡片寬度（px），原本是 480 */
  cardWidth?: number;
  /** true 時鋪滿整個視窗（原本的全螢幕模式） */
  fixed?: boolean;
  labels?: Partial<typeof defaultLabels>;
  className?: string;
}

const defaultLabels = {
  region: "Story",
  paused: "Paused",
  prev: "Previous story",
  next: "Next story",
  slideOf: (n: number, total: number) => `Story ${n} of ${total}`,
};

/** 原本動態島用的圖示（heroicons outline） */
export const storyIcons = {
  download: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
  share: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  ),
  replay: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  ),
  heart: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  ),
};

export function StoryIcon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg className={cn("h-4 w-4 md:h-[18px] md:w-[18px]", className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

const LONG_PRESS_MS = 300;

export function StoryPlayer({
  slides,
  duration = 5000,
  autoPlay = true,
  index: controlledIndex,
  defaultIndex = 0,
  onIndexChange,
  onPause,
  onResume,
  actions = [],
  cardWidth = 480,
  fixed = false,
  labels,
  className,
}: StoryPlayerProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const total = slides.length;
  const [innerIndex, setInnerIndex] = useState(defaultIndex);
  const currentIndex = controlledIndex ?? innerIndex;

  const [isPaused, setIsPaused] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const directionRef = useRef<Direction>("left");
  const pendingDirectionRef = useRef<Direction | null>(null);
  const prevIndexRef = useRef(currentIndex);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);
  const elapsedRef = useRef(0);

  const setIndex = useCallback(
    (next: number) => {
      if (controlledIndex === undefined) setInnerIndex(next);
      onIndexChange?.(next);
    },
    [controlledIndex, onIndexChange],
  );

  const goNext = useCallback(() => {
    if (currentIndex >= total - 1) return;
    pendingDirectionRef.current = "left";
    directionRef.current = "left";
    setIndex(currentIndex + 1);
  }, [currentIndex, total, setIndex]);

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    pendingDirectionRef.current = "right";
    directionRef.current = "right";
    setIndex(currentIndex - 1);
  }, [currentIndex, setIndex]);

  // 索引改變時，同步決定滑動方向並把進度歸零（在繪製前完成，避免閃爍）
  useLayoutEffect(() => {
    if (prevIndexRef.current === currentIndex) return;
    directionRef.current = pendingDirectionRef.current ?? (currentIndex > prevIndexRef.current ? "left" : "right");
    pendingDirectionRef.current = null;
    prevIndexRef.current = currentIndex;
    elapsedRef.current = 0;
    setProgress(0);
  }, [currentIndex]);

  // 最後兩張減慢五倍
  const actualDuration = currentIndex >= total - 2 ? duration * 5 : duration;

  // 進度條與自動前進共用同一個 rAF 迴圈
  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;
  useEffect(() => {
    if (isPaused) return;
    let start = Date.now() - elapsedRef.current;
    let raf = 0;
    const animate = () => {
      const elapsed = Date.now() - start;
      elapsedRef.current = elapsed;
      const p = Math.min((elapsed / actualDuration) * 100, 100);
      setProgress(p);
      if (p < 100) {
        raf = requestAnimationFrame(animate);
      } else if (autoPlay && currentIndex < total - 1) {
        start = Date.now();
        goNextRef.current();
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [currentIndex, isPaused, actualDuration, autoPlay, total]);

  // 長按 300ms 暫停，放開繼續
  const handleLongPressStart = useCallback(() => {
    suppressClickRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      suppressClickRef.current = true;
      setIsLongPressing(true);
      setIsPaused(true);
      onPause?.();
    }, LONG_PRESS_MS);
  }, [onPause]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressing) {
      setIsLongPressing(false);
      setIsPaused(false);
      onResume?.();
    }
  }, [isLongPressing, onResume]);

  useEffect(
    () => () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    },
    [],
  );

  // 點擊區在下一個 frame 才換頁，確保方向先更新
  const tap = (dir: Direction) => () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    requestAnimationFrame(() => (dir === "left" ? goNextRef.current() : goPrevRef.current()));
  };
  const goPrevRef = useRef(goPrev);
  goPrevRef.current = goPrev;

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") goNext();
    else if (e.key === "ArrowLeft") goPrev();
    else if (e.key === " " && e.target === e.currentTarget) {
      setIsPaused((p) => {
        if (p) onResume?.();
        else onPause?.();
        return !p;
      });
    } else return;
    e.preventDefault();
  }

  const isEnd = currentIndex >= total - 2;
  const busy = actions.some((a) => a.loading);
  const visibleActions = actions.filter((a) => !a.lastOnly || currentIndex === total - 1);
  const dir = directionRef.current;

  const cardStyle: CSSProperties = fixed
    ? { width: "100%", height: "calc(100vh - 120px)", maxHeight: 800 }
    : { width: "100%", aspectRatio: "3 / 5", maxHeight: 800 };

  const pulse = reduce
    ? { duration: 0 }
    : ({ delay: 0.5, repeat: Infinity, repeatType: "reverse", duration: 1.5 } as const);

  return (
    <div
      role="region"
      aria-roledescription="story"
      aria-label={t.region}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        "overflow-hidden bg-black text-white outline-none select-none focus-visible:ring-2 focus-visible:ring-white/60",
        fixed ? "fixed inset-0 h-screen w-screen" : "relative w-full",
        className,
      )}
      style={{ touchAction: "pan-x pan-y" }}
    >
      {/* 點狀網格背景 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />

      <div className="relative flex h-full w-full items-center justify-center p-4 md:p-8">
        <div className="relative flex w-full flex-col items-center">
          {/* 進度條，在卡片上方 */}
          <div className="z-50 mb-2 px-3 md:mb-3" style={{ width: `min(${cardWidth}px, 100%)` }} aria-hidden="true">
            <div className="pointer-events-none relative flex w-full gap-[2px]">
              {slides.map((_, i) => {
                const p = i < currentIndex ? 100 : i === currentIndex ? progress : 0;
                return (
                  <div key={i} className="relative h-[3px] min-w-0 flex-1 overflow-hidden rounded-[1.5px] bg-white/40">
                    <div
                      className="absolute top-0 left-0 h-full w-full origin-left rounded-[1.5px] bg-white will-change-transform"
                      style={{ transform: `scaleX(${p / 100})`, transition: "transform 0.05s linear" }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 卡片與左右提示箭頭 */}
          <div className="relative" style={{ width: fixed ? `min(${cardWidth}px, calc(100vw - 32px))` : `min(${cardWidth}px, 100%)` }}>
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={currentIndex}
                custom={dir}
                variants={{
                  enter: (d: Direction) => ({ opacity: 0, scale: reduce ? 1 : 0.95, x: reduce ? 0 : d === "left" ? 100 : -100 }),
                  center: { opacity: 1, scale: 1, x: 0 },
                  exit: (d: Direction) => ({ opacity: 0, scale: reduce ? 1 : 0.95, x: reduce ? 0 : d === "left" ? -100 : 100 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduce ? 0 : 0.3, ease: "easeInOut" }}
                className="relative z-10 shrink-0 overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#0f0f0f] shadow-[0_8px_24px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] md:rounded-[24px] md:shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.03)]"
                style={{ ...cardStyle, touchAction: "pan-y" }}
                onPointerDown={handleLongPressStart}
                onPointerUp={handleLongPressEnd}
                onPointerCancel={handleLongPressEnd}
                onContextMenu={(e) => e.preventDefault()}
              >
                {/* 左三分之一：上一張 */}
                {currentIndex > 0 && <div aria-hidden="true" className="absolute top-0 bottom-0 left-0 z-40 w-1/3 cursor-pointer" onClick={tap("right")} />}
                {/* 右三分之一：下一張 */}
                {currentIndex < total - 1 && (
                  <div aria-hidden="true" className="absolute top-0 right-0 bottom-0 z-40 w-1/3 cursor-pointer" onClick={tap("left")} />
                )}
                {slides[currentIndex]}
              </motion.div>
            </AnimatePresence>

            {/* 右側提示箭頭（窄螢幕會落在畫面外，所以只在 md 以上顯示） */}
            {currentIndex < total - 1 && (
              <motion.button
                type="button"
                aria-label={t.next}
                className="absolute top-1/2 left-full z-20 hidden -translate-y-1/2 cursor-pointer md:block"
                initial={{ opacity: 0, x: reduce ? 0 : -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={pulse}
                onClick={(e) => {
                  e.stopPropagation();
                  requestAnimationFrame(() => goNextRef.current());
                }}
              >
                <ArrowBubble d="M9 5l7 7-7 7" />
              </motion.button>
            )}
            {currentIndex > 0 && (
              <motion.button
                type="button"
                aria-label={t.prev}
                className="absolute top-1/2 right-full z-20 hidden -translate-y-1/2 cursor-pointer md:block"
                initial={{ opacity: 0, x: reduce ? 0 : 5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={pulse}
                onClick={(e) => {
                  e.stopPropagation();
                  requestAnimationFrame(() => goPrevRef.current());
                }}
              >
                <ArrowBubble d="M15 19l-7-7 7-7" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {isPaused && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="flex items-center gap-2 text-lg text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
            </svg>
            {t.paused}
          </div>
        </div>
      )}

      {/* 底部動態島：最後兩張出現 */}
      {isEnd && visibleActions.length > 0 && (
        <div className={cn("pointer-events-auto bottom-1 left-0 right-0 z-[100] flex justify-center", fixed ? "fixed" : "absolute")}>
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: reduce ? 0 : 0.7, duration: reduce ? 0 : 0.4 }}
          >
            <div className="rounded-full border border-white/10 bg-black/60 px-3 py-2 shadow-2xl backdrop-blur-xl md:px-4 md:py-2.5">
              <div className="flex flex-row items-center justify-center gap-2 md:gap-2.5">
                {visibleActions.map((a, i) => {
                  const label = a.loading ? (a.loadingLabel ?? a.label) : a.label;
                  return (
                    <motion.button
                      key={a.key}
                      type="button"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: reduce ? 0 : 0.85 + i * 0.05, duration: reduce ? 0 : 0.3 }}
                      onClick={a.onClick}
                      disabled={busy}
                      title={label}
                      aria-label={label}
                      aria-busy={a.loading || undefined}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:h-10 md:w-10",
                        a.loading
                          ? "cursor-not-allowed bg-white/20 text-white/50"
                          : "bg-white/10 text-white hover:bg-white/20 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                    >
                      {a.loading ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" />
                      ) : (
                        <StoryIcon>{a.icon}</StoryIcon>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {t.slideOf(currentIndex + 1, total)}
      </span>
    </div>
  );
}

function ArrowBubble({ d }: { d: string }) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm transition-colors hover:bg-white/20 md:h-12 md:w-12">
      <svg className="h-5 w-5 text-white md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
      </svg>
    </span>
  );
}
