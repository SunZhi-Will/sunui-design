"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CompareSliderLabels {
  /** 左右兩邊的預設標籤；beforeLabel / afterLabel 優先 */
  before?: string;
  after?: string;
  /** range 的無障礙名稱 */
  slider?: (before: string, after: string) => string;
  valueText?: (before: string, after: string, pos: number) => string;
}

export interface CompareSliderProps {
  /** 左半：圖片網址或任意節點 */
  before: ReactNode | string;
  /** 右半：圖片網址或任意節點 */
  after: ReactNode | string;
  /** 外框比例照成品的寬高 */
  width?: number;
  height?: number;
  beforeLabel?: string;
  afterLabel?: string;
  /** before 的填法；比例不同時預設 contain 置中，不裁切也不變形 */
  beforeFit?: "contain" | "cover";
  afterFit?: "contain" | "cover";
  /** 分隔線起始位置（0 到 100） */
  initial?: number;
  /** 第一次進入畫面時掃一次示範（中間、左、右、回中間，約 2.4 秒），一碰就停 */
  demoSweep?: boolean;
  /** 由父層控制何時開始示範；給了就不看進入畫面 */
  play?: boolean;
  onChange?: (pos: number) => void;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: CompareSliderLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<CompareSliderLabels>> = {
  en: {
    before: "Before",
    after: "After",
    slider: (b, a) => `Divider position between ${b} and ${a}`,
    valueText: (b, a, pos) => `${b} ${pos}%, ${a} ${100 - pos}%`,
  },
  "zh-TW": {
    before: "之前",
    after: "之後",
    slider: (b, a) => `${b}與${a}之間的分隔線位置`,
    valueText: (b, a, pos) => `${b} ${pos}%，${a} ${100 - pos}%`,
  },
  "zh-CN": {
    before: "之前",
    after: "之后",
    slider: (b, a) => `${b}与${a}之间的分隔线位置`,
    valueText: (b, a, pos) => `${b} ${pos}%，${a} ${100 - pos}%`,
  },
  ja: {
    before: "ビフォー",
    after: "アフター",
    slider: (b, a) => `${b}と${a}の境界線の位置`,
    valueText: (b, a, pos) => `${b} ${pos}%、${a} ${100 - pos}%`,
  },
};

const clamp = (v: number) => Math.max(0, Math.min(100, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const SWEEP_MS = 2400;

/** 開場示範的關鍵影格：[進度, 位置]，起點與終點用 initial */
function sweepAt(t: number, home: number) {
  const keys: [number, number][] = [
    [0, home],
    [0.3, 8],
    [0.75, 92],
    [1, home],
  ];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
    }
  }
  return home;
}

function Layer({ content, alt, fit }: { content: ReactNode | string; alt: string; fit: "contain" | "cover" }) {
  if (typeof content === "string") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={content} alt={alt} draggable={false} className={cn("size-full", fit === "contain" ? "object-contain" : "object-cover")} />;
  }
  return <div className="size-full">{content}</div>;
}

function ChevronsLeftRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
      <path d="m9 7-5 5 5 5" />
      <path d="m15 7 5 5-5 5" />
    </svg>
  );
}

/**
 * 前後對照：左半是 before，右半是 after，拖曳分隔線、點擊或用方向鍵調整比例。
 * 底下是一個透明的 range input，點哪裡分隔線就到哪裡，鍵盤與螢幕報讀器也能操作。
 * 外框比例照成品，before 比例不同時以 contain 置中，留白用 muted 底色。
 */
export function CompareSlider({
  before,
  after,
  width = 4,
  height = 3,
  beforeLabel: beforeLabelProp,
  afterLabel: afterLabelProp,
  beforeFit = "contain",
  afterFit = "cover",
  initial = 50,
  demoSweep = false,
  play,
  onChange,
  locale = "en",
  labels,
  className,
}: CompareSliderProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const beforeLabel = beforeLabelProp ?? t.before;
  const afterLabel = afterLabelProp ?? t.after;
  const home = clamp(initial);
  const [pos, setPos] = useState(home);
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const running = play ?? (demoSweep && inView);

  // 第一次進入畫面（底部扣掉 20%）才開始示範
  useEffect(() => {
    if (play !== undefined || !demoSweep) return;
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [play, demoSweep]);

  // 示範掃動：使用者一碰就停，減少動態時不掃
  useEffect(() => {
    if (!running || touched.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      if (touched.current) return;
      const p = Math.min(1, (now - t0) / SWEEP_MS);
      setPos(sweepAt(p, home));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, home]);

  const stop = () => {
    touched.current = true;
  };
  const shown = Math.round(pos);

  return (
    <div
      ref={root}
      className={cn("relative w-full overflow-hidden rounded-lg bg-muted select-none", className)}
      style={{ aspectRatio: `${width} / ${height}`, maxWidth: `calc(70dvh * ${width} / ${height})` }}
      onPointerDownCapture={stop}
      onKeyDownCapture={stop}
    >
      <div className="absolute inset-0">
        <Layer content={after} alt={afterLabel} fit={afterFit} />
      </div>
      <div className="absolute inset-0 bg-muted" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Layer content={before} alt={beforeLabel} fit={beforeFit} />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 z-[1] w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.25)]"
        style={{ left: `${pos}%` }}
      >
        <span className="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-md">
          <ChevronsLeftRight />
        </span>
      </div>
      <span className="pointer-events-none absolute top-3 left-3 z-[1] rounded-md bg-black/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute top-3 right-3 z-[1] rounded-md bg-black/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
        {afterLabel}
      </span>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={shown}
        onChange={(e) => {
          touched.current = true;
          const v = clamp(Number(e.target.value));
          setPos(v);
          onChange?.(v);
        }}
        aria-label={t.slider(beforeLabel, afterLabel)}
        aria-valuetext={t.valueText(beforeLabel, afterLabel, shown)}
        className="peer absolute inset-0 z-[2] m-0 size-full cursor-ew-resize touch-pan-y appearance-none opacity-0"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[3] rounded-lg peer-focus-visible:ring-3 peer-focus-visible:ring-ring/60 peer-focus-visible:ring-inset"
      />
    </div>
  );
}
