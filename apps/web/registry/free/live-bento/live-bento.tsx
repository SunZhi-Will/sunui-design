"use client";

// 功能 Bento 格：每一格都有一個只在畫面內播放的小動畫。
// 卡片捲動進場（模糊 + 位移 + 淡入），滑鼠裝置 hover 上浮。

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ---------- 動畫樣式（原 welcome.css 的 ww-* keyframes） ---------- */

const CSS = `
.lb-root{--lb-success:var(--success,#15803D);--lb-warning:var(--warning,#B45309)}
@media (prefers-color-scheme: dark){.lb-root{--lb-success:var(--success,#4ADE80);--lb-warning:var(--warning,#FBBF24)}}
@keyframes lb-pop{0%{opacity:0;transform:translateY(6px) scale(.85)}70%{opacity:1;transform:translateY(-1px) scale(1.04)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes lb-swap-in{from{opacity:0;transform:translateY(6px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
@keyframes lb-slide-in-right{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
@keyframes lb-grow-x{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes lb-type{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes lb-pulse-red{0%,100%{box-shadow:0 0 0 0 color-mix(in oklab,var(--destructive) 30%,transparent)}50%{box-shadow:0 0 0 6px color-mix(in oklab,var(--destructive) 0%,transparent)}}
@keyframes lb-stamp{0%{opacity:0;transform:rotate(-12deg) scale(1.6)}60%{opacity:1;transform:rotate(-12deg) scale(.94)}100%{opacity:1;transform:rotate(-12deg) scale(1)}}
@keyframes lb-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes lb-blink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes lb-spin{to{transform:rotate(360deg)}}
.lb-pop{animation:lb-pop 420ms cubic-bezier(.2,.8,.2,1) both}
.lb-swap-in{animation:lb-swap-in 500ms cubic-bezier(.23,1,.32,1) both}
.lb-slide-in-right{animation:lb-slide-in-right 480ms cubic-bezier(.2,.8,.2,1) both}
.lb-grow-x{transform:scaleX(0);animation:lb-grow-x 1.6s cubic-bezier(.23,1,.32,1) forwards}
.lb-strike{transform:scaleX(0);animation:lb-grow-x 420ms cubic-bezier(.23,1,.32,1) forwards}
.lb-type{animation:lb-type 900ms steps(8,end) both}
.lb-pulse-red{animation:lb-pulse-red 1.8s ease-in-out infinite}
.lb-stamp{transform:rotate(-12deg);animation:lb-stamp 520ms cubic-bezier(.23,1,.32,1) both}
.lb-progress{transform-origin:left center;animation:lb-progress var(--lb-duration,2s) cubic-bezier(.4,0,.2,1) both}
.lb-blink{animation:lb-blink 1.2s ease-in-out infinite}
.lb-spin-once{animation:lb-spin 1.2s linear 1}
.lb-reveal{opacity:0;transform:translateY(18px);filter:blur(6px);transition:opacity 800ms cubic-bezier(.23,1,.32,1),transform 800ms cubic-bezier(.23,1,.32,1),filter 800ms cubic-bezier(.23,1,.32,1);transition-delay:var(--lb-delay,0ms)}
.lb-reveal[data-shown="true"]{opacity:1;transform:none;filter:none}
.lb-lift{transition:transform 400ms cubic-bezier(.23,1,.32,1),box-shadow 400ms cubic-bezier(.23,1,.32,1)}
@media (hover: hover) and (pointer: fine){.lb-lift:hover{transform:translateY(-3px);box-shadow:0 1px 2px rgba(0,0,0,.04),0 18px 40px -20px rgba(0,0,0,.22)}}
@media (prefers-reduced-motion: reduce){
.lb-reveal{opacity:1;transform:none;filter:none;transition:none}
.lb-pop,.lb-swap-in,.lb-slide-in-right,.lb-type,.lb-pulse-red,.lb-blink,.lb-spin-once,.lb-progress{animation:none}
.lb-grow-x,.lb-strike{transform:none;animation:none}
.lb-stamp{animation:none}
.lb-lift,.lb-lift:hover{transition:none;transform:none}
}
`;

/* ---------- hooks ---------- */

export function usePrefersReducedMotion() {
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

export function useInView<T extends Element>(options?: { once?: boolean; threshold?: number; rootMargin?: string }) {
  const { once = true, threshold = 0.2, rootMargin } = options ?? {};
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return { ref, inView };
}

/**
 * 在畫面內時每隔 period 毫秒遞增一次 tick，用來重播動畫。
 * 減少動態效果時只走到第一拍就停（顯示完成狀態）。
 */
export function useTicker(period: number) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>({ once: false, threshold: 0.35 });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!inView) return;
    setTick((t) => t + 1);
    if (reduced) return;
    const timer = window.setInterval(() => setTick((t) => t + 1), period);
    return () => window.clearInterval(timer);
  }, [inView, period, reduced]);
  return { ref, inView, tick };
}

/* ---------- 共用元件 ---------- */

/** 捲動進場：模糊 + 位移 + 淡入，強 ease-out。 */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 });
  return (
    <div ref={ref} data-shown={inView} className={cn("lb-reveal", className)} style={{ "--lb-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

/** 進入畫面時從 from 跳到目標值。 */
export function CountUp({
  to,
  from = 0,
  decimals = 0,
  duration = 1200,
  start = true,
  suffix = "",
}: {
  to: number;
  from?: number;
  decimals?: number;
  duration?: number;
  start?: boolean;
  suffix?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(from);
  const fromRef = useRef(from);

  useEffect(() => {
    if (!start) {
      setValue(fromRef.current);
      return;
    }
    if (reduced) {
      fromRef.current = to;
      setValue(to);
      return;
    }
    let frame = 0;
    const begin = performance.now();
    const origin = fromRef.current;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - begin) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(origin + (to - origin) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration, start, reduced]);

  return (
    <span className="tabular-nums">
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export interface BentoTileProps {
  title: ReactNode;
  body?: ReactNode;
  /** 在 md 以上橫跨兩欄 */
  wide?: boolean;
  /** 進場延遲毫秒，同一列錯開 80ms */
  delay?: number;
  className?: string;
  children: ReactNode;
}

export function BentoTile({ title, body, wide, delay = 0, className, children }: BentoTileProps) {
  return (
    <Reveal delay={delay} className={cn("h-full min-w-0", wide && "md:col-span-2", className)}>
      <article className="lb-lift flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground">
        <div className="p-6 pb-0">
          <h3 className="font-semibold">{title}</h3>
          {body ? <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{body}</p> : null}
        </div>
        {/* 小動畫只是示意，內容由標題與說明承擔 */}
        <div aria-hidden className="flex min-w-0 flex-1 items-center justify-center p-6">
          {children}
        </div>
      </article>
    </Reveal>
  );
}

export function LiveBento({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("lb-root grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      <style>{CSS}</style>
      {children}
    </div>
  );
}
