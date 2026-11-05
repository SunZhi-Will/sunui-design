"use client";

// 以時間 t 驅動的產品 Demo 視窗：每一格畫面都是「這一步第幾秒」的純函式。
// 所以可以跳步、拖曳時間軸、凍結某一秒截圖，減少動態效果時直接顯示每一步的完成畫面。
// 舞台固定設計尺寸（預設 1200 × 750），用單一比例縮放，手機上看到的是同一個畫面而不是重排版。

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type RefObject,
} from "react";

import { cn } from "@/lib/utils";

/* ---------- 時間工具：全部是純函式，只吃 t ---------- */

type Curve = readonly [number, number, number, number];

export const curves = {
  /** 產品系列唯一的 expo-out */
  out: [0.23, 1, 0.32, 1],
  /** 游標滑行 */
  glide: [0.55, 0, 0.25, 1],
  /** 步驟淡入 */
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

/** 從 from 秒開始、歷時 dur 秒的 0 到 1 進度 */
export function ease(t: number, from: number, dur: number, curve: keyof typeof curves | Curve = "out") {
  const c = typeof curve === "string" ? curves[curve] : curve;
  return bezier(c, clamp01((t - from) / Math.max(dur, 1e-6)));
}

/** t 是否已經到了 at 秒 */
export const cue = (t: number, at: number) => t >= at;
/** t 是否落在 [from, to) */
export const held = (t: number, from: number, to: number) => t >= from && t < to;
/** 游標閃爍，回傳是否顯示 */
export const blink = (t: number, hz = 1) => Math.floor(t * hz * 2) % 2 === 0;

const graphemeCache = new Map<string, string[]>();
function graphemes(text: string) {
  let g = graphemeCache.get(text);
  if (!g) {
    g =
      typeof Intl !== "undefined" && "Segmenter" in Intl
        ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment)
        : Array.from(text);
    graphemeCache.set(text, g);
  }
  return g;
}

/** 從 from 秒起以每秒 cps 個字打出 text，CJK 與 emoji 以字形計算 */
export function typed(text: string, t: number, from: number, cps = 50) {
  const g = graphemes(text);
  return g.slice(0, Math.max(0, Math.min(g.length, Math.floor((t - from) * cps)))).join("");
}

/** 打完 text 需要的秒數，拿來排下一個時間點 */
export const typingTime = (text: string, cps = 50) => graphemes(text).length / cps;

/* ---------- 型別 ---------- */

/** 游標目標：舞台內 data-aim 的名稱，或舞台座標 [x, y] */
export type Aim = string | readonly [number, number];

export interface CursorKey {
  /** 抵達目標的秒數 */
  at: number;
  to: Aim;
  /** 按下的秒數，建議比 at 晚 0.3 到 0.6 秒 */
  click?: number;
  /** 滑行秒數，預設 0.7 */
  glide?: number;
  /** 抵達後淡出，讓觀眾看結果 */
  hide?: boolean;
}

export interface StepViewProps {
  /** 這一步的第幾秒 */
  t: number;
  dur: number;
  reduced: boolean;
}

