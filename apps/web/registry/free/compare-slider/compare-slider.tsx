"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CompareSliderLabels {
  /** Default labels for the left and right sides. beforeLabel / afterLabel take priority */
  before?: string;
  after?: string;
  /** Accessible name of the range */
  slider?: (before: string, after: string) => string;
  valueText?: (before: string, after: string, pos: number) => string;
}

export interface CompareSliderProps {
  /** Left half: an image URL or any node */
  before: ReactNode | string;
  /** Right half: an image URL or any node */
  after: ReactNode | string;
  /** Frame ratio matches the finished image's width and height */
  width?: number;
  height?: number;
  beforeLabel?: string;
  afterLabel?: string;
  /** How before is fitted. When the ratios differ, the default is contain, centered, with no cropping or distortion */
  beforeFit?: "contain" | "cover";
  afterFit?: "contain" | "cover";
  /** Starting position of the divider (0 to 100) */
  initial?: number;
  /** On first entering the viewport, sweeps once as a demo (center, left, right, back to center, about 2.4 seconds) and stops on first touch */
  demoSweep?: boolean;
  /** Lets the parent control when the demo starts. When given, entering the viewport is ignored */
  play?: boolean;
  onChange?: (pos: number) => void;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Overrides the built-in strings, takes priority over locale */
  labels?: CompareSliderLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Maps any language tag to one of the four built-in languages, falling back to English for everything else */
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

/** Keyframes of the intro demo: [progress, position], with initial as the start and end point */
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

// Material (DESIGN.md section 7): the divider handle is a turned steel knob with a knurled rim, lit from straight above.
// It sits on photos, so it is a fixed light steel in both themes, like the white divider line it hangs on. Neutral greys only
// Domed face: bright where the top light lands, falling off toward the lower edge
const knob = { backgroundImage: "radial-gradient(circle at 50% 28%, rgb(255 255 255) 0%, rgb(236 236 238) 38%, rgb(196 196 200) 72%, rgb(170 170 175) 100%)" };
const knurl = {
  backgroundImage: "repeating-conic-gradient(rgb(0 0 0 / 0.16) 0deg 5deg, rgb(255 255 255 / 0.25) 5deg 10deg), linear-gradient(180deg, rgb(250 250 251), rgb(150 150 155))",
};

function ChevronsLeftRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
      <path d="m9 7-5 5 5 5" />
      <path d="m15 7 5 5-5 5" />
    </svg>
  );
}

/**
  * Before and after comparison: the left half is before, the right half is after. Drag the divider, click, or use the arrow keys to change the split.
  * Underneath is a transparent range input, so the divider goes wherever you click, and keyboard and screen reader users can operate it too.
  * The frame ratio follows the finished image. When before has a different ratio it is centered with contain, and the empty space uses the muted background.
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

  // Start the demo on first entering the viewport (bottom inset by 20%)
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

  // Demo sweep: stops as soon as the user touches it, and does not sweep under reduced motion
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
        <span
          className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-[0_0_0_1px_rgb(0_0_0/0.2),0_2px_3px_rgb(0_0_0/0.22),0_8px_16px_-6px_rgb(0_0_0/0.4)]"
          style={knurl}
        >
          <span
            className="flex size-[38px] items-center justify-center rounded-full text-[rgb(40_40_44)] shadow-[inset_0_1px_0_rgb(255_255_255),inset_0_-1px_0_rgb(0_0_0/0.18),0_0_0_1px_rgb(0_0_0/0.18),0_1px_1px_rgb(0_0_0/0.2)]"
            style={knob}
          >
            <ChevronsLeftRight />
          </span>
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
