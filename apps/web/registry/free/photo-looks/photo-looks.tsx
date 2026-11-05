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
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/** 攝影風格與打光效果，用 PhotoLook 的 effect prop 切換 */
export const photoLooks = [
  "backlighting",
  "rim-light",
  "silhouette",
  "split-lighting",
  "rembrandt",
  "butterfly",
  "golden-hour",
  "blue-hour",
  "bokeh",
  "tilt-shift",
  "long-exposure",
  "panning-shot",
  "lens-flare",
  "fisheye",
  "chromatic-aberration",
  "vignette",
  "high-key",
  "low-key",
  "black-and-white",
  "duotone",
  "teal-and-orange",
  "film-grain",
  "light-leak",
  "double-exposure",
] as const;
export type PhotoLookName = (typeof photoLooks)[number];

export type PhotoLookTrigger = "mount" | "inView" | "hover" | "loop" | "always";

export interface PhotoLookProps {
  effect?: PhotoLookName;
  /** 圖片網址；不給 src 時改套用在 children 上 */
  src?: string;
  alt?: string;
  /** 任意內容（影片、卡片、插畫）。部分效果會複製一份 children 當疊層 */
  children?: ReactNode;
  /** 0 到 1，效果的最終強度 */
  intensity?: number;
  /** 效果何時出現：mount（預設）、inView、hover、loop（來回循環）、always（不做動畫） */
  trigger?: PhotoLookTrigger;
  /** 搭配 hover：掛載時淡入效果，滑過時退回原圖（常見的「滑過顯示原色」） */
  invert?: boolean;
  /** 秒；效果淡入的長度，loop 時為半個循環 */
  duration?: number;
  delay?: number;
  /**
   * 色彩，依效果解讀：duotone [暗部, 亮部]、teal-and-orange [青, 橘]、
   * light-leak [內側, 邊緣]，其餘取第一個色當光色或色調
   */
  colors?: string[];
  /** 光從哪個方向來，度數，0 為正上方、90 為右、270 為左（打光類效果） */
  lightAngle?: number;
  /** 光源位置 [x%, y%]：backlighting、golden-hour、lens-flare */
  lightPosition?: [number, number];
  /** 清楚對焦的中心 [x%, y%]：bokeh、panning-shot */
  focusPoint?: [number, number];
  /** tilt-shift 清楚帶的上下緣 [top%, bottom%] */
  focusBand?: [number, number];
  /** double-exposure 疊進剪影裡的第二張圖，預設用同一張 */
  secondSrc?: string;
  /** film-grain 顆粒閃動、light-leak 漏光擺動；false 時保持靜止 */
  live?: boolean;
  /** 外框 className；有 src 時預設 aspect-[4/3] */
  className?: string;
  /** 圖片（或 children 外層）的 className */
  contentClassName?: string;
}

/* ---------- 共用工具 ---------- */

const ease = [0.22, 1, 0.36, 1] as const;
const LUM = ".2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0";

function hexRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16) || 0;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
function mixHex(a: string, b: string, k: number) {
  const x = hexRgb(a);
  const y = hexRgb(b);
  const c = x.map((v, i) => Math.round((v + (y[i] - v) * k) * 255));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function alpha(hex: string, a: number) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}
const mask = (m: string): CSSProperties => ({ maskImage: m, WebkitMaskImage: m });

/** 以亮度對照色階：每個 stop 平均分布在暗到亮之間 */
function ToneFilter({ id, stops, mix = 1 }: { id: string; stops: string[]; mix?: number }) {
  const rgb = stops.map(hexRgb);
  const table = (i: number) => rgb.map((c) => c[i].toFixed(3)).join(" ");
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values={LUM} result="l" />
      <feComponentTransfer in="l" result="tone">
        <feFuncR type="table" tableValues={table(0)} />
        <feFuncG type="table" tableValues={table(1)} />
        <feFuncB type="table" tableValues={table(2)} />
      </feComponentTransfer>
      <Mix in="tone" mix={mix} />
    </filter>
  );
}

/** 最後一步：把效果結果與原圖依強度混合（k2、k3 由動畫寫入） */
function Mix({ in: input, mix = 1 }: { in: string; mix?: number }) {
  return <feComposite in={input} in2="SourceGraphic" operator="arithmetic" k1={0} k2={0} k3={1} k4={0} data-mix={mix} />;
}

/* ---------- 每個效果拿到的資料 ---------- */

