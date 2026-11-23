"use client";

// A product demo window driven by time t: every frame is a pure function of "which second of this step".
// That makes it possible to jump between steps, drag the timeline, freeze a given second for a screenshot, and under reduced motion show the finished frame of each step directly.
// The stage has a fixed design size (1200 × 750 by default) and scales by a single ratio, so phones see the same picture instead of a reflowed layout.

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type RefObject,
} from "react";

import { cn } from "@/lib/utils";

/* ---------- Time helpers: all pure functions that take only t ---------- */

type Curve = readonly [number, number, number, number];

export const curves = {
  /** The expo-out used across the product line */
  out: [0.23, 1, 0.32, 1],
  /** Cursor glide */
  glide: [0.55, 0, 0.25, 1],
  /** Step fade-in */
  fade: [0.2, 0.7, 0.1, 1],
  linear: [0, 0, 1, 1],
} as const satisfies Record<string, Curve>;

function bezier([x1, y1, x2, y2]: Curve, x: number) {
  if (x <= 0 || x >= 1) return x <= 0 ? 0 : 1;
  const at = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  let lo = 0;
  let hi = 1;
  let s = x;
  for (let i = 0; i < 24; i++) {
    const v = at(x1, x2, s);
    if (Math.abs(v - x) < 1e-5) break;
    if (v < x) lo = s;
    else hi = s;
    s = (lo + hi) / 2;
  }
  return at(y1, y2, s);
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** 0 to 1 progress starting at second from and lasting dur seconds */
export function ease(t: number, from: number, dur: number, curve: keyof typeof curves | Curve = "out") {
  const c = typeof curve === "string" ? curves[curve] : curve;
  return bezier(c, clamp01((t - from) / Math.max(dur, 1e-6)));
}

/** Whether t has reached second at */
export const cue = (t: number, at: number) => t >= at;
/** Whether t falls in [from, to) */
export const held = (t: number, from: number, to: number) => t >= from && t < to;
/** Cursor blink, returns whether it is visible */
export const blink = (t: number, hz = 1) => Math.floor(t * hz * 2) % 2 === 0;

const graphemeCache = new Map<string, string[]>();
let segmenter: Intl.Segmenter | null | undefined;
function graphemes(text: string) {
  let g = graphemeCache.get(text);
  if (!g) {
    if (segmenter === undefined) {
      segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
    }
    g = segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text);
    graphemeCache.set(text, g);
  }
  return g;
}

/** Types text starting at second from at cps characters per second; CJK and emoji count by glyph */
export function typed(text: string, t: number, from: number, cps = 50) {
  const g = graphemes(text);
  return g.slice(0, Math.max(0, Math.min(g.length, Math.floor((t - from) * cps)))).join("");
}

/** Seconds needed to finish typing text, used to schedule the next time point */
export const typingTime = (text: string, cps = 50) => graphemes(text).length / cps;

/* ---------- Types ---------- */

/** Cursor target: the name of a data-aim element inside the stage, or stage coordinates [x, y] */
export type Aim = string | readonly [number, number];

export interface CursorKey {
  /** Seconds until the target is reached */
  at: number;
  to: Aim;
  /** Second of the press, suggested 0.3 to 0.6 seconds after at */
  click?: number;
  /** Glide duration in seconds, default 0.7 */
  glide?: number;
  /** Fade out after arriving so viewers can see the result */
  hide?: boolean;
}

export interface StepViewProps {
  /** Which second of this step */
  t: number;
  dur: number;
  reduced: boolean;
}

export interface StepDemoStep {
  id: string;
  /** Step name of 1 to 3 characters */
  name: string;
  /** Duration in seconds, suggested 4 to 8, leaving at least 1 second at the end to see the result */
  dur: number;
  View: ComponentType<StepViewProps>;
  cursor?: CursorKey[];
}

export interface StepDemoLabels {
  demo: string;
  play: string;
  pause: string;
  replay: string;
  timeline: string;
  steps: string;
}

