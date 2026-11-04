"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type AnimationPlaybackControls } from "framer-motion";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CompareSliderLabels {
  /** range 的無障礙名稱 */
  slider?: string;
  valueText?: (before: number, after: number) => string;
}

export interface CompareSliderProps {
  /** 圖片網址或任意節點 */
  before: ReactNode | string;
  after: ReactNode | string;
  /** 分隔線起始位置（0 到 100，左側為 before 的比例） */
  initial?: number;
  /** 第一次進入畫面時示範掃一次；使用者一碰就停，reduced motion 時略過 */
  demoSweep?: boolean;
  beforeLabel?: ReactNode;
  afterLabel?: ReactNode;
  /** CSS aspect-ratio，例如 "4 / 3" */
  aspect?: string;
  fit?: "cover" | "contain";
  /** 圖片的替代文字（before / after 為網址時使用） */
  beforeAlt?: string;
  afterAlt?: string;
  onChange?: (value: number) => void;
  labels?: CompareSliderLabels;
  className?: string;
}

const defaultLabels: Required<CompareSliderLabels> = {
  slider: "Comparison position",
  valueText: (b, a) => `${b}% before, ${a}% after`,
};

// 設計語言（DESIGN.md）：紙、紙邊、墨
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";

const clamp = (n: number) => Math.min(100, Math.max(0, n));

function Layer({ content, alt, fit }: { content: ReactNode | string; alt?: string; fit: "cover" | "contain" }) {
  if (typeof content === "string") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={content} alt={alt ?? ""} draggable={false} className={cn("size-full select-none", fit === "cover" ? "object-cover" : "object-contain")} />;
  }
  return <div className="size-full">{content}</div>;
}

export function CompareSlider({
  before,
  after,
  initial = 50,
  demoSweep = false,
  beforeLabel = "Before",
  afterLabel = "After",
  aspect = "4 / 3",
  fit = "cover",
  beforeAlt,
  afterAlt,
  onChange,
  labels,
  className,
}: CompareSliderProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const sweep = useRef<AnimationPlaybackControls | null>(null);
  const start = clamp(initial);

  const pos = useMotionValue(start);
  const [value, setValue] = useState(start);
  useMotionValueEvent(pos, "change", (v) => setValue(Math.round(v)));

  // after 疊在上層，只露出分隔線右側
  const clipPath = useTransform(pos, (v) => `inset(0 0 0 ${v}%)`);
  const handleX = useTransform(pos, (v) => `${v}%`);

  const stopSweep = () => {
    sweep.current?.stop();
    sweep.current = null;
  };

  // 示範掃動：只在第一次進入畫面時播一次
  useEffect(() => {
    if (!demoSweep || reduce || !root.current) return;
    const el = root.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        sweep.current = animate(pos, [start, 30, 70, start], { duration: 2.4, ease: "easeInOut", times: [0, 0.3, 0.7, 1] });
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stopSweep();
    };
  }, [demoSweep, reduce, pos, start]);

  const tag = cn("pointer-events-none absolute top-2 z-10 rounded-[3px] border px-1.5 py-0.5 text-[10px] font-medium tracking-[0.14em] uppercase", paper, edge, inkMuted);

  return (
    <div
      ref={root}
      className={cn("relative w-full overflow-hidden rounded-md border select-none", paper, edge, ink, className)}
      style={{ aspectRatio: aspect } as CSSProperties}
      onPointerDownCapture={stopSweep}
      onKeyDownCapture={stopSweep}
    >
      <div className="absolute inset-0">
        <Layer content={before} alt={beforeAlt} fit={fit} />
      </div>
      <motion.div className="absolute inset-0" style={{ clipPath, WebkitClipPath: clipPath }}>
        <Layer content={after} alt={afterAlt} fit={fit} />
      </motion.div>

      <span className={cn(tag, "left-2")}>{beforeLabel}</span>
      <span className={cn(tag, "right-2")}>{afterLabel}</span>

      {/* 透明 range 蓋在最上層：點擊跳位、方向鍵、Home/End 與螢幕閱讀器都由原生元件處理 */}
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label={t.slider}
        aria-valuetext={t.valueText(value, 100 - value)}
        onChange={(e) => {
          const v = clamp(Number(e.target.value));
          stopSweep();
          pos.set(v);
          onChange?.(v);
        }}
        className="peer absolute inset-0 z-20 m-0 size-full cursor-ew-resize appearance-none opacity-0"
      />

      {/* 分隔線與把手只是視覺，位置用 transform 移動 */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 peer-focus-visible:[&_[data-grip]]:ring-2 peer-focus-visible:[&_[data-grip]]:ring-ring"
        style={{ x: handleX }}
      >
        <div className="absolute inset-y-0 left-0 w-px -translate-x-1/2 bg-[#1c1917] dark:bg-[#ece7dc]" />
        <div
          data-grip
          className={cn("absolute top-1/2 left-0 flex h-9 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[4px] border", paper, edge)}
        >
          <svg viewBox="0 0 20 12" className="w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 2 6l4 4M14 2l4 4-4 4" />
          </svg>
        </div>
      </motion.div>
    </div>
  );
}
