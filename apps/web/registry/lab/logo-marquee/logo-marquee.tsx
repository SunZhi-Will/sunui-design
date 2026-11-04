"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type MarqueeItem = {
  /** 唯一識別，用作 key */
  id: string;
  /** Logo 或文字 */
  content: ReactNode;
  /** 純圖示時給螢幕閱讀器的名稱 */
  label?: string;
};

export interface LogoMarqueeProps {
  items: MarqueeItem[];
  /** 每秒移動的像素 */
  speed?: number;
  direction?: "left" | "right";
  /** 項目間距（px） */
  gap?: number;
  /** 滑鼠懸停或鍵盤聚焦時暫停 */
  pauseOnHover?: boolean;
  /** 左右邊緣漸隱 */
  fade?: boolean;
  /** 顯示暫停按鈕（WCAG 2.2.2：持續移動的內容應可暫停） */
  showPauseControl?: boolean;
  labels?: {
    /** 整個區塊的名稱 */
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

// SSR 時改用 useEffect，避免警告
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function LogoMarquee({
  items,
  speed = 40,
  direction = "left",
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
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [listWidth, setListWidth] = useState(0);
  const [repeat, setRepeat] = useState(1);
  const [paused, setPaused] = useState(false);

  // 量測單份清單寬度，不足容器寬時重複，確保無縫
  useIsoLayoutEffect(() => {
    if (reduceMotion) return;
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
  }, [reduceMotion, repeat, items]);

  const itemStyle: CSSProperties = { paddingRight: gap };
  const itemClass = cn(
    "flex shrink-0 items-center text-muted-foreground transition-colors hover:text-foreground [&_svg]:h-7 [&_svg]:w-auto",
    itemClassName,
  );

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

  const duration = listWidth > 0 ? (listWidth * repeat) / Math.max(speed, 1) : 0;
  const group = Array.from({ length: repeat }, (_, r) =>
    items.map((item) => ({ ...item, key: `${r}-${item.id}`, ghost: r > 0 })),
  ).flat();

  const mask = fade
    ? "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
    : undefined;

  return (
    <section
      aria-label={text.region}
      className={cn("group/marquee relative flex w-full items-center gap-3", className)}
    >
      <div
        ref={containerRef}
        className="relative min-w-0 flex-1 overflow-hidden"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        <div
          className={cn(
            "flex w-max",
            pauseOnHover && "group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused]",
          )}
          style={{
            // 不用 animation 簡寫，否則行內的 play-state 會蓋掉 hover 暫停
            animationName: duration ? "sunui-marquee" : undefined,
            animationDuration: `${duration}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationDirection: direction === "right" ? "reverse" : "normal",
            animationPlayState: paused ? "paused" : undefined,
          }}
        >
          <ul ref={listRef} className="flex shrink-0 items-center">
            {group.map((item) => (
              <li
                key={item.key}
                className={itemClass}
                style={itemStyle}
                aria-label={item.label}
                aria-hidden={item.ghost || undefined}
              >
                {item.content}
              </li>
            ))}
          </ul>
          {/* 第二份是視覺複本，對輔助科技隱藏且不可聚焦 */}
          <ul className="flex shrink-0 items-center" aria-hidden="true" inert>
            {group.map((item) => (
              <li key={item.key} className={itemClass} style={itemStyle}>
                {item.content}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showPauseControl && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? text.play : text.pause}
          aria-pressed={paused}
          className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M5 3.5v9l7-4.5z" /> : <path d="M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z" />}
          </svg>
        </button>
      )}

      <style>{`@keyframes sunui-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </section>
  );
}
