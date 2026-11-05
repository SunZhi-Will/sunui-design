"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 全部圖表效果 id */
export const chartEffects = [
  "bar-grow",
  "donut-segments",
  "line-draw",
  "number-counter",
  "bar-race",
  "radial-progress",
  "sparkline",
] as const;

export type ChartEffectVariant = (typeof chartEffects)[number];
export type ChartEffectTrigger = "mount" | "inView" | "loop";

export interface ChartDatum {
  label: string;
  value: number;
}

export interface ChartEffectProps {
  variant?: ChartEffectVariant;
  /** 預設進入畫面才播；loop 會在畫面內定期重播 */
  trigger?: ChartEffectTrigger;
  /** bar-grow、donut-segments、line-draw、sparkline 的資料 */
  data?: ChartDatum[];
  /** bar-race 的每一格資料（每格是一組 label / value） */
  frames?: ChartDatum[][];
  /** bar-race 每一格的標題，例如年份 */
  frameLabels?: string[];
  /** number-counter 的目標值；radial-progress 的百分比 (0 到 100) */
  value?: number;
  /** number-counter 進度條的滿格值 */
  max?: number;
  /** 圖表標題或數字說明 */
  label?: string;
  /** 數字格式化 */
  format?: (n: number) => string;
  /** 主要動畫秒數 */
  duration?: number;
  delay?: number;
  /** 系列色，省略跟隨主題 token */
  colors?: string[];
  className?: string;
}

// 預設色：有 shadcn chart token 就用，沒有就以 primary 的不同濃度區分
const defaultColors = [
  "var(--chart-1, var(--primary))",
  "var(--chart-2, color-mix(in oklch, var(--primary) 70%, transparent))",
  "var(--chart-3, color-mix(in oklch, var(--primary) 48%, transparent))",
  "var(--chart-4, color-mix(in oklch, var(--primary) 30%, transparent))",
  "var(--chart-5, color-mix(in oklch, var(--primary) 16%, transparent))",
];

const defaultData: ChartDatum[] = [
  { label: "Mon", value: 32 },
  { label: "Tue", value: 48 },
  { label: "Wed", value: 41 },
  { label: "Thu", value: 66 },
  { label: "Fri", value: 58 },
  { label: "Sat", value: 79 },
  { label: "Sun", value: 72 },
];

const defaultFrames: ChartDatum[][] = [
  [
    { label: "North", value: 42 },
    { label: "South", value: 35 },
    { label: "East", value: 28 },
    { label: "West", value: 22 },
    { label: "Central", value: 15 },
  ],
  [
    { label: "North", value: 50 },
    { label: "South", value: 58 },
    { label: "East", value: 34 },
    { label: "West", value: 40 },
    { label: "Central", value: 21 },
  ],
  [
    { label: "North", value: 61 },
    { label: "South", value: 64 },
    { label: "East", value: 70 },
    { label: "West", value: 47 },
    { label: "Central", value: 30 },
  ],
  [
    { label: "North", value: 66 },
    { label: "South", value: 71 },
    { label: "East", value: 79 },
    { label: "West", value: 83 },
    { label: "Central", value: 44 },
  ],
];

const defaultDuration: Record<ChartEffectVariant, number> = {
  "bar-grow": 0.7,
  "donut-segments": 1.4,
  "line-draw": 1.4,
  "number-counter": 1.6,
  "bar-race": 1.6,
  "radial-progress": 1.4,
  sparkline: 1,
};

const easeOut = [0.2, 0.8, 0.2, 1] as const;
const overshoot = [0.34, 1.4, 0.64, 1] as const;
const fmtDefault = (n: number) => Math.round(n).toLocaleString();

interface InnerProps {
  play: boolean;
  running: boolean;
  reduce: boolean;
  d: number;
  delay: number;
  colors: string[];
  data: ChartDatum[];
  frames: ChartDatum[][];
  frameLabels: string[];
  value: number;
  max: number;
  label?: string;
  format: (n: number) => string;
}

