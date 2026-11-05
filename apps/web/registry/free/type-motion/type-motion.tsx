"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 全部字體動效 id；demo 與文件都從這裡讀 */
/** 只在 running 時排程逐幀回呼；停住時完全不佔用幀迴圈 */
function useRunningFrame(running: boolean, cb: (deltaMs: number) => void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      cbRef.current(now - last);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}

export const typeMotions = ["text-on-path", "variable-font", "text-mask"] as const;

export type TypeMotionName = (typeof typeMotions)[number];
export type TypeMotionTrigger = "mount" | "inView" | "hover" | "click" | "loop";

/* ---------- 共用小工具 ---------- */

function subscribeVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}

/** 分頁是否在前景；切到別的分頁時循環暫停 */
function usePageVisible() {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== "hidden",
    () => true,
  );
}

/** 依 trigger 算出：是否已開始（play）、是否該動（running）、hover / click 的狀態（active） */
function useTrigger<T extends HTMLElement>(trigger: TypeMotionTrigger) {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<T>(null);
  const seen = useInView(ref, { once: true, amount: 0.3 });
  const visible = useInView(ref, { amount: 0 });
  const pageVisible = usePageVisible();
  const [hovered, setHovered] = useState(false);
  const [toggled, setToggled] = useState(false);

  const active = trigger === "hover" ? hovered : trigger === "click" ? toggled : true;
  const play = trigger === "inView" ? seen : true;
  const running = !reduce && visible && pageVisible && play && active;

  const handlers: HTMLAttributes<HTMLElement> = {};
  if (trigger === "hover") {
    handlers.onMouseEnter = () => setHovered(true);
    handlers.onMouseLeave = () => setHovered(false);
  }
  if (trigger === "click") {
    handlers.onClick = () => setToggled((v) => !v);
    handlers.onKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setToggled((v) => !v);
      }
    };
    handlers.role = "button";
    handlers.tabIndex = 0;
    handlers["aria-pressed"] = toggled;
  }
  return { ref, reduce, play, running, active, handlers };
}

function cleanId(id: string) {
  return id.replace(/[^a-zA-Z0-9-]/g, "");
}

/* ---------- 131 路徑文字 ---------- */

export type TextPathPreset = "wave" | "circle" | "arc";

const pathPresets: Record<TextPathPreset, { d: string; viewBox: string; closed: boolean; fontSize: number }> = {
  wave: {
    d: "M-10 60 Q 40 10 90 60 T 190 60 T 290 60 T 390 60 T 490 60",
    viewBox: "0 0 400 120",
    closed: false,
    fontSize: 24,
  },
  circle: {
    d: "M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0",
    viewBox: "0 0 200 200",
    closed: true,
    fontSize: 17,
  },
  arc: {
    d: "M24 150 A 140 140 0 0 1 296 150",
    viewBox: "0 0 320 170",
    closed: false,
    fontSize: 24,
  },
};

export interface TextOnPathProps {
  text: string;
  /** 內建路徑；傳 d 時改用自訂路徑 */
  preset?: TextPathPreset;
  /** 自訂 SVG 路徑 d，搭配 viewBox */
  d?: string;
  viewBox?: string;
  /** 自訂路徑是否為封閉圖形（封閉時文字會首尾相接繞圈） */
  closed?: boolean;
  /** viewBox 單位的字級 */
  fontSize?: number;
  /** 文字繞完一趟的秒數 */
  duration?: number;
  /** 反方向流動 */
  reverse?: boolean;
  /** 顯示路徑本身（淡淡的線） */
  showPath?: boolean;
  trigger?: TypeMotionTrigger;
  className?: string;
}