interface Ctx {
  id: string;
  colors: string[];
  angle: number;
  pos: [number, number];
  focus: [number, number];
  band: [number, number];
  size: { w: number; h: number };
  /** 循環類小動畫（顆粒、漏光）是否該跑 */
  running: boolean;
  /** 複製一份內容當疊層 */
  copy: (style?: CSSProperties, key?: string | number) => ReactNode;
  secondSrc?: string;
}

interface LookSpec {
  /** 套在原圖上的 CSS filter，v 為目前強度 */
  filter?: (v: number, c: Ctx) => string;
  /** 這個效果需要的 SVG filter（id 用 c.id） */
  svg?: (c: Ctx) => ReactNode;
  /** 疊在上面的圖層；放在 Fade 裡就會跟著強度淡入 */
  layers?: (c: Ctx) => ReactNode;
  colors?: string[];
  angle?: number;
  pos?: [number, number];
  /** 需要量外框尺寸（fisheye、色收差） */
  measure?: boolean;
}

const TContext = createContext<MotionValue<number> | null>(null);

/** 跟著強度淡入的圖層 */
function Fade({ children, style, className }: { children?: ReactNode; style?: CSSProperties; className?: string }) {
  const t = useContext(TContext)!;
  return (
    <motion.div aria-hidden className={cn("pointer-events-none absolute inset-0", className)} style={{ ...style, opacity: t }}>
      {children}
    </motion.div>
  );
}

/** 方向光：亮側暖光、暗側陰影；from / to 為陰影開始與完全變暗的位置（%） */
function Light({ angle, from, to, shadow, tint }: { angle: number; from: number; to: number; shadow: number; tint: string }) {
  const dir = angle + 180;
  return (
    <>
      <Fade style={{ background: `linear-gradient(${dir}deg, transparent ${from}%, rgba(6, 8, 18, ${shadow}) ${to}%)`, mixBlendMode: "multiply" }} />
      <Fade style={{ background: `linear-gradient(${dir}deg, ${alpha(tint, 0.85)} 0%, transparent ${from}%)`, mixBlendMode: "soft-light" }} />
    </>
  );
}

/** 從原點依強度放大的小圖層（光點、散景、光軌） */
function Grow({ style, from = 0.3, origin = "center" }: { style: CSSProperties; from?: number; origin?: string }) {
  const t = useContext(TContext)!;
  const scale = useTransform(t, [0, 1], [from, 1]);
  return <motion.span aria-hidden className="pointer-events-none absolute" style={{ ...style, opacity: t, scale, transformOrigin: origin }} />;
}

function GrowX({ style }: { style: CSSProperties }) {
  const t = useContext(TContext)!;
  return <motion.span aria-hidden className="pointer-events-none absolute" style={{ ...style, opacity: t, scaleX: t, transformOrigin: "left center" }} />;
}

/* ---------- 各效果 ---------- */

// 散景光斑的固定位置（x%, y%, 寬%）
const bokehDots: [number, number, number][] = [
  [8, 18, 13], [22, 32, 9], [34, 12, 16], [52, 26, 10], [66, 10, 14], [78, 30, 11], [90, 16, 15], [14, 46, 8], [86, 44, 9], [46, 6, 7],
];
// 鏡頭光斑：沿著光源到中心的線，k 為比例（2 為對角）
const flareBits: { k: number; size: number; shape: "dot" | "hex" | "ring" }[] = [
  { k: 0.4, size: 3, shape: "dot" },
  { k: 0.75, size: 7, shape: "hex" },
  { k: 1.05, size: 2.5, shape: "dot" },
  { k: 1.35, size: 11, shape: "ring" },
  { k: 1.6, size: 5, shape: "hex" },
  { k: 1.95, size: 16, shape: "ring" },
];
const hexClip = "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0 50%)";