export function ChartEffect({
  variant = "bar-grow",
  trigger = "inView",
  data = defaultData,
  frames = defaultFrames,
  frameLabels = ["2023", "2024", "2025", "2026"],
  value,
  max = 100,
  label,
  format = fmtDefault,
  duration,
  delay = 0,
  colors = defaultColors,
  className,
}: ChartEffectProps) {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.4 });
  const visible = useInView(ref, { amount: 0 });
  const [cycle, setCycle] = useState(0);
  const d = duration ?? defaultDuration[variant];

  const play = trigger === "mount" ? true : seen;
  // bar-race 本身就是循環：開始後在畫面內持續換格
  const running = !reduce && visible && play;

  useEffect(() => {
    if (trigger !== "loop" || variant === "bar-race" || reduce || !visible) return;
    const id = setInterval(() => setCycle((c) => c + 1), (delay + d * 1.6 + 2.4) * 1000);
    return () => clearInterval(id);
  }, [trigger, variant, reduce, visible, delay, d]);

  const fallbackValue = variant === "radial-progress" ? 72 : 12840;
  const inner: InnerProps = {
    play,
    running,
    reduce,
    d,
    delay,
    colors,
    data,
    frames,
    frameLabels,
    value: value ?? fallbackValue,
    max: value === undefined && variant === "number-counter" ? 15000 : max,
    label,
    format,
  };
  const Chart = renderers[variant];

  return (
    <div ref={ref} className={cn("w-full text-foreground", className)}>
      <Chart key={cycle} {...inner} />
    </div>
  );
}

/* ---------- 共用 ---------- */

/** 從 0 數到 target；reduced motion 直接給終值 */
function useCountUp(target: number, play: boolean, reduce: boolean, duration: number, delay: number): MotionValue<number> {
  const mv = useMotionValue(0);
  useEffect(() => {
    if (reduce) {
      mv.set(target);
      return;
    }
    if (!play) return;
    const controls = animate(mv, target, { duration, delay, ease: easeOut });
    return () => controls.stop();
  }, [mv, target, play, reduce, duration, delay]);
  return mv;
}

/** 把 MotionValue 以格式化字串輸出（SVG 與 HTML 都能用） */
function Count({ mv, format }: { mv: MotionValue<number>; format: (n: number) => string }) {
  const [text, setText] = useState(() => format(mv.get()));
  useMotionValueEvent(mv, "change", (v) => setText(format(v)));
  return <>{text}</>;
}

function CountUp(p: { to: number; play: boolean; reduce: boolean; d: number; delay: number; format: (n: number) => string }) {
  const mv = useCountUp(p.to, p.play, p.reduce, p.d, p.delay);
  return <Count mv={mv} format={p.format} />;
}

function summary(data: ChartDatum[], format: (n: number) => string, label?: string) {
  return `${label ? `${label}: ` : ""}${data.map((x) => `${x.label} ${format(x.value)}`).join(", ")}`;
}

function enter(play: boolean, reduce: boolean) {
  return { initial: reduce ? (false as const) : "hidden", animate: reduce || play ? "show" : "hidden" };
}

/* ---------- bar-grow ---------- */

