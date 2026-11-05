"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ShowcaseItem {
  /** 網址列顯示的網域 */
  url: string;
  /** 截圖；與 content 二選一 */
  image?: { src: string; alt: string };
  /** 自訂畫面內容（例如 SVG 或縮小的 UI） */
  content?: ReactNode;
}

export interface BrowserShowcase3DProps {
  items: ShowcaseItem[];
  /** 輪播間隔（毫秒） */
  interval?: number;
  /** 主色，預設金色 */
  accent?: string;
  /** hover 光暈的亮色 */
  accentBright?: string;
  /** 有值時改成 role="img" 並以此為名稱；預設為純裝飾（aria-hidden） */
  label?: string;
  className?: string;
}

const REST_ROTATE_Y = -16;
const REST_ROTATE_X = 6;
const MAX_SWING = 9;
/** 必須與光暈層的 background-size 一致 */
const GLOW_SIZE = 260;

const E_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const E_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

function useReducedMotionPref() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduce;
}

/**
 * 傾斜的瀏覽器視窗，後面疊兩張裝飾卡片，像幻燈片一樣輪播項目。
 * 滑鼠移到上面時跟著游標傾斜、邊框出現光暈，並暫停輪播。
 */
export function BrowserShowcase3D({
  items,
  interval = 4800,
  accent = "#d4af37",
  accentBright = "#e8c874",
  label,
  className,
}: BrowserShowcase3DProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotionPref();
  const stackRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (items.length <= 1 || paused || reduce) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % items.length), interval);
    return () => window.clearInterval(id);
  }, [items.length, paused, reduce, interval]);

  // 項目數變少時不要指到不存在的索引
  useEffect(() => {
    if (active >= items.length) setActive(0);
  }, [active, items.length]);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const el = stackRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateY = REST_ROTATE_Y + px * MAX_SWING * 2;
      const rotateX = REST_ROTATE_X - py * MAX_SWING;
      el.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    }

    // 光暈用像素定位：background-position 的百分比是比例公式，會跟游標對不上
    const win = windowRef.current;
    if (win) {
      const winRect = win.getBoundingClientRect();
      win.style.setProperty("--glow-x", `${event.clientX - winRect.left - GLOW_SIZE / 2}px`);
      win.style.setProperty("--glow-y", `${event.clientY - winRect.top - GLOW_SIZE / 2}px`);
    }
  }

  function handlePointerLeave() {
    // 清掉 inline transform，回到各斷點的靜止角度
    if (stackRef.current) stackRef.current.style.transform = "";
    const win = windowRef.current;
    if (win) {
      win.style.removeProperty("--glow-x");
      win.style.removeProperty("--glow-y");
    }
    setPaused(false);
  }

  if (items.length === 0) return null;
  const current = items[Math.min(active, items.length - 1)]!;

  const vars = {
    "--sc-gold": accent,
    "--sc-gold-bright": accentBright,
    "--sc-line-1": `color-mix(in srgb, ${accent} 14%, transparent)`,
    "--sc-line-2": `color-mix(in srgb, ${accent} 30%, transparent)`,
    perspective: "1600px",
  } as CSSProperties;

  const fast = reduce ? "none" : `transform 160ms ${E_OUT}`;

  return (
    <div
      className={cn("group w-full max-w-[680px] mx-auto", className)}
      style={vars}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      onPointerEnter={() => setPaused(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div
        ref={stackRef}
        className="relative [transform:rotateY(-8deg)_rotateX(3deg)] md:[transform:rotateY(-16deg)_rotateX(6deg)]"
        style={{ transformStyle: "preserve-3d", transition: fast }}
      >
        {/* 後面的裝飾層：只露出邊角，營造很多層的深度 */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[10px] border border-[var(--sc-line-1)] opacity-40"
          style={{ background: "linear-gradient(180deg, #141418, #0e0e11)", transform: "translate3d(40px, 34px, -84px) scale(0.94)" }}
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-[10px] border border-[var(--sc-line-1)] opacity-70"
          style={{ background: "linear-gradient(180deg, #141418, #0e0e11)", transform: "translate3d(20px, 17px, -42px) scale(0.97)" }}
        />

        <div
          ref={windowRef}
          className="relative cursor-pointer overflow-hidden rounded-[10px] border border-[var(--sc-line-2)] bg-[#0e0e11]"
          style={{
            boxShadow:
              "0 2px 4px rgba(0, 0, 0, 0.4), 0 24px 64px rgba(0, 0, 0, 0.5), 0 0 60px -20px color-mix(in srgb, var(--sc-gold) 25%, transparent)",
          }}
        >
          {/* 炫光邊框：mask 只露出 2px 的邊框那一圈，z-index 要壓過畫面層 */}
          <div
            className="pointer-events-none absolute inset-0 z-[2] opacity-0 group-hover:opacity-100"
            style={{
              borderRadius: "inherit",
              padding: 2,
              transition: reduce ? "none" : `opacity 160ms ${E_OUT}`,
              backgroundImage: "radial-gradient(circle, var(--sc-gold-bright) 0%, var(--sc-gold) 45%, transparent 68%)",
              backgroundSize: `${GLOW_SIZE}px ${GLOW_SIZE}px`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "var(--glow-x, 50%) var(--glow-y, 50%)",
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />

          {/* 瀏覽器外框：矮、置中網址列 */}
          <div className="flex items-center gap-2 border-b border-[var(--sc-line-1)] bg-[#141418] px-3 py-[7px]">
            <div className="flex flex-none gap-[5px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-1.5 flex-none rounded-full bg-[var(--sc-line-2)]" />
              ))}
            </div>
            <div className="flex min-w-0 flex-1 justify-center">
              <span className="max-w-[70%] truncate whitespace-nowrap rounded-full border border-[var(--sc-line-1)] bg-[#0e0e11] px-3 py-[2px] font-mono text-[10px] text-[#8a8578]">
                {current.url}
              </span>
            </div>
          </div>

          {/* 輪播畫面：多張疊在同一位置，靠 opacity 交叉淡出 */}
          <div className="relative aspect-[16/10]">
            {items.map((item, index) => {
              const style: CSSProperties = {
                opacity: index === active ? 1 : 0,
                transition: reduce ? "none" : `opacity 560ms ${E_IN_OUT}`,
              };
              return item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={index}
                  src={item.image.src}
                  alt={item.image.alt}
                  loading={index === 0 ? "eager" : "lazy"}
                  className="absolute inset-0 block h-full w-full object-cover"
                  style={style}
                />
              ) : (
                <div key={index} className="absolute inset-0 h-full w-full overflow-hidden" style={style}>
                  {item.content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