const NOISE = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`;

/** 魚眼的位移圖：中心往外推，四角不動。axis 0 = 水平，1 = 垂直 */
function bulgeMap(w: number, h: number, axis: 0 | 1) {
  const [a, b] = axis === 0 ? ["rgb(255,128,128)", "rgb(0,128,128)"] : ["rgb(128,255,128)", "rgb(128,0,128)"];
  const [x2, y2] = axis === 0 ? [1, 0] : [0, 1];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' preserveAspectRatio='none'><defs><linearGradient id='g' x1='0' y1='0' x2='${x2}' y2='${y2}'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient><radialGradient id='r' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='#fff'/><stop offset='.55' stop-color='#fff'/><stop offset='1' stop-color='#000'/></radialGradient><mask id='m'><rect width='100%' height='100%' fill='url(#r)'/></mask></defs><rect width='100%' height='100%' fill='rgb(128,128,128)'/><rect width='100%' height='100%' fill='url(#g)' mask='url(#m)'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function Grain({ running }: { running: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const x = Math.round(Math.random() * 200 - 100);
      const y = Math.round(Math.random() * 200 - 100);
      if (ref.current) ref.current.style.transform = `translate(${x}px, ${y}px)`;
    }, 90);
    return () => window.clearInterval(id);
  }, [running]);
  return <div ref={ref} className="absolute -inset-[110px]" style={{ backgroundImage: NOISE, backgroundSize: "220px 220px", mixBlendMode: "overlay", opacity: 0.55 }} />;
}

function Leak({ colors, running }: { colors: string[]; running: boolean }) {
  const [inner, edge] = colors;
  const mid = mixHex(inner, edge, 0.5);
  const sway = running
    ? { x: ["0%", "-7%", "2%", "0%"], opacity: [0.85, 1, 0.75, 0.85] }
    : { x: "0%", opacity: 0.9 };
  return (
    <motion.div
      className="absolute inset-y-[-10%] right-0 w-[85%]"
      style={{ mixBlendMode: "screen" }}
      animate={sway}
      transition={running ? { duration: 7, ease: "easeInOut", repeat: Infinity } : { duration: 0 }}
    >
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 100% 70% at 100% 45%, ${alpha(inner, 0.6)} 0%, transparent 70%)` }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 62% 55% at 100% 50%, ${alpha(mid, 0.55)} 0%, transparent 70%)` }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 30% 45% at 100% 55%, ${alpha(edge, 0.7)} 0%, transparent 70%)` }} />
    </motion.div>
  );
}