function BarGrow({ play, reduce, d, delay, colors, data, label, format }: InnerProps) {
  const W = 320;
  const H = 200;
  const pad = { t: 24, b: 24, x: 8 };
  const top = Math.max(...data.map((x) => x.value), 1);
  const slot = (W - pad.x * 2) / data.length;
  const bw = slot * 0.6;
  const step = (d * 0.9) / Math.max(1, data.length);
  return (
    <figure className="w-full">
      {label && <figcaption className="mb-2 text-sm font-medium">{label}</figcaption>}
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={summary(data, format, label)}>
        <line x1={pad.x} x2={W - pad.x} y1={H - pad.b} y2={H - pad.b} stroke="var(--border)" />
        {data.map((x, i) => {
          const h = ((H - pad.t - pad.b) * x.value) / top;
          const bx = pad.x + slot * i + (slot - bw) / 2;
          const by = H - pad.b - h;
          const variants: Variants = {
            hidden: { scaleY: 0 },
            show: { scaleY: 1, transition: { duration: d, delay: delay + i * step, ease: overshoot } },
          };
          return (
            <g key={i}>
              <motion.rect
                x={bx}
                y={by}
                width={bw}
                height={h}
                rx={3}
                fill={colors[0]}
                style={{ originY: 1, transformBox: "fill-box" }}
                variants={variants}
                {...enter(play, reduce)}
              />
              <text x={bx + bw / 2} y={by - 6} textAnchor="middle" fontSize="11" fill="currentColor" className="tabular-nums">
                <CountUp to={x.value} play={play} reduce={reduce} d={d} delay={delay + i * step} format={format} />
              </text>
              <text x={bx + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
                {x.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/* ---------- donut-segments ---------- */

function DonutSegments({ play, reduce, d, delay, colors, data, label, format }: InnerProps) {
  const total = data.reduce((s, x) => s + x.value, 0) || 1;
  const r = 40;
  const gap = data.length > 1 ? 0.006 : 0;
  let acc = 0;
  const segs = data.map((x) => {
    const start = acc / total;
    acc += x.value;
    return { ...x, start, frac: x.value / total };
  });
  return (
    <figure className="flex w-full flex-wrap items-center justify-center gap-5">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 100 100" className="block size-full -rotate-90" role="img" aria-label={summary(data, format, label)}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="12" />
          {segs.map((s, i) => {
            const variants: Variants = {
              hidden: { pathLength: 0 },
              show: {
                pathLength: Math.max(0, s.frac - gap),
                transition: { duration: d * s.frac, delay: delay + d * s.start, ease: "linear" },
              },
            };
            return (
              <g key={i} transform={`rotate(${s.start * 360} 50 50)`}>
                <motion.circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={colors[i % colors.length]}
                  strokeWidth="12"
                  variants={variants}
                  {...enter(play, reduce)}
                />
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-xl font-semibold tabular-nums">
              <CountUp to={total} play={play} reduce={reduce} d={d} delay={delay} format={format} />
            </div>
            {label && <div className="text-xs text-muted-foreground">{label}</div>}
          </div>
        </div>
      </div>
      <ul className="grid gap-1.5 text-sm">
        {segs.map((s, i) => (
          <motion.li
            key={i}
            className="flex items-center gap-2"
            variants={{
              hidden: { opacity: 0, x: -12 },
              show: { opacity: 1, x: 0, transition: { duration: 0.4, delay: delay + d * 0.3 + i * 0.08, ease: easeOut } },
            }}
            {...enter(play, reduce)}
          >
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: colors[i % colors.length] }} />
            <span>{s.label}</span>
            <span className="ml-auto pl-3 tabular-nums text-muted-foreground">{Math.round(s.frac * 100)}%</span>
          </motion.li>
        ))}
      </ul>
    </figure>
  );
}

/* ---------- line-draw ---------- */

/** 簡單的 Catmull-Rom 平滑曲線 */
function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let p = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    p += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return p;
}

function LineDraw({ play, reduce, d, delay, colors, data, label, format }: InnerProps) {
  const gid = `sunui-line-${useId().replace(/:/g, "")}`;
  const W = 320;
  const H = 180;
  const pad = { t: 16, b: 24, x: 12 };
  const vals = data.map((x) => x.value);
  const hi = Math.max(...vals, 1);
  const lo = Math.min(...vals, 0);
  const pts = data.map((x, i): [number, number] => [
    pad.x + ((W - pad.x * 2) * i) / Math.max(1, data.length - 1),
    pad.t + (H - pad.t - pad.b) * (1 - (x.value - lo) / (hi - lo || 1)),
  ]);
  const line = smoothPath(pts);
  const area = pts.length > 1 ? `${line} L${pts[pts.length - 1][0]},${H - pad.b} L${pts[0][0]},${H - pad.b} Z` : "";
  const c = colors[0];
  return (
    <figure className="w-full">
      {label && <figcaption className="mb-2 text-sm font-medium">{label}</figcaption>}
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={summary(data, format, label)}>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.28" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad.x} x2={W - pad.x} y1={pad.t + (H - pad.t - pad.b) * f} y2={pad.t + (H - pad.t - pad.b) * f} stroke="var(--border)" strokeDasharray="3 4" />
        ))}
        <motion.path
          d={area}
          fill={`url(#${gid})`}
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: d * 0.6, delay: delay + d * 0.5 } } }}
          {...enter(play, reduce)}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={c}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: d, delay, ease: "easeInOut" } } }}
          {...enter(play, reduce)}
        />
        {pts.map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="3.5"
            fill="var(--background)"
            stroke={c}
            strokeWidth="2"
            style={{ transformBox: "fill-box", originX: 0.5, originY: 0.5 }}
            variants={{
              hidden: { scale: 0 },
              show: { scale: 1, transition: { duration: 0.35, delay: delay + (d * i) / Math.max(1, pts.length - 1), ease: overshoot } },
            }}
            {...enter(play, reduce)}
          />
        ))}
        {data.map((x, i) => (
          <text key={i} x={pts[i][0]} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
            {x.label}
          </text>
        ))}
      </svg>
    </figure>
  );
}