/** 文字沿著任意 SVG 路徑流動，每個字自動轉向貼合路徑（以 startOffset 驅動）。 */
export function TextOnPath({
  text,
  preset = "wave",
  d,
  viewBox,
  closed,
  fontSize,
  duration = 10,
  reverse = false,
  showPath = false,
  trigger = "loop",
  className,
}: TextOnPathProps) {
  const p = pathPresets[preset];
  const pathD = d ?? p.d;
  const box = viewBox ?? (d ? "0 0 400 200" : p.viewBox);
  const isClosed = closed ?? (d ? false : p.closed);
  const size = fontSize ?? p.fontSize;
  const id = `top-${cleanId(useId())}`;

  const t = useTrigger<HTMLSpanElement>(trigger);
  const pathRef = useRef<SVGPathElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const aRef = useRef<SVGTextPathElement>(null);
  const bRef = useRef<SVGTextPathElement>(null);
  const len = useRef({ path: 0, text: 0 });
  const pos = useRef<number | null>(null);

  // 依位置算 startOffset：開放路徑從尾端流入、從起點流出；封閉路徑兩份首尾相接
  const apply = (value: number) => {
    const L = len.current.path;
    if (!L) return;
    if (isClosed) {
      const o = -(((value % L) + L) % L);
      aRef.current?.setAttribute("startOffset", String(o));
      bRef.current?.setAttribute("startOffset", String(o + L));
    } else {
      aRef.current?.setAttribute("startOffset", String(L - value));
    }
  };

  // 量路徑與文字長度；字型載入後再量一次
  useEffect(() => {
    let alive = true;
    const measure = () => {
      if (!alive || !pathRef.current || !textRef.current) return;
      len.current = { path: pathRef.current.getTotalLength(), text: textRef.current.getComputedTextLength() };
      const { path: L, text: T } = len.current;
      // 起始位置：開放路徑讓文字置中，封閉路徑從 0 開始
      if (pos.current === null) pos.current = isClosed ? 0 : (L + T) / 2;
      apply(pos.current);
    };
    measure();
    document.fonts?.ready.then(measure);
    return () => {
      alive = false;
    };
    // apply 只讀 ref，不需要列入
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, pathD, size, isClosed]);

  useRunningFrame(t.running, (delta) => {
    if (pos.current === null) return;
    const { path: L, text: T } = len.current;
    const period = isClosed ? L : L + T;
    if (!period) return;
    const step = (Math.min(delta, 64) / 1000 / duration) * period * (reverse ? -1 : 1);
    pos.current = (((pos.current + step) % period) + period) % period;
    apply(pos.current);
  });

  const textProps = { fontSize: size, fill: "currentColor", "aria-hidden": true as const };

  return (
    <span ref={t.ref} className={cn("relative inline-block", className)} {...t.handlers}>
      <span className="sr-only">{text}</span>
      <svg viewBox={box} aria-hidden="true" className="block h-auto w-full overflow-visible">
        <path
          id={id}
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke={showPath ? "currentColor" : "none"}
          strokeOpacity={0.2}
          strokeDasharray="3 5"
        />
        <text ref={textRef} {...textProps}>
          <textPath ref={aRef} href={`#${id}`} startOffset="0">
            {text}
          </textPath>
        </text>
        {isClosed && (
          <text {...textProps}>
            <textPath ref={bRef} href={`#${id}`} startOffset="0">
              {text}
            </textPath>
          </text>
        )}
      </svg>
    </span>
  );
}

/* ---------- 132 可變字重 ---------- */

export interface VariableWeightProps {
  text: string;
  /** 起始字重（wght），100 到 900 */
  from?: number;
  /** 目標字重 */
  to?: number;
  /** 字寬（wdth，百分比）的起點與終點，字型支援才有效 */
  width?: [number, number];
  /** 其他可變軸，例如 { slnt: [0, -10] } */
  axes?: Record<string, [number, number]>;
  /** word：整個詞一起變；wave：逐字錯開成波浪 */
  mode?: "word" | "wave";
  /** 一個來回（loop）或一次變化的秒數 */
  duration?: number;
  /** wave 模式的逐字間隔秒數 */
  stagger?: number;
  /** loop：持續來回；mount / inView：變一次停在 to；hover：滑過時變粗；click：切換 */
  trigger?: TypeMotionTrigger;
  className?: string;
}

/**
 * 在 from 與 to 之間平滑改變字重（以及字寬或任意可變軸）。
 * 用一般靜態字型時瀏覽器會跳到最接近的字重，不會壞掉。
 */
export function VariableWeight({
  text,
  from = 200,
  to = 900,
  width,
  axes,
  mode = "wave",
  duration = 2.4,
  stagger = 0.08,
  trigger = "loop",
  className,
}: VariableWeightProps) {
  const t = useTrigger<HTMLSpanElement>(trigger);
  const parts = mode === "word" ? [text] : Array.from(text);
  const config: AxisConfig = { from, to, width, axes };

  return (
    <span ref={t.ref} className={cn("relative inline-block whitespace-pre", className)} {...t.handlers}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {parts.map((ch, i) =>
          ch === " " ? (
            " "
          ) : (
            <WeightPart
              key={i}
              ch={ch}
              delay={i * stagger}
              config={config}
              trigger={trigger}
              duration={duration}
              running={t.running}
              play={t.play}
              active={t.active}
              reduce={t.reduce}
            />
          ),
        )}
      </span>
    </span>
  );
}