export interface StepDemoProps {
  steps: StepDemoStep[];
  /** Stage design size, default [1200, 750] */
  size?: readonly [number, number];
  chrome?: "browser" | "window" | "none";
  url?: string;
  title?: string;
  autoPlay?: boolean;
  loop?: boolean;
  /** steps: step bar; scrubber: adds a timeline; none: picture only */
  controls?: "steps" | "scrubber" | "none";
  /** Controlled total seconds; when given, freezes on that frame (screenshots, docs, tests) */
  time?: number;
  onTimeChange?: (time: number) => void;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK are also accepted */
  locale?: string;
  labels?: Partial<StepDemoLabels>;
  className?: string;
  stageClassName?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, StepDemoLabels> = {
  en: { demo: "Product demo", play: "Play", pause: "Pause", replay: "Replay", timeline: "Timeline", steps: "Steps" },
  "zh-TW": { demo: "產品示範", play: "播放", pause: "暫停", replay: "重播", timeline: "時間軸", steps: "步驟" },
  "zh-CN": { demo: "产品演示", play: "播放", pause: "暂停", replay: "重播", timeline: "时间轴", steps: "步骤" },
  ja: { demo: "製品デモ", play: "再生", pause: "一時停止", replay: "もう一度", timeline: "タイムライン", steps: "ステップ" },
};

const StepContext = createContext<(StepViewProps & { index: number; step: StepDemoStep }) | null>(null);

/** Gets the current t deep inside a step's picture, without passing props all the way down */
export function useStepDemo() {
  const ctx = useContext(StepContext);
  if (!ctx) throw new Error("useStepDemo must be used inside <StepDemo>");
  return ctx;
}

function useReduced() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/* ---------- Material: brushed-metal chrome and brand-colour lacquer, light from straight above ---------- */

const spot = "var(--sunui-spot, var(--primary))";
const lacquerImage = `linear-gradient(180deg, color-mix(in oklch, ${spot} 62%, white), ${spot} 55%, color-mix(in oklch, ${spot} 78%, black))`;
/** Chrome bar: --stp-a (top) and --stp-b (bottom) mix the foreground into the card, flipped in dark mode so the top stays lit */
const metalVars =
  "[--stp-a:color-mix(in_oklch,var(--foreground)_2%,var(--card))] [--stp-b:color-mix(in_oklch,var(--foreground)_12%,var(--card))] [--stp-hi:rgb(255_255_255/0.85)] dark:[--stp-a:color-mix(in_oklch,var(--foreground)_14%,var(--card))] dark:[--stp-b:color-mix(in_oklch,var(--foreground)_5%,var(--card))] dark:[--stp-hi:rgb(255_255_255/0.1)]";
const metalBar = {
  backgroundImage:
    "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.05) 0 1px, rgb(0 0 0 / 0.015) 1px 2px, transparent 2px 4px), linear-gradient(180deg, var(--stp-a), var(--stp-b))",
  boxShadow: "inset 0 1px 0 var(--stp-hi), inset 0 -1px 0 rgb(0 0 0 / 0.06)",
} as const;
const lens =
  "size-2.5 rounded-full bg-[image:linear-gradient(180deg,rgb(255_255_255/0.35),transparent_55%,rgb(0_0_0/0.12))] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.18)]";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ---------- Cursor: position computed from t, target measured from the DOM then divided by the scale ---------- */

const PRESS = 0.18;

/** Centre of the target in stage coordinates. Measured with offset, so it is unaffected by scaling and the entrance transform, and needs no division by the scale. */
function aimCenter(root: HTMLElement, name: string): [number, number] | null {
  const target = root.querySelector<HTMLElement>(`[data-stp-layer="current"] [data-aim="${name}"]`);
  if (!target) return null;
  let x = target.offsetWidth / 2;
  let y = target.offsetHeight / 2;
  for (let el: HTMLElement | null = target; el && el !== root; el = el.offsetParent as HTMLElement | null) {
    x += el.offsetLeft;
    y += el.offsetTop;
  }
  return [x, y];
}

function Cursor({ keys, t, stage, size, layout }: { keys: CursorKey[]; t: number; stage: RefObject<HTMLDivElement | null>; size: readonly [number, number]; layout: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const gid = useId().replace(/:/g, "");
  // Measure once per step and per layout change (scaling, font loading); targets that have not appeared yet are not cached, and are measured again on the next frame.
  const cache = useRef({ layout: "", points: new Map<string, [number, number]>() });

  useLayoutEffect(() => {
    const el = ref.current;
    const root = stage.current;
    if (!el || !root || keys.length === 0) return;
    if (cache.current.layout !== layout) cache.current = { layout, points: new Map() };
    const { points } = cache.current;
    const point = (aim: Aim): [number, number] => {
      if (typeof aim !== "string") return [aim[0], aim[1]];
      let p = points.get(aim);
      if (!p) {
        const measured = aimCenter(root, aim);
        if (!measured) return [size[0] / 2, size[1] / 2];
        points.set(aim, (p = measured));
      }
      return p;
    };
    const pts = keys.map((key) => point(key.to));

    let [x, y] = pts[0];
    let cur = 0;
    for (let i = 1; i < keys.length; i++) {
      const start = keys[i].at - (keys[i].glide ?? 0.7);
      if (t < start) break;
      cur = i;
      const p = ease(t, start, keys[i].at - start, "glide");
      x = lerp(pts[i - 1][0], pts[i][0], p);
      y = lerp(pts[i - 1][1], pts[i][1], p);
    }
    // Fade in at the start; a hide target fades out after arrival; the next segment leaving the hidden state fades in again.
    const key = keys[cur];
    let opacity = clamp01(t / 0.3);
    if (key.hide && t >= key.at) opacity *= 1 - clamp01((t - key.at) / 0.3);
    if (cur > 0 && keys[cur - 1].hide) opacity *= clamp01((t - (key.at - (key.glide ?? 0.7))) / 0.2);

    const press = keys.find((key) => key.click !== undefined && t >= key.click && t < key.click + 0.65);
    let scale = 1;
    let ringP = -1;
    if (press?.click !== undefined) {
      const d = t - press.click;
      scale = d < PRESS ? lerp(1.15, 0.98, d / PRESS) : lerp(0.98, 1, clamp01((d - PRESS) / 0.15));
      ringP = clamp01(d / 0.5);
    }
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.style.opacity = String(opacity);
    el.firstElementChild?.setAttribute("style", `transform: scale(${scale}); transform-origin: 4px 4px`);
    if (ring.current) {
      ring.current.style.opacity = ringP < 0 || ringP >= 1 ? "0" : String(0.35 * (1 - ringP));
      ring.current.style.transform = `translate(-50%, -50%) scale(${0.3 + ringP * 1.3})`;
    }
  });

  if (keys.length === 0) return null;
  return (
    <div ref={ref} aria-hidden className="absolute top-0 left-0 z-30" style={{ opacity: 0 }}>
      {/* Cursor in brand-colour lacquer with a light outline */}
      <svg viewBox="0 0 24 24" strokeWidth={1.5} strokeLinejoin="round" className="relative size-8 stroke-card drop-shadow-md">
        <defs>
          <linearGradient id={`${gid}-lacquer`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: `color-mix(in oklch, ${spot} 62%, white)` }} />
            <stop offset="0.55" style={{ stopColor: spot }} />
            <stop offset="1" style={{ stopColor: `color-mix(in oklch, ${spot} 78%, black)` }} />
          </linearGradient>
        </defs>
        <path fill={`url(#${gid}-lacquer)`} d="M4.04 4.69a.5.5 0 0 1 .65-.65l16 6.5a.5.5 0 0 1-.06.95l-6.13 1.58a2 2 0 0 0-1.43 1.43l-1.58 6.13a.5.5 0 0 1-.95.06z" />
      </svg>
      <span ref={ring} className="absolute top-1 left-1 size-14 rounded-full bg-[color:var(--sunui-spot,var(--primary))]" style={{ opacity: 0 }} />
    </div>
  );
}

/* ---------- Main component ---------- */

const DEFAULT_SIZE = [1200, 750] as const;

export function StepDemo({
  steps,
  size = DEFAULT_SIZE,
  chrome = "browser",
  url,
  title,
  autoPlay = true,
  loop = true,
  controls = "steps",
  time: timeProp,
  onTimeChange,
  locale = "en",
  labels,
  className,
  stageClassName,
}: StepDemoProps) {
  const msg = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduced = useReduced();
  const rootRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  const [inner, setInner] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [inView, setInView] = useState(false);
  const [fonts, bump] = useState(0);
  const [w, h] = size;

  const starts = steps.map((_, i) => steps.slice(0, i).reduce((s, x) => s + x.dur, 0));
  const total = steps.reduce((s, x) => s + x.dur, 0);
  const controlled = timeProp !== undefined;
  const time = Math.min(Math.max(controlled ? timeProp : inner, 0), total);
  const setTime = (v: number) => {
    if (!controlled) setInner(v);
    onTimeChange?.(v);
  };

  let index = steps.length - 1;
  for (let i = 0; i < steps.length; i++) if (time < starts[i] + steps[i].dur) { index = i; break; }
  const step = steps[index];
  const t = reduced ? step.dur : time - starts[index];
  const active = playing && inView && !controlled && !reduced;

  // Scaling: measure only the outer frame width; the stage scales once with transform.
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setK(el.clientWidth / w);
    measure(); // Measure synchronously once so the first frame shows, without waiting for ResizeObserver
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    let alive = true;
    document.fonts?.ready.then(() => alive && bump((n) => n + 1));
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [w]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return setInView(true);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Clock: ticks every 40ms, pauses while the tab is hidden, advances at most 0.25 seconds per tick so it does not fast-forward on return.
  useEffect(() => {
    if (!active) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;
      if (document.hidden) return;
      setInner((v) => (v + dt >= total ? (loop ? (v + dt) % total : total) : v + dt));
    }, 40);
    return () => window.clearInterval(id);
  }, [active, total, loop]);

  useEffect(() => {
    if (!loop && inner >= total) setPlaying(false);
  }, [inner, total, loop]);

  const ended = !loop && time >= total;
  const prev = !reduced && index > 0 && t < 0.3 ? steps[index - 1] : null;
  const layer = (s: StepDemoStep, lt: number, current: boolean, opacity: number) => (
    <div key={s.id} data-stp-layer={current ? "current" : "prev"} className="absolute inset-0" style={{ opacity }}>
      <StepContext.Provider value={{ t: lt, dur: s.dur, reduced, index: steps.indexOf(s), step: s }}>
        <s.View t={lt} dur={s.dur} reduced={reduced} />
      </StepContext.Provider>
    </div>
  );

  return (
    <figure ref={rootRef} className={cn("m-0 w-full min-w-0", className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        {chrome !== "none" ? (
          <div aria-hidden className={cn("flex items-center gap-2 border-b border-border bg-muted px-3 py-2 sm:px-4", metalVars)} style={metalBar}>
            <span className={cn(lens, "bg-[#FF5F57]")} />
            <span className={cn(lens, "bg-[#FEBC2E]")} />
            <span className={cn(lens, "bg-[#28C840]")} />
            {chrome === "browser" && url ? (
              <span className="mx-auto max-w-[60%] truncate rounded-md bg-background px-3 py-0.5 font-mono text-[11px] text-muted-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)] dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)]">{url}</span>
            ) : chrome === "window" && title ? (
              <span className="mx-auto truncate text-xs font-medium text-muted-foreground">{title}</span>
            ) : null}
            <span className="w-10" />
          </div>
        ) : null}
        <div ref={frameRef} className="relative w-full overflow-hidden" style={{ aspectRatio: `${w} / ${h}` }}>
          <div
            ref={stageRef}
            role="img"
            aria-label={`${msg.demo}: ${steps.map((s, i) => `${i + 1}. ${s.name}`).join(", ")}`}
            className={cn("pointer-events-none absolute top-0 left-0 origin-top-left select-none bg-background", stageClassName)}
            style={{ width: w, height: h, transform: `scale(${k})`, visibility: k ? "visible" : "hidden" }}
          >
            {prev ? layer(prev, prev.dur, false, 1 - t / 0.3) : null}
            {layer(step, t, true, reduced ? 1 : ease(t, 0, 0.45, "fade"))}
            <Cursor keys={reduced ? [] : (step.cursor ?? [])} t={t} stage={stageRef} size={size} layout={`${step.id}|${k}|${fonts}`} />
          </div>
        </div>
      </div>

      {controls !== "none" ? (
        <div className="mt-3 flex items-start gap-3">
          {!reduced && !controlled ? (
            <button
              type="button"
              onClick={() => (ended ? (setTime(0), setPlaying(true)) : setPlaying((p) => !p))}
              aria-label={ended ? msg.replay : playing ? msg.pause : msg.play}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[color,background-color,scale] duration-150 hover:bg-muted hover:duration-0 motion-safe:active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-3.5">
                {playing && !ended ? <path d="M7 4h3v16H7zM14 4h3v16h-3z" /> : <path d="M7 4.5v15l12-7.5z" />}
              </svg>
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <ol aria-label={msg.steps} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
              {steps.map((s, i) => {
                const fill = reduced ? (i <= index ? 1 : 0) : clamp01((time - starts[i]) / s.dur);
                return (
                  <li key={s.id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setTime(starts[i])}
                      aria-current={i === index ? "step" : undefined}
                      className="group block w-full rounded-sm text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {/* Recessed track; the filled part is a raised strip of brand-colour lacquer, and the current step's strip stands taller */}
                      <span className="flex h-2 items-center">
                        <span className={cn("block w-full overflow-hidden rounded-full bg-muted shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)] transition-[height] duration-150", i === index ? "h-2" : "h-1")}>
                          <span
                            className="block h-full origin-left rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_-1px_0_rgb(0_0_0/0.18)]"
                            style={{ transform: `scaleX(${fill})`, backgroundImage: lacquerImage }}
                          />
                        </span>
                      </span>
                      <span className={cn("mt-1.5 block truncate text-xs font-medium", i === index ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                        {s.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {controls === "scrubber" ? (
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={total}
                  step={0.01}
                  value={time}
                  onChange={(e) => setTime(Number(e.target.value))}
                  aria-label={msg.timeline}
                  aria-valuetext={`${fmt(time)} / ${fmt(total)}`}
                  className="h-4 min-w-0 flex-1 accent-[color:var(--sunui-spot,var(--primary))]"
                />
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                  {fmt(time)} / {fmt(total)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </figure>
  );
}