const specs: Record<PhotoLookName, LookSpec> = {
  /* 逆光：光源在主體後方，整體泛起暖霧，朝向鏡頭的一面變暗 */
  backlighting: {
    colors: ["#FFD48A"],
    pos: [50, 30],
    filter: (v) => `contrast(${1 - 0.2 * v}) brightness(${1 + 0.06 * v}) saturate(${1 - 0.15 * v})`,
    layers: (c) => (
      <>
        <Fade style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(30, 34, 60, .4))", mixBlendMode: "multiply" }} />
        <Fade style={{ background: alpha(c.colors[0], 0.22), mixBlendMode: "screen" }} />
        <Fade style={{ background: `radial-gradient(ellipse 45% 55% at ${c.pos[0]}% ${c.pos[1]}%, ${alpha("#ffffff", 0.95)} 0%, ${alpha(c.colors[0], 0.7)} 12%, ${alpha(c.colors[0], 0.25)} 40%, transparent 75%)`, mixBlendMode: "screen" }} />
      </>
    ),
  },
  /* 輪廓光：環境壓暗，左右兩側的邊緣被描出亮線 */
  "rim-light": {
    colors: ["#FFE3A3"],
    filter: (v) => `brightness(${1 - 0.55 * v}) contrast(${1 + 0.2 * v}) saturate(${1 - 0.3 * v})`,
    svg: (c) => {
      const [r, g, b] = hexRgb(c.colors[0]);
      return (
        <filter id={`${c.id}-edge`} colorInterpolationFilters="sRGB">
          <feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="e1" />
          <feConvolveMatrix in="SourceGraphic" order="3" kernelMatrix="1 1 1 1 -8 1 1 1 1" preserveAlpha="true" result="e2" />
          <feComposite in="e1" in2="e2" operator="arithmetic" k2={1} k3={1} result="e" />
          <feColorMatrix in="e" type="matrix" values={`0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 3 6 1.5 0 0`} result="c" />
          <feMorphology in="c" operator="dilate" radius="1" result="d" />
          <feGaussianBlur in="d" stdDeviation="3" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="d" />
          </feMerge>
        </filter>
      );
    },
    layers: (c) => (
      <>
        <Fade style={{ mixBlendMode: "screen" }}>
          {c.copy({ filter: `url(#${c.id}-edge)`, ...mask("linear-gradient(90deg, #000, transparent 38%, transparent 62%, #000)") })}
        </Fade>
        <Fade style={{ background: `linear-gradient(90deg, ${alpha(c.colors[0], 0.28)}, transparent 22%, transparent 78%, ${alpha(c.colors[0], 0.28)})`, mixBlendMode: "screen" }} />
      </>
    ),
  },
  /* 剪影：對著亮天空曝光，暗部全部壓成平面的黑 */
  silhouette: {
    colors: ["#FFB35C"],
    filter: (v, c) => `url(#${c.id}) saturate(${1 + 0.25 * v})`,
    svg: (c) => (
      <filter id={c.id} colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values={LUM} result="l" />
        <feComponentTransfer in="l" result="m">
          <feFuncR type="table" tableValues="0 0 0 .04 .7 1.1 1.2" />
          <feFuncG type="table" tableValues="0 0 0 .04 .7 1.1 1.2" />
          <feFuncB type="table" tableValues="0 0 0 .04 .7 1.1 1.2" />
        </feComponentTransfer>
        <feComposite in="SourceGraphic" in2="m" operator="arithmetic" k1={1.1} result="s" />
        <Mix in="s" />
      </filter>
    ),
    layers: (c) => <Fade style={{ background: `linear-gradient(to bottom, ${alpha(c.colors[0], 0.4)}, transparent 55%)`, mixBlendMode: "screen" }} />,
  },
  /* 分割光：光從正側面來，畫面在中線一分為二 */
  "split-lighting": {
    colors: ["#FFE7C2"],
    angle: 270,
    filter: (v) => `contrast(${1 + 0.15 * v})`,
    layers: (c) => <Light angle={c.angle} from={47} to={53} shadow={0.78} tint={c.colors[0]} />,
  },
  /* 林布蘭光：側上方 45 度，暗側留一塊小小的三角亮區 */
  rembrandt: {
    colors: ["#FFD9A8"],
    angle: 315,
    filter: (v) => `contrast(${1 + 0.18 * v}) brightness(${1 - 0.08 * v})`,
    layers: (c) => {
      const rad = ((c.angle + 180) * Math.PI) / 180;
      const x = 50 + Math.sin(rad) * 14;
      const y = 46 - Math.cos(rad) * 4;
      return (
        <>
          <Light angle={c.angle} from={36} to={64} shadow={0.66} tint={c.colors[0]} />
          <Fade style={{ background: `radial-gradient(ellipse 9% 11% at ${x}% ${y}%, ${alpha(c.colors[0], 0.55)}, transparent 70%)`, mixBlendMode: "screen" }} />
        </>
      );
    },
  },
  /* 蝴蝶光：正前上方的光，兩側均勻，下方落一點對稱陰影 */
  butterfly: {
    colors: ["#FFF1DC"],
    angle: 0,
    filter: (v) => `brightness(${1 + 0.05 * v}) contrast(${1 + 0.08 * v})`,
    layers: (c) => (
      <>
        <Light angle={c.angle} from={58} to={100} shadow={0.5} tint={c.colors[0]} />
        <Fade style={{ background: `radial-gradient(ellipse 55% 45% at 50% 0%, ${alpha(c.colors[0], 0.6)}, transparent 70%)`, mixBlendMode: "screen" }} />
      </>
    ),
  },
  /* 黃金時刻：太陽貼近地平線，整體偏橘，亮側被染暖 */
  "golden-hour": {
    colors: ["#FFB547"],
    angle: 270,
    pos: [18, 58],
    filter: (v) => `sepia(${0.32 * v}) saturate(${1 + 0.5 * v}) hue-rotate(${-8 * v}deg) brightness(${1 + 0.04 * v})`,
    layers: (c) => (
      <>
        <Fade style={{ background: `linear-gradient(${c.angle + 180}deg, ${alpha(c.colors[0], 0.75)}, ${alpha(mixHex(c.colors[0], "#7a3b6a", 0.5), 0.45)})`, mixBlendMode: "soft-light" }} />
        <Fade style={{ background: `radial-gradient(ellipse 50% 60% at ${c.pos[0]}% ${c.pos[1]}%, ${alpha(mixHex(c.colors[0], "#ffffff", 0.45), 0.85)}, ${alpha(c.colors[0], 0.25)} 35%, transparent 70%)`, mixBlendMode: "screen" }} />
      </>
    ),
  },
  /* 藍色時刻：日落後整片深藍，只有最亮的燈與窗亮成琥珀色 */
  "blue-hour": {
    colors: ["#FFC75A"],
    filter: (v, c) => `url(#${c.id}) contrast(${1 + 0.05 * v})`,
    svg: (c) => (
      <ToneFilter
        id={c.id}
        mix={0.92}
        stops={["#0d1426", "#141c33", "#1C2439", "#26314f", "#2C3B5E", "#34446B", "#3e5282", "#4A6191", "#5b74a8", "#6a84b8", mixHex(c.colors[0], "#ffffff", 0.2)]}
      />
    ),
    layers: () => <Fade style={{ background: "linear-gradient(to bottom, rgba(44, 59, 94, .35), transparent 60%)", mixBlendMode: "multiply" }} />,
  },
  /* 散景：背景失焦，亮點擴散成大而淡的光圈 */
  bokeh: {
    colors: ["#FFE3A3", "#FFFFFF"],
    layers: (c) => (
      <>
        <Fade>
          {c.copy({ filter: "blur(7px) brightness(1.04)", transform: "scale(1.04)", ...mask(`radial-gradient(ellipse 22% 34% at ${c.focus[0]}% ${c.focus[1]}%, transparent 45%, #000 100%)`) })}
        </Fade>
        {bokehDots.map(([x, y, s], i) => {
          const col = c.colors[i % c.colors.length];
          return (
            <Grow
              key={i}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${s}%`,
                aspectRatio: "1",
                translate: "-50% -50%",
                borderRadius: "9999px",
                background: `radial-gradient(circle, ${alpha(col, 0.35)} 0%, ${alpha(col, 0.5)} 62%, ${alpha(col, 0.15)} 70%, transparent 72%)`,
                mixBlendMode: "screen",
              }}
            />
          );
        })}
      </>
    ),
  },
  /* 移軸：上下兩條帶模糊，只留中間清楚，看起來像模型 */
  "tilt-shift": {
    filter: (v) => `saturate(${1 + 0.4 * v}) contrast(${1 + 0.06 * v})`,
    layers: (c) => {
      const [a, b] = c.band;
      return (
        <Fade>
          {c.copy({
            filter: "blur(5px) saturate(1.4)",
            transform: "scale(1.03)",
            ...mask(`linear-gradient(to bottom, #000 0%, #000 ${Math.max(0, a - 14)}%, transparent ${a}%, transparent ${b}%, #000 ${Math.min(100, b + 14)}%, #000 100%)`),
          })}
        </Fade>
      );
    },
  },
  /* 長時間曝光：入夜，移動的東西拉成殘影，車燈畫出光軌 */
  "long-exposure": {
    colors: ["#FF3B30", "#FFFFFF", "#FFC75A"],
    filter: (v) => `brightness(${1 - 0.42 * v}) saturate(${1 - 0.2 * v}) contrast(${1 + 0.1 * v})`,
    layers: (c) => (
      <>
        {[1, 2, 3, 4].map((k) => (
          <Fade key={k} style={{ mixBlendMode: "lighten" }}>
            {c.copy({ transform: `translateX(${k * 2.2}%)`, opacity: 0.22 - k * 0.03, filter: "brightness(.6)" })}
          </Fade>
        ))}
        <Fade style={{ background: "linear-gradient(to bottom, rgba(26, 36, 80, .45), rgba(26, 36, 80, .2))", mixBlendMode: "multiply" }} />
        {[
          { y: 80, h: 0.9, col: c.colors[0] },
          { y: 86, h: 0.7, col: c.colors[1] ?? c.colors[0] },
          { y: 90, h: 0.7, col: c.colors[2] ?? c.colors[0] },
        ].map((l, i) => (
          <GrowX
            key={i}
            style={{
              left: i === 0 ? "4%" : "10%",
              right: i === 0 ? "8%" : "3%",
              top: `${l.y}%`,
              height: `${l.h}%`,
              minHeight: 2,
              borderRadius: 9999,
              background: `linear-gradient(90deg, transparent, ${l.col} 25%, ${l.col})`,
              boxShadow: `0 0 10px 2px ${alpha(l.col, 0.6)}`,
            }}
          />
        ))}
      </>
    ),
  },
  /* 追焦：主體清楚，背景往橫向拉成流線 */
  "panning-shot": {
    svg: (c) => (
      <filter id={`${c.id}-pan`} x="-10%" width="120%">
        <feGaussianBlur stdDeviation="22 0" edgeMode="duplicate" />
      </filter>
    ),
    layers: (c) => (
      <Fade>
        {c.copy({ filter: `url(#${c.id}-pan)`, ...mask(`radial-gradient(ellipse 18% 30% at ${c.focus[0]}% ${c.focus[1]}%, transparent 55%, #000 100%)`) })}
      </Fade>
    ),
  },
  /* 鏡頭光斑：光源周圍放射光芒，一串光點穿過畫面中心到對角 */
  "lens-flare": {
    colors: ["#FFE3A3", "#9FD8FF"],
    pos: [78, 20],
    filter: (v) => `contrast(${1 - 0.08 * v}) brightness(${1 + 0.05 * v})`,
    layers: (c) => {
      const [lx, ly] = c.pos;
      const [warm, cool] = [c.colors[0], c.colors[1] ?? c.colors[0]];
      return (
        <>
          <Fade style={{ background: `radial-gradient(ellipse 60% 70% at ${lx}% ${ly}%, ${alpha("#ffffff", 0.95)} 0%, ${alpha(warm, 0.8)} 4%, ${alpha(warm, 0.3)} 16%, transparent 55%)`, mixBlendMode: "screen" }} />
          <Fade
            style={{
              background: `repeating-conic-gradient(from 0deg at ${lx}% ${ly}%, ${alpha("#ffffff", 0.4)} 0deg 1.2deg, transparent 1.2deg 14deg)`,
              mixBlendMode: "screen",
              ...mask(`radial-gradient(ellipse 30% 40% at ${lx}% ${ly}%, #000 0%, transparent 100%)`),
            }}
          />
          {flareBits.map((f, i) => {
            const x = lx + (50 - lx) * f.k;
            const y = ly + (50 - ly) * f.k;
            const col = i % 2 ? cool : warm;
            const shape: CSSProperties =
              f.shape === "ring"
                ? { borderRadius: 9999, border: `2px solid ${alpha(col, 0.35)}`, background: `radial-gradient(circle, transparent 60%, ${alpha(col, 0.18)})` }
                : f.shape === "hex"
                  ? { clipPath: hexClip, background: alpha(col, 0.28) }
                  : { borderRadius: 9999, background: alpha(col, 0.5) };
            return (
              <Grow
                key={i}
                from={0.5}
                style={{ left: `${x}%`, top: `${y}%`, width: `${f.size}%`, aspectRatio: "1", translate: "-50% -50%", mixBlendMode: "screen", ...shape }}
              />
            );
          })}
        </>
      );
    },
  },
  /* 魚眼：畫面中央鼓起，直線往外彎，四角不動 */
  fisheye: {
    measure: true,
    filter: (v, c) => (c.size.w ? `url(#${c.id})` : ""),
    svg: (c) => {
      const { w, h } = c.size;
      if (!w || !h) return null;
      return (
        <filter id={c.id} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x={0} y={0} width={w} height={h} colorInterpolationFilters="sRGB">
          <feImage href={bulgeMap(w, h, 0)} x={0} y={0} width={w} height={h} preserveAspectRatio="none" result="mx" />
          <feImage href={bulgeMap(w, h, 1)} x={0} y={0} width={w} height={h} preserveAspectRatio="none" result="my" />
          <feDisplacementMap in="SourceGraphic" in2="mx" scale={0} data-scale={w * 0.42} xChannelSelector="R" yChannelSelector="G" result="dx" />
          <feDisplacementMap in="dx" in2="my" scale={0} data-scale={h * 0.42} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      );
    },
  },
  /* 色收差：紅、綠、藍三色錯開，邊緣出現紅與青的色邊 */
  "chromatic-aberration": {
    measure: true,
    filter: (v, c) => `url(#${c.id})`,
    svg: (c) => {
      const d = Math.max(3, (c.size.w || 400) * 0.012);
      return (
        <filter id={c.id} colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r" />
          <feOffset in="r" dx={0} dy={0} data-dx={-d} data-dy={-d * 0.25} result="ro" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b" />
          <feOffset in="b" dx={0} dy={0} data-dx={d} data-dy={d * 0.25} result="bo" />
          <feComposite in="ro" in2="g" operator="arithmetic" k2={1} k3={1} result="rg" />
          <feComposite in="rg" in2="bo" operator="arithmetic" k2={1} k3={1} />
        </filter>
      );
    },
  },
  /* 暗角：四角平滑變暗，中央保持明亮 */
  vignette: {
    colors: ["#07070c"],
    layers: (c) => <Fade style={{ background: `radial-gradient(ellipse 75% 75% at 50% 50%, transparent 40%, ${alpha(c.colors[0], 0.45)} 75%, ${alpha(c.colors[0], 0.85)} 100%)` }} />,
  },
  /* 高調：明亮、近白、陰影很淡 */
  "high-key": {
    colors: ["#FFFFFF"],
    filter: (v) => `brightness(${1 + 0.32 * v}) contrast(${1 - 0.38 * v}) saturate(${1 - 0.3 * v})`,
    layers: (c) => <Fade style={{ background: alpha(c.colors[0], 0.18), mixBlendMode: "screen" }} />,
  },
  /* 低調：大部分沉入黑暗，只留側光照到的一道亮邊 */
  "low-key": {
    colors: ["#FFE7C2"],
    angle: 90,
    filter: (v) => `brightness(${1 - 0.5 * v}) contrast(${1 + 0.45 * v}) saturate(${1 - 0.25 * v})`,
    layers: (c) => (
      <>
        <Fade style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, rgba(0, 0, 0, .7) 100%)" }} />
        <Fade style={{ background: `linear-gradient(${c.angle + 180}deg, ${alpha(c.colors[0], 0.55)}, transparent 30%)`, mixBlendMode: "soft-light" }} />
      </>
    ),
  },
  /* 黑白：抽掉顏色，只用明暗讀形狀 */
  "black-and-white": {
    filter: (v) => `grayscale(${v}) contrast(${1 + 0.12 * v})`,
  },
  /* 雙色調：整張圖只剩暗部與亮部兩個顏色之間的漸層 */
  duotone: {
    colors: ["#1F2A5C", "#FF9FB2"],
    filter: (v, c) => `url(#${c.id})`,
    svg: (c) => {
      const [dark, light] = c.colors;
      const stops = Array.from({ length: 8 }, (_, i) => mixHex(dark, light ?? dark, Math.pow(i / 7, 1.4)));
      return <ToneFilter id={c.id} stops={stops} />;
    },
  },
  /* 青橘調色：暗部與中間調偏青，亮部偏橘的互補色對比 */
  "teal-and-orange": {
    colors: ["#2F7F84", "#FF8A3D"],
    filter: (v, c) => `saturate(${1 + 0.15 * v}) url(#${c.id}) contrast(${1 + 0.06 * v})`,
    svg: (c) => {
      const [teal, orange] = c.colors;
      const o = orange ?? teal;
      const stops = [mixHex("#000000", teal, 0.4), mixHex("#000000", teal, 0.75), teal, mixHex(teal, "#ffffff", 0.45), mixHex(o, "#ffffff", 0.3), o];
      return <ToneFilter id={c.id} stops={stops} mix={0.6} />;
    },
  },
  /* 底片顆粒：細顆粒蓋滿畫面，色彩略偏暖奶油色 */
  "film-grain": {
    colors: ["#F2DDBE"],
    filter: (v) => `sepia(${0.12 * v}) contrast(${1 + 0.05 * v})`,
    layers: (c) => (
      <>
        <Fade style={{ background: alpha(c.colors[0], 0.16) }} />
        <Fade className="overflow-hidden">
          <Grain running={c.running} />
        </Fade>
      </>
    ),
  },
  /* 漏光：從右緣滲入一道暖光，內側淡黃、外緣偏紅，緩慢擺動 */
  "light-leak": {
    colors: ["#FFD089", "#FF3B30"],
    filter: (v) => `contrast(${1 - 0.05 * v}) saturate(${1 + 0.08 * v})`,
    layers: (c) => (
      <Fade className="overflow-hidden">
        <Leak colors={[c.colors[0], c.colors[1] ?? c.colors[0]]} running={c.running} />
      </Fade>
    ),
  },
  /* 雙重曝光：背景變白，第二張圖只出現在主體的剪影裡 */
  "double-exposure": {
    filter: (v) => `grayscale(${v}) contrast(${1 + 0.9 * v}) brightness(${1 + 0.22 * v})`,
    layers: (c) =>
      c.secondSrc ? (
        <Fade style={{ mixBlendMode: "screen" }}>
          <img src={c.secondSrc} alt="" draggable={false} className="absolute inset-0 size-full object-cover select-none" />
        </Fade>
      ) : null,
  },
};