export interface StepDemoStep {
  id: string;
  /** 1 到 3 個字的步驟名稱 */
  name: string;
  /** 秒數，建議 4 到 8 秒，最後至少留 1 秒看結果 */
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
  /** 舞台設計尺寸，預設 [1200, 750] */
  size?: readonly [number, number];
  chrome?: "browser" | "window" | "none";
  url?: string;
  title?: string;
  autoPlay?: boolean;
  loop?: boolean;
  /** steps：步驟列；scrubber：再加時間軸；none：只有畫面 */
  controls?: "steps" | "scrubber" | "none";
  /** 受控的總秒數；給了就凍結在這一格（截圖、文件、測試） */
  time?: number;
  onTimeChange?: (time: number) => void;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK 這類標籤 */
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

/** 在步驟畫面深處拿到目前的 t，不必一路傳 props */
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

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ---------- 游標：位置由 t 算出，目標從 DOM 量測後除以縮放比 ---------- */

const PRESS = 0.18;

function Cursor({ keys, t, stage, size }: { keys: CursorKey[]; t: number; stage: RefObject<HTMLDivElement | null>; size: readonly [number, number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const root = stage.current;
    if (!el || !root || keys.length === 0) return;
    const box = root.getBoundingClientRect();
    const k = box.width / size[0] || 1;
    const point = (aim: Aim): [number, number] => {
      if (typeof aim !== "string") return [aim[0], aim[1]];
      const target = root.querySelector(`[data-stp-layer="current"] [data-aim="${aim}"]`);
      if (!target) return [size[0] / 2, size[1] / 2];
      const r = target.getBoundingClientRect();
      return [(r.left - box.left + r.width / 2) / k, (r.top - box.top + r.height / 2) / k];
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
    // 開場淡入；hide 的目標抵達後淡出；從隱藏狀態出發的下一段再淡入。
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
      <svg viewBox="0 0 24 24" strokeWidth={1.5} strokeLinejoin="round" className="relative size-8 fill-foreground stroke-background drop-shadow-md">
        <path d="M4.04 4.69a.5.5 0 0 1 .65-.65l16 6.5a.5.5 0 0 1-.06.95l-6.13 1.58a2 2 0 0 0-1.43 1.43l-1.58 6.13a.5.5 0 0 1-.95.06z" />
      </svg>
      <span ref={ring} className="absolute top-1 left-1 size-14 rounded-full bg-foreground" style={{ opacity: 0 }} />
    </div>
  );
}

/* ---------- 主元件 ---------- */

export function StepDemo({
  steps,
  size = [1200, 750],
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
  const [, bump] = useState(0);

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

  // 縮放：只量外框寬度，舞台用 transform 一次縮放。
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / size[0]));
    ro.observe(el);
    document.fonts?.ready.then(() => bump((n) => n + 1));
    return () => ro.disconnect();
  }, [size]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return setInView(true);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 時鐘：40ms 一拍，分頁隱藏時不走，單拍最多前進 0.25 秒，回來不會快轉。
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
          <div aria-hidden className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2 sm:px-4">
            <span className="size-2.5 rounded-full bg-[#FF5F57]" />
            <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="size-2.5 rounded-full bg-[#28C840]" />
            {chrome === "browser" && url ? (
              <span className="mx-auto max-w-[60%] truncate rounded-md bg-background px-3 py-0.5 font-mono text-[11px] text-muted-foreground">{url}</span>
            ) : chrome === "window" && title ? (
              <span className="mx-auto truncate text-xs font-medium text-muted-foreground">{title}</span>
            ) : null}
            <span className="w-10" />
          </div>
        ) : null}
        <div ref={frameRef} className="relative w-full overflow-hidden" style={{ aspectRatio: `${size[0]} / ${size[1]}` }}>
          <div
            ref={stageRef}
            role="img"
            aria-label={`${msg.demo}: ${steps.map((s, i) => `${i + 1}. ${s.name}`).join(", ")}`}
            className={cn("pointer-events-none absolute top-0 left-0 origin-top-left select-none bg-background", stageClassName)}
            style={{ width: size[0], height: size[1], transform: `scale(${k})`, visibility: k ? "visible" : "hidden" }}
          >
            {prev ? layer(prev, prev.dur, false, 1 - t / 0.3) : null}
            {layer(step, t, true, reduced ? 1 : ease(t, 0, 0.45, "fade"))}
            <Cursor keys={reduced ? [] : (step.cursor ?? [])} t={t} stage={stageRef} size={size} />
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
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
                      <span className="block h-1 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full origin-left bg-foreground" style={{ transform: `scaleX(${fill})` }} />
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
                  className="h-4 min-w-0 flex-1 accent-foreground"
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