/* ---------- number-counter ---------- */

function NumberCounter({ play, reduce, d, delay, value, max, label, format }: InnerProps) {
  const mv = useCountUp(value, play, reduce, d, delay);
  const scaleX = useTransform(mv, (v) => Math.min(1, Math.max(0, v / (max || 1))));
  return (
    <div className="w-full">
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
      <p className="text-4xl font-semibold tracking-tight tabular-nums">
        <span className="sr-only">{format(value)}</span>
        <span aria-hidden="true">
          <Count mv={mv} format={format} />
        </span>
      </p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <motion.div className="h-full origin-left rounded-full bg-primary" style={{ scaleX }} />
      </div>
    </div>
  );
}

/* ---------- bar-race ---------- */

function BarRace({ running, reduce, d, colors, frames, frameLabels, label, format }: InnerProps) {
  const [index, setIndex] = useState(reduce ? frames.length - 1 : 0);
  const current = reduce ? frames.length - 1 : index;
  useEffect(() => {
    if (!running || frames.length < 2) return;
    const id = setInterval(() => setIndex((n) => (n + 1) % frames.length), d * 1000);
    return () => clearInterval(id);
  }, [running, d, frames.length]);

  const frame = useMemo(() => frames[current] ?? [], [frames, current]);
  const sorted = useMemo(() => [...frame].sort((a, b) => b.value - a.value), [frame]);
  const top = Math.max(...frame.map((x) => x.value), 1);
  // 顏色依 label 固定，換名次時不會換色
  const colorOf = useMemo(() => {
    const names = Array.from(new Set(frames.flat().map((x) => x.label)));
    return (name: string) => colors[names.indexOf(name) % colors.length];
  }, [frames, colors]);
  const layout = { type: "spring", stiffness: 260, damping: 30 } as const;

  return (
    <figure className="w-full" aria-label={summary(frame, format, label)} role="img">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        {label && <figcaption className="text-sm font-medium">{label}</figcaption>}
        <span className="ml-auto text-2xl font-semibold tabular-nums text-muted-foreground">{frameLabels[current] ?? ""}</span>
      </div>
      <ul className="grid gap-1.5" aria-hidden="true">
        {sorted.map((x) => (
          <motion.li key={x.label} layout={!reduce} transition={layout} className="grid grid-cols-[4.5rem_1fr] items-center gap-2 text-sm">
            <span className="truncate">{x.label}</span>
            <span className="flex items-center gap-2">
              <motion.span
                className="block h-5 rounded-sm"
                style={{ backgroundColor: colorOf(x.label) }}
                initial={false}
                animate={{ width: `${(x.value / top) * 82}%` }}
                transition={reduce ? { duration: 0 } : layout}
              />
              <span className="text-xs tabular-nums text-muted-foreground">{format(x.value)}</span>
            </span>
          </motion.li>
        ))}
      </ul>
    </figure>
  );
}