interface AxisConfig {
  from: number;
  to: number;
  width?: [number, number];
  axes?: Record<string, [number, number]>;
}

function lerp(a: number, b: number, v: number) {
  return a + (b - a) * v;
}

function WeightPart({
  ch,
  delay,
  config,
  trigger,
  duration,
  running,
  play,
  active,
  reduce,
}: {
  ch: string;
  delay: number;
  config: AxisConfig;
  trigger: TypeMotionTrigger;
  duration: number;
  running: boolean;
  play: boolean;
  active: boolean;
  reduce: boolean;
}) {
  const interactive = trigger === "hover" || trigger === "click";
  const p = useMotionValue(reduce && !interactive ? 1 : 0);

  useEffect(() => {
    if (interactive) {
      const c = animate(p, active ? 1 : 0, reduce ? { duration: 0 } : { duration: duration / 3, delay: delay * 0.5, ease: "easeInOut" });
      return () => c.stop();
    }
    if (reduce) {
      p.set(1);
      return;
    }
    if (trigger === "loop") {
      if (!running) return;
      const c = animate(p, [0, 1], {
        duration: duration / 2,
        delay,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      });
      return () => c.stop();
    }
    if (!play) return;
    const c = animate(p, 1, { duration: duration / 2, delay, ease: "easeInOut" });
    return () => c.stop();
  }, [p, interactive, active, reduce, trigger, running, play, duration, delay]);

  return <WeightSpan p={p} config={config} ch={ch} />;
}

function WeightSpan({ p, config, ch }: { p: MotionValue<number>; config: AxisConfig; ch: string }) {
  const { from, to, width, axes } = config;
  const fontWeight = useTransform(p, (v) => Math.round(lerp(from, to, v)));
  const fontStretch = useTransform(p, (v) => (width ? `${lerp(width[0], width[1], v)}%` : "normal"));
  const fontVariationSettings = useTransform(p, (v) =>
    axes
      ? Object.entries(axes)
          .map(([k, [a, b]]) => `"${k}" ${lerp(a, b, v).toFixed(2)}`)
          .join(", ")
      : "normal",
  );
  return (
    <motion.span className="inline-block" style={{ fontWeight, fontStretch, fontVariationSettings }}>
      {ch}
    </motion.span>
  );
}

/* ---------- 133 文字遮罩 ---------- */

export interface TextMaskProps {
  text: string;
  /** 透出的圖片網址 */
  src?: string;
  /** 透出的影片網址（靜音循環） */
  video?: string;
  /** 沒有圖片或影片時，用這組顏色畫流動漸層；省略跟隨主題 token */
  colors?: string[];
  /** 字重，越粗透出越多 */
  weight?: number;
  /** 背景飄移一趟的秒數；reveal 時也是一個循環的長度 */
  duration?: number;
  /** 結尾讓整張畫面浮現：loop 時每個循環一次，其他 trigger 播一次後停在全圖 */
  reveal?: boolean;
  trigger?: TypeMotionTrigger;
  className?: string;
}

const defaultMaskColors = [
  "var(--chart-1, var(--primary))",
  "var(--chart-2, var(--ring))",
  "var(--chart-3, var(--muted-foreground))",
  "var(--chart-4, var(--primary))",
];