/* ---------- 主元件 ---------- */

export function PhotoLook({
  effect = "black-and-white",
  src,
  alt = "",
  children,
  intensity = 1,
  trigger = "mount",
  invert = false,
  duration,
  delay = 0,
  colors,
  lightAngle,
  lightPosition,
  focusPoint = [50, 58],
  focusBand = [42, 68],
  secondSrc,
  live = true,
  className,
  contentClassName,
}: PhotoLookProps) {
  const spec = specs[effect] ?? specs["black-and-white"];
  const reduce = useReducedMotion() ?? false;
  const rawId = useId();
  const id = `pl-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const frameRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLElement | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(frameRef, { amount: 0.25 });
  const inViewOnce = useInView(frameRef, { amount: 0.35, once: true });
  const [hovered, setHovered] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const target = Math.min(1, Math.max(0, intensity));
  const startOn = trigger === "always" || (reduce && (trigger !== "hover" || invert));
  const t = useMotionValue(startOn ? target : 0);

  // 量外框尺寸（只有需要像素尺寸的效果才量）
  useEffect(() => {
    if (!spec.measure || !frameRef.current) return;
    const el = frameRef.current;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      const h = Math.round(entry.contentRect.height);
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [spec.measure]);

  // 依 trigger 決定強度要往哪裡走
  useEffect(() => {
    let goal: number;
    if (trigger === "always") goal = target;
    else if (trigger === "hover") goal = hovered !== invert ? target : 0;
    else if (trigger === "inView") goal = inViewOnce ? target : 0;
    else goal = target; // mount、loop
    if (reduce) {
      t.set(goal);
      return;
    }
    if (trigger === "loop") {
      if (!inView) return; // 離開畫面時停在原地
      const c = animate(t, [0, target], {
        duration: duration ?? 2.4,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror",
        delay,
      });
      return () => c.stop();
    }
    if (trigger === "always") {
      t.set(goal);
      return;
    }
    const c = animate(t, goal, {
      duration: duration ?? (trigger === "hover" ? 0.6 : 1.4),
      ease,
      delay: trigger === "hover" ? 0 : delay,
    });
    return () => c.stop();
  }, [trigger, target, hovered, invert, inView, inViewOnce, reduce, duration, delay, t]);

  const ctx: Ctx = {
    id,
    colors: colors && colors.length ? colors : (spec.colors ?? ["#ffffff"]),
    angle: lightAngle ?? spec.angle ?? 270,
    pos: lightPosition ?? spec.pos ?? [50, 30],
    focus: focusPoint,
    band: focusBand,
    size,
    running: live && inView && !reduce,
    secondSrc: secondSrc ?? src,
    copy: (style, key) =>
      src ? (
        <img key={key} src={src} alt="" draggable={false} className={cn("absolute inset-0 size-full object-cover select-none", contentClassName)} style={style} />
      ) : (
        <div key={key} inert className={cn("absolute inset-0", contentClassName)} style={style}>
          {children}
        </div>
      ),
  };

  // 把強度寫進 CSS filter 與 SVG 屬性（不經過 React render）
  const filterFn = spec.filter;
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  useEffect(() => {
    const apply = (v: number) => {
      const base = baseRef.current;
      if (base) base.style.filter = filterFn && v > 0.001 ? filterFn(v, ctxRef.current) : "";
      const svg = svgRef.current;
      if (!svg) return;
      svg.querySelectorAll("[data-mix]").forEach((el) => {
        const m = Number(el.getAttribute("data-mix")) * v;
        el.setAttribute("k2", String(m));
        el.setAttribute("k3", String(1 - m));
      });
      svg.querySelectorAll("[data-scale]").forEach((el) => el.setAttribute("scale", String(Number(el.getAttribute("data-scale")) * v)));
      svg.querySelectorAll("[data-dx]").forEach((el) => {
        el.setAttribute("dx", String(Number(el.getAttribute("data-dx")) * v));
        el.setAttribute("dy", String(Number(el.getAttribute("data-dy") ?? 0) * v));
      });
    };
    apply(t.get());
    return t.on("change", apply);
  }, [t, filterFn, effect, size.w, size.h, colors, lightAngle]);

  const hoverProps =
    trigger === "hover"
      ? {
          onPointerEnter: () => setHovered(true),
          onPointerLeave: () => setHovered(false),
          onFocus: () => setHovered(true),
          onBlur: () => setHovered(false),
        }
      : {};

  return (
    <TContext.Provider value={t}>
      <div
        ref={frameRef}
        data-look={effect}
        className={cn("relative isolate overflow-hidden rounded-xl", src && "aspect-[4/3] bg-muted", className)}
        {...hoverProps}
      >
        {spec.svg && (
          <svg ref={svgRef} aria-hidden width="0" height="0" className="pointer-events-none absolute size-0 overflow-hidden">
            <defs>{spec.svg(ctx)}</defs>
          </svg>
        )}
        {src ? (
          <img
            ref={(el) => {
              baseRef.current = el;
            }}
            src={src}
            alt={alt}
            draggable={false}
            className={cn("absolute inset-0 size-full object-cover select-none", contentClassName)}
          />
        ) : (
          <div
            ref={(el) => {
              baseRef.current = el;
            }}
            className={cn("relative", contentClassName)}
          >
            {children}
          </div>
        )}
        {spec.layers?.(ctx)}
      </div>
    </TContext.Provider>
  );
}
