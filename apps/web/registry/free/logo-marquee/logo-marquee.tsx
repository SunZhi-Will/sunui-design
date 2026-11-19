"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * 為什麼這裡可以有常駐循環（DESIGN.md §5.2）：
 * 規則禁止裝飾性的常駐循環。Logo 帶是內容（真實的合作夥伴與客戶標誌），
 * 循環是為了在一行裡放下比寬度更多的標誌，不是裝飾。所以保留，但收緊條件：
 * 只在進入畫面且分頁可見時跑；滑過或鍵盤聚焦就停；有暫停鈕（WCAG 2.2.2）；
 * reduced motion 直接改成靜態的換行清單，資訊不遺失。
 * 和 testimonial-marquee（評價卡片牆）、scroll-marquee（大字隨捲動位移）不同：
 * 這裡是小尺寸的標誌、字標與短字，依時間等速移動。
 */

export type MarqueeItem = {
  /** 唯一識別，用作 key */
  id: string;
  /** Logo、字標或短字 */
  content: ReactNode;
  /** 純圖示時給螢幕閱讀器的名稱 */
  label?: string;
};

export interface LogoMarqueeProps {
  items: MarqueeItem[];
  /** 每秒移動的像素 */
  speed?: number;
  direction?: "left" | "right";
  /** 2 = 第二排反向、順序倒過來，速度略慢；第二排是視覺複本，對輔助科技隱藏 */
  rows?: 1 | 2;
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

// 單色：預設次要文字色，滑過時亮到前景色；hover 進快退慢
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

  // 只在畫面內、分頁可見時播放
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

  // 量測單份清單寬度，不足容器寬時重複，確保無縫
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

  // 複本裡若有連結或按鈕，移出 Tab 順序，鍵盤只會走到第一份
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
  // 允許的漸層只有這個：兩端淡出遮罩
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
          // 不用 animation 簡寫，否則行內的 play-state 會蓋掉 hover 暫停
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
        {/* 第二份是視覺複本，對輔助科技隱藏；不用 inert，否則滑過複本時標誌不會亮起 */}
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