/** 粗字挖空，只在字裡透出圖片、影片或流動漸層，背景緩慢飄移。字會自動撐滿容器寬度。 */
export function TextMask({
  text,
  src,
  video,
  colors = defaultMaskColors,
  weight = 900,
  duration = 8,
  reveal = false,
  trigger = "loop",
  className,
}: TextMaskProps) {
  const uid = cleanId(useId());
  const t = useTrigger<HTMLSpanElement>(trigger);
  const measureRef = useRef<SVGTextElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState({ x: 0, y: -74, w: Math.max(1, Array.from(text).length) * 62, h: 92 });

  // 量字的實際外框，作為 viewBox；字型載入後再量一次
  useEffect(() => {
    let alive = true;
    const measure = () => {
      const el = measureRef.current;
      if (!alive || !el) return;
      const b = el.getBBox();
      if (b.width > 0) setBox({ x: b.x, y: b.y, w: b.width, h: b.height });
    };
    const raf = requestAnimationFrame(measure);
    document.fonts?.ready.then(measure);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [text, weight]);

  // 影片跟著循環一起暫停
  useEffect(() => {
    svgRef.current?.querySelectorAll("video").forEach((v) => {
      if (t.running) v.play().catch(() => {});
      else v.pause();
    });
  }, [t.running, video]);

  const pad = box.h * 0.04;
  const vb = { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 };
  // 背景比字大一圈，飄移時邊緣不會露出來
  const bg = { x: vb.x - vb.w * 0.15, y: vb.y - vb.h * 0.3, w: vb.w * 1.3, h: vb.h * 1.6 };
  const dx = vb.w * 0.12;
  const drift = t.running ? { x: [-dx, dx], y: [vb.h * 0.08, -vb.h * 0.08] } : undefined;
  const driftT = { duration, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const };

  const fill = (
    <motion.g animate={drift} transition={driftT}>
      {video ? (
        <foreignObject x={bg.x} y={bg.y} width={bg.w} height={bg.h}>
          <video src={video} muted loop playsInline autoPlay className="h-full w-full object-cover" />
        </foreignObject>
      ) : src ? (
        <image href={src} x={bg.x} y={bg.y} width={bg.w} height={bg.h} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <rect x={bg.x} y={bg.y} width={bg.w} height={bg.h} fill={`url(#${uid}-g)`} />
      )}
    </motion.g>
  );

  const loopReveal = trigger === "loop";
  const outside = 0.12;
  const revealAnim = t.reduce
    ? { opacity: outside }
    : loopReveal
      ? t.running
        ? { opacity: [outside, outside, 1, 1, outside, outside] }
        : { opacity: outside }
      : t.play && t.active
        ? { opacity: 1 }
        : { opacity: outside };
  const revealT = loopReveal
    ? { duration, repeat: Infinity, times: [0, 0.73, 0.82, 0.9, 0.99, 1], ease: "easeInOut" as const }
    : { duration: 0.8, delay: duration * 0.6, ease: "easeInOut" as const };

  return (
    <span ref={t.ref} className={cn("relative block", className)} {...t.handlers}>
      <span className="sr-only">{text}</span>
      <svg
        ref={svgRef}
        aria-hidden="true"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className="block h-auto w-full"
        style={{ fontWeight: weight }}
      >
        <defs>
          <clipPath id={`${uid}-c`}>
            <text x={0} y={0} fontSize={100} style={{ letterSpacing: "-0.02em" }}>
              {text}
            </text>
          </clipPath>
          <linearGradient
            id={`${uid}-g`}
            gradientUnits="userSpaceOnUse"
            x1={bg.x}
            y1={bg.y}
            x2={bg.x + bg.w / 2}
            y2={bg.y + bg.h}
            spreadMethod="reflect"
          >
            {colors.map((c, i) => (
              <stop key={i} offset={colors.length > 1 ? i / (colors.length - 1) : 0} style={{ stopColor: c }} />
            ))}
          </linearGradient>
        </defs>
        {/* 只拿來量尺寸，不顯示 */}
        <text ref={measureRef} x={0} y={0} fontSize={100} visibility="hidden" style={{ letterSpacing: "-0.02em" }}>
          {text}
        </text>
        {reveal && (
          <motion.g initial={{ opacity: outside }} animate={revealAnim} transition={revealT}>
            {fill}
          </motion.g>
        )}
        <g clipPath={`url(#${uid}-c)`}>{fill}</g>
      </svg>
    </span>
  );
}

/* ---------- 主元件 ---------- */

export type TypeMotionProps =
  | ({ effect: "text-on-path" } & TextOnPathProps)
  | ({ effect: "variable-font" } & VariableWeightProps)
  | ({ effect: "text-mask" } & TextMaskProps);

/** 用 effect 切換三種字體動效：text-on-path、variable-font、text-mask。 */
export function TypeMotion(props: TypeMotionProps): ReactNode {
  switch (props.effect) {
    case "text-on-path": {
      const { effect: _e, ...rest } = props;
      void _e;
      return <TextOnPath {...rest} />;
    }
    case "variable-font": {
      const { effect: _e, ...rest } = props;
      void _e;
      return <VariableWeight {...rest} />;
    }
    case "text-mask": {
      const { effect: _e, ...rest } = props;
      void _e;
      return <TextMask {...rest} />;
    }
  }
}