/* ---------- radial-progress ---------- */

function RadialProgress({ play, reduce, d, delay, colors, value, label }: InnerProps) {
  const pct = Math.min(100, Math.max(0, value));
  const mv = useCountUp(pct, play, reduce, d, delay);
  const pathLength = useTransform(mv, (v) => v / 100);
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="relative size-36">
        <svg viewBox="0 0 100 100" className="block size-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="8" />
          <motion.circle cx="50" cy="50" r="42" fill="none" stroke={colors[0]} strokeWidth="8" strokeLinecap="round" style={{ pathLength }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-3xl font-semibold tabular-nums">
            <span className="sr-only">{`${Math.round(pct)}%`}</span>
            <span aria-hidden="true">
              <Count mv={mv} format={(v) => `${Math.round(v)}%`} />
            </span>
          </span>
        </div>
      </div>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

/* ---------- sparkline ---------- */

function Sparkline({ play, reduce, d, delay, colors, data, label, format }: InnerProps) {
  const W = 120;
  const H = 36;
  const vals = data.map((x) => x.value);
  const hi = Math.max(...vals, 1);
  const lo = Math.min(...vals);
  const pts = vals.map((v, i): [number, number] => [3 + ((W - 6) * i) / Math.max(1, vals.length - 1), 3 + (H - 6) * (1 - (v - lo) / (hi - lo || 1))]);
  const lastPt = pts[pts.length - 1] ?? [0, 0];
  const last = vals[vals.length - 1] ?? 0;
  const first = vals[0] ?? 0;
  const delta = first ? ((last - first) / first) * 100 : 0;
  const c = colors[0];
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div>
        {label && <p className="text-xs text-muted-foreground">{label}</p>}
        <p className="text-xl font-semibold tabular-nums">{format(last)}</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}%
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-9 w-32 shrink-0 overflow-visible" role="img" aria-label={summary(data, format, label)}>
        <motion.path
          d={pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ")}
          fill="none"
          stroke={c}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: d, delay, ease: "easeInOut" } } }}
          {...enter(play, reduce)}
        />
        <motion.circle
          cx={lastPt[0]}
          cy={lastPt[1]}
          r="6"
          fill={c}
          style={{ transformBox: "fill-box", originX: 0.5, originY: 0.5 }}
          variants={{
            hidden: { scale: 0, opacity: 0 },
            show: { scale: [0, 1.6], opacity: [0.35, 0], transition: { duration: 0.9, delay: delay + d, ease: "easeOut" } },
          }}
          {...enter(play, reduce)}
        />
        <motion.circle
          cx={lastPt[0]}
          cy={lastPt[1]}
          r="3"
          fill={c}
          style={{ transformBox: "fill-box", originX: 0.5, originY: 0.5 }}
          variants={{ hidden: { scale: 0 }, show: { scale: 1, transition: { duration: 0.35, delay: delay + d, ease: overshoot } } }}
          {...enter(play, reduce)}
        />
      </svg>
    </div>
  );
}

const renderers: Record<ChartEffectVariant, (p: InnerProps) => ReactNode> = {
  "bar-grow": BarGrow,
  "donut-segments": DonutSegments,
  "line-draw": LineDraw,
  "number-counter": NumberCounter,
  "bar-race": BarRace,
  "radial-progress": RadialProgress,
  sparkline: Sparkline,
};
