"use client";

import {
  animate,
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  usePresence,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 全部轉場名稱；demo 與文件都從這裡讀 */
export const sceneTransitions = [
  "cut",
  "cross-dissolve",
  "fade-to-black",
  "morph-cut",
  "wipe",
  "push",
  "cover",
  "whip-pan",
  "smash-cut",
  "iris",
  "circle-reveal",
  "star-reveal",
  "blinds",
  "bands",
  "liquid",
  "zoom-through",
  "cube",
  "page-curl",
  "doors",
  "pixelate",
  "shatter",
] as const;

export type SceneTransitionName = (typeof sceneTransitions)[number];
/** 新畫面移動的方向：left 代表從右邊進來、往左推 */
export type SceneDirection = "left" | "right" | "up" | "down";

interface Ctx {
  w: number;
  h: number;
  /** 起點（%），圓形、星形、碎裂、穿越用 */
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  colors: string[];
  sceneId: string;
}

interface StyleOut {
  opacity?: number;
  clipPath?: string;
  transform?: string;
  filter?: string;
  transformOrigin?: string;
}

interface DecorProps {
  p: MotionValue<number>;
  q: MotionValue<number>;
  ctx: Ctx;
  exiting: boolean;
}

interface TransitionDef {
  /** p：進場進度、q：離場進度，都是 0 到 1 */
  style: (p: number, q: number, c: Ctx) => StyleOut;
  /** 離場畫面疊在進場畫面上面（遮罩關閉、翻頁、碎裂這類） */
  exitOnTop?: boolean;
  /** 轉場期間畫面後方的底色 */
  backdrop?: boolean;
  duration: number;
  ease?: "linear";
  Decor?: ComponentType<DecorProps>;
  /** 裝飾層畫在內容下面（液體先流下來，內容跟在後面） */
  decorBelow?: boolean;
  /** 離場時用自己的方式畫內容（例如切成碎片） */
  Exit?: ComponentType<DecorProps & { children: ReactNode }>;
}

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const poly = (pts: [number, number][]) => `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",")})`;

/** 可重現的亂數，碎片每次形狀一樣 */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ───────────── 各轉場的裝飾層 ───────────── */

function Bands({ p, ctx }: DecorProps) {
  const colors = ctx.colors.length ? ctx.colors : ["currentColor"];
  const n = Math.max(3, colors.length);
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col overflow-hidden">
      {Array.from({ length: n }, (_, i) => (
        <Band key={i} p={p} i={i} n={n} color={colors[i % colors.length]} />
      ))}
    </div>
  );
}

function Band({ p, i, n, color }: { p: MotionValue<number>; i: number; n: number; color: string }) {
  // 每條色帶錯開一點：先蓋過畫面，再往另一邊離開
  const x = useTransform(p, (v) => {
    const d = (i / n) * 0.18;
    const cover = inOut(seg(v, d, 0.5));
    const leave = inOut(seg(v, 0.5 + d, 1));
    return `${(-100 + cover * 100 + leave * 100).toFixed(2)}%`;
  });
  return <motion.div className="flex-1" style={{ x, background: color }} />;
}

function liquidFront(t: number, w: number, h: number) {
  const strength = Math.sin(Math.PI * clamp(t));
  const y0 = -0.15 * h + t * 1.35 * h;
  const drips = [0.08, 0.22, 0.37, 0.5, 0.63, 0.79, 0.92].map((x, i) => ({ cx: x * w, dw: w * (0.055 + (i % 3) * 0.015), len: h * (0.12 + ((i * 37) % 5) * 0.06) }));
  const pts: [number, number][] = [
    [0, 0],
    [w, 0],
  ];
  const steps = 64;
  for (let s = 0; s <= steps; s++) {
    const x = w - (s / steps) * w;
    let y = y0 + strength * (Math.sin(x / 38 + t * 9) * 13 + Math.sin(x / 17 - t * 5) * 8);
    for (const d of drips) {
      const u = (x - d.cx) / (d.dw / 2);
      if (Math.abs(u) < 1) y += d.len * (0.25 + 0.9 * strength) * Math.sqrt(1 - u * u);
    }
    pts.push([x, y]);
  }
  return poly(pts);
}

function LiquidLayer({ p, ctx }: DecorProps) {
  const clipPath = useTransform(p, (v) => liquidFront(seg(v, 0, 0.75), ctx.w, ctx.h));
  const opacity = useTransform(p, (v) => (v >= 1 ? 0 : 1));
  return <motion.div className="pointer-events-none absolute inset-0" style={{ clipPath, opacity, background: ctx.colors[0] ?? "currentColor" }} />;
}

/** 翻頁：被折起來的那一角，是切掉區域對折線的鏡像 */
function curlCut(q: number, w: number, h: number) {
  const k = (w + h) * (1 - q);
  const rect: [number, number][] = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  const keep: [number, number][] = [];
  const cut: [number, number][] = [];
  for (let i = 0; i < 4; i++) {
    const a = rect[i];
    const b = rect[(i + 1) % 4];
    const fa = a[0] + a[1] - k;
    const fb = b[0] + b[1] - k;
    if (fa <= 0) keep.push(a);
    else cut.push(a);
    if (fa * fb < 0) {
      const t = fa / (fa - fb);
      const m: [number, number] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      keep.push(m);
      cut.push(m);
    }
  }
  const flap = cut.map(([x, y]) => [k - y, k - x] as [number, number]);
  return { keep, flap };
}

function CurlFlap({ q, ctx, exiting }: DecorProps) {
  const clipPath = useTransform(q, (v) => {
    const { flap } = curlCut(inOut(v), ctx.w, ctx.h);
    return flap.length > 2 ? poly(flap) : "polygon(0 0,0 0,0 0)";
  });
  if (!exiting) return null;
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-10"
      style={{ clipPath, background: `linear-gradient(135deg, rgb(255 255 255 / 0.35), rgb(0 0 0 / 0.25)), ${ctx.colors[0] ?? "#efe9dc"}` }}
    />
  );
}

function PixelFilter({ p, q, ctx }: DecorProps) {
  const flood = useRef<SVGFEFloodElement>(null);
  const comp = useRef<SVGFECompositeElement>(null);
  const morph = useRef<SVGFEMorphologyElement>(null);
  const apply = useCallback(() => {
    // 離場時格子越來越粗，進場時越來越細；最粗的那一刻換畫面
    const qv = q.get();
    const pv = p.get();
    const t = qv > 0 ? seg(qv, 0, 0.5) : 1 - seg(pv, 0.5, 1);
    const size = Math.max(1, Math.round(2 + t * 34));
    flood.current?.setAttribute("x", String(size / 2));
    flood.current?.setAttribute("y", String(size / 2));
    comp.current?.setAttribute("width", String(size));
    comp.current?.setAttribute("height", String(size));
    morph.current?.setAttribute("radius", String(size / 2));
  }, [p, q]);
  useMotionValueEvent(p, "change", apply);
  useMotionValueEvent(q, "change", apply);
  useEffect(apply, [apply]);
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute size-0">
      <filter id={`${ctx.sceneId}-px`} x="0" y="0" width="100%" height="100%">
        <feFlood ref={flood} x="4" y="4" height="1" width="1" />
        <feComposite ref={comp} width="8" height="8" />
        <feTile result="a" />
        <feComposite in="SourceGraphic" in2="a" operator="in" />
        <feMorphology ref={morph} operator="dilate" radius="4" />
      </filter>
    </svg>
  );
}

function Doors({ q, ctx, children }: DecorProps & { children: ReactNode }) {
  const horizontal = ctx.vy === 0;
  const a = useTransform(q, (v) => `${(-inOut(v) * 100).toFixed(2)}%`);
  const b = useTransform(q, (v) => `${(inOut(v) * 100).toFixed(2)}%`);
  return (
    <>
      <motion.div className="absolute inset-0" style={{ clipPath: horizontal ? "inset(0 50% 0 0)" : "inset(0 0 50% 0)", [horizontal ? "x" : "y"]: a }}>
        {children}
      </motion.div>
      <motion.div className="absolute inset-0" style={{ clipPath: horizontal ? "inset(0 0 0 50%)" : "inset(50% 0 0 0)", [horizontal ? "x" : "y"]: b }}>
        {children}
      </motion.div>
    </>
  );
}

const SHATTER_TIME = 1.5;

function Shatter({ q, ctx, children }: DecorProps & { children: ReactNode }) {
  const shards = useMemo(() => {
    const r = rng(7);
    const cx = (ctx.ox / 100) * ctx.w;
    const cy = (ctx.oy / 100) * ctx.h;
    const diag = Math.hypot(ctx.w, ctx.h);
    const radii = [0, 0.09, 0.22, 0.42, 1.3].map((k) => k * diag);
    const sectors = 10;
    const angles = Array.from({ length: sectors }, (_, i) => ((i + (r() - 0.5) * 0.6) / sectors) * Math.PI * 2);
    const at = (ring: number, s: number): [number, number] => {
      const a = angles[s % sectors] + ring * 0.13;
      return [cx + Math.cos(a) * radii[ring], cy + Math.sin(a) * radii[ring]];
    };
    const list: { pts: [number, number][]; vx: number; vy: number; spin: number; start: number }[] = [];
    const scale = ctx.w / 540;
    for (let ring = 0; ring < 4; ring++) {
      for (let s = 0; s < sectors; s++) {
        const pts = [at(ring, s), at(ring, s + 1), at(ring + 1, s + 1), at(ring + 1, s)];
        const mx = pts.reduce((n, p) => n + p[0], 0) / 4 - cx;
        const my = pts.reduce((n, p) => n + p[1], 0) / 4 - cy;
        const len = Math.hypot(mx, my) || 1;
        const speed = (220 + r() * 260) * scale;
        list.push({
          pts,
          vx: (mx / len) * speed,
          vy: (my / len) * speed * 0.7 - r() * 120 * scale,
          spin: (r() - 0.5) * 8,
          start: 0.82 + ring * 0.035 + r() * 0.03,
        });
      }
    }
    return list;
  }, [ctx.w, ctx.h, ctx.ox, ctx.oy]);
  const cx = (ctx.ox / 100) * ctx.w;
  const cy = (ctx.oy / 100) * ctx.h;
  const cracks = useTransform(q, (v) => clamp((v * SHATTER_TIME - 0.3) / 0.35));
  const crackOpacity = useTransform(q, (v) => (v * SHATTER_TIME > 0.84 ? 0 : 1));
  return (
    <>
      {shards.map((s, i) => (
        <Shard key={i} q={q} shard={s} g={1300 * (ctx.w / 540)}>
          {children}
        </Shard>
      ))}
      <motion.svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" style={{ opacity: crackOpacity }}>
        {shards.slice(0, 30).map((s, i) => (
          <motion.line
            key={i}
            x1={cx}
            y1={cy}
            x2={s.pts[2][0]}
            y2={s.pts[2][1]}
            stroke="white"
            strokeWidth={1.5}
            style={{ pathLength: cracks }}
          />
        ))}
      </motion.svg>
    </>
  );
}

function Shard({ q, shard, g, children }: { q: MotionValue<number>; shard: { pts: [number, number][]; vx: number; vy: number; spin: number; start: number }; g: number; children: ReactNode }) {
  const t = (v: number) => Math.max(0, v * SHATTER_TIME - shard.start);
  const cx = shard.pts.reduce((n, p) => n + p[0], 0) / 4;
  const cy = shard.pts.reduce((n, p) => n + p[1], 0) / 4;
  const transform = useTransform(q, (v) => {
    const d = t(v);
    return `translate(${(shard.vx * d).toFixed(1)}px, ${(shard.vy * d + 0.5 * g * d * d).toFixed(1)}px) rotate(${(shard.spin * d).toFixed(3)}rad) scale(${(1 - Math.min(0.35, d * 0.35)).toFixed(3)})`;
  });
  const opacity = useTransform(q, (v) => 1 - clamp((t(v) - 0.55) / 0.45));
  return (
    <motion.div className="absolute inset-0" style={{ clipPath: poly(shard.pts), transform, opacity, transformOrigin: `${cx}px ${cy}px` }}>
      {children}
    </motion.div>
  );
}

/* ───────────── 轉場定義 ───────────── */

const circleTo = (c: Ctx) => Math.hypot(Math.max(c.ox, 100 - c.ox) * c.w / 100, Math.max(c.oy, 100 - c.oy) * c.h / 100);

function star(cx: number, cy: number, r: number, rot: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return poly(pts);
}

const defs: Record<SceneTransitionName, TransitionDef> = {
  cut: { duration: 0, style: (p, q) => ({ opacity: q > 0 ? 0 : 1 }) },
  "cross-dissolve": { duration: 0.9, style: (p) => ({ opacity: p }) },
  "fade-to-black": { duration: 1.2, backdrop: true, style: (p, q) => (q > 0 ? { opacity: 1 - seg(q, 0, 0.5) } : { opacity: seg(p, 0.5, 1) }) },
  "morph-cut": {
    duration: 0.7,
    style: (p, q) => (q > 0 ? { opacity: 1 - q, filter: `blur(${(q * 6).toFixed(2)}px)` } : { opacity: p, filter: `blur(${((1 - p) * 6).toFixed(2)}px)`, transform: `scale(${(1.02 - 0.02 * p).toFixed(4)})` }),
  },
  wipe: {
    duration: 0.9,
    style: (p, q, c) => {
      if (q > 0) return {};
      const r = ((1 - p) * 100).toFixed(2);
      if (c.vx < 0) return { clipPath: `inset(0 0 0 ${r}%)` };
      if (c.vx > 0) return { clipPath: `inset(0 ${r}% 0 0)` };
      if (c.vy < 0) return { clipPath: `inset(${r}% 0 0 0)` };
      return { clipPath: `inset(0 0 ${r}% 0)` };
    },
  },
  push: {
    duration: 0.8,
    style: (p, q, c) => {
      const k = q > 0 ? q : -(1 - p);
      return { transform: `translate(${(c.vx * k * 100).toFixed(2)}%, ${(c.vy * k * 100).toFixed(2)}%)` };
    },
  },
  cover: {
    duration: 0.8,
    style: (p, q, c) =>
      q > 0
        ? { transform: `translate(${(c.vx * q * 25).toFixed(2)}%, ${(c.vy * q * 25).toFixed(2)}%)`, filter: `brightness(${(1 - 0.45 * q).toFixed(3)})` }
        : { transform: `translate(${(-c.vx * (1 - p) * 100).toFixed(2)}%, ${(-c.vy * (1 - p) * 100).toFixed(2)}%)` },
  },
  "whip-pan": {
    duration: 0.8,
    style: (p, q, c) => {
      if (q > 0) {
        const k = seg(q, 0, 0.5);
        return { opacity: q < 0.5 ? 1 : 0, transform: `translate(${(c.vx * k * 40).toFixed(2)}%, ${(c.vy * k * 40).toFixed(2)}%) skewX(${(c.vx * k * -8).toFixed(2)}deg)`, filter: `blur(${(k * 22).toFixed(1)}px)` };
      }
      const k = 1 - seg(p, 0.5, 1);
      return { opacity: p < 0.5 ? 0 : 1, transform: `translate(${(-c.vx * k * 40).toFixed(2)}%, ${(-c.vy * k * 40).toFixed(2)}%) skewX(${(c.vx * k * -8).toFixed(2)}deg)`, filter: `blur(${(k * 22).toFixed(1)}px)` };
    },
  },
  "smash-cut": {
    duration: 0.45,
    ease: "linear",
    style: (p, q) => {
      if (q > 0) return { opacity: 0 };
      const k = 1 - p;
      return { transform: `translate(${(Math.sin(p * 46) * k * k * 14).toFixed(2)}px, ${(Math.cos(p * 39) * k * k * 10).toFixed(2)}px) scale(${(1 + k * k * 0.05).toFixed(4)})` };
    },
  },
  iris: {
    duration: 1.3,
    backdrop: true,
    exitOnTop: true,
    style: (p, q, c) => {
      const R = Math.hypot(c.w, c.h) / 2;
      if (q > 0) return { clipPath: `circle(${((1 - seg(q, 0, 0.5)) * R).toFixed(1)}px at 50% 50%)` };
      return { clipPath: `circle(${(seg(p, 0.5, 1) * R).toFixed(1)}px at 50% 50%)` };
    },
  },
  "circle-reveal": { duration: 1, style: (p, q, c) => (q > 0 ? {} : { clipPath: `circle(${(p * circleTo(c)).toFixed(1)}px at ${c.ox}% ${c.oy}%)` }) },
  "star-reveal": {
    duration: 1.2,
    style: (p, q, c) => (q > 0 || p >= 1 ? {} : { clipPath: star((c.ox / 100) * c.w, (c.oy / 100) * c.h, p * 2.4 * Math.max(c.w, c.h), p * 1.2) }),
  },
  blinds: {
    duration: 1,
    style: (p, q, c) => {
      if (q > 0 || p >= 1) return {};
      const n = 8;
      const vertical = c.vy === 0;
      const size = (vertical ? c.w : c.h) / n;
      const full = vertical ? c.h : c.w;
      const pts: [number, number][] = [];
      for (let i = 0; i < n; i++) {
        const a = i * size + (size / 2) * (1 - p);
        const b = i * size + (size / 2) * (1 + p);
        if (vertical) pts.push([a, full], [a, 0], [b, 0], [b, full]);
        else pts.push([full, a], [0, a], [0, b], [full, b]);
      }
      return { clipPath: poly(pts) };
    },
  },
  bands: { duration: 1.2, Decor: Bands, style: (p, q) => (q > 0 ? {} : { opacity: p < 0.5 ? 0 : 1 }) },
  liquid: {
    duration: 1.5,
    Decor: LiquidLayer,
    decorBelow: true,
    style: (p, q, c) => (q > 0 || p >= 1 ? {} : { clipPath: liquidFront(seg(p, 0.25, 1), c.w, c.h) }),
  },
  "zoom-through": {
    duration: 1.1,
    exitOnTop: true,
    style: (p, q, c) =>
      q > 0
        ? { transformOrigin: `${c.ox}% ${c.oy}%`, transform: `scale(${(1 + Math.pow(q, 3) * 9).toFixed(3)})`, opacity: 1 - seg(q, 0.55, 0.9) }
        : { transform: `scale(${(0.82 + 0.18 * p).toFixed(4)})`, opacity: seg(p, 0.35, 0.7) },
  },
  cube: {
    duration: 1,
    style: (p, q, c) => {
      const horizontal = c.vy === 0;
      const s = horizontal ? c.vx : c.vy;
      if (q > 0) {
        return horizontal
          ? { transformOrigin: s < 0 ? "100% 50%" : "0% 50%", transform: `perspective(1400px) translateX(${(s * q * 100).toFixed(2)}%) rotateY(${(s * 90 * q).toFixed(2)}deg)`, filter: `brightness(${(1 - 0.4 * q).toFixed(3)})` }
          : { transformOrigin: s < 0 ? "50% 100%" : "50% 0%", transform: `perspective(1400px) translateY(${(s * q * 100).toFixed(2)}%) rotateX(${(-s * 90 * q).toFixed(2)}deg)`, filter: `brightness(${(1 - 0.4 * q).toFixed(3)})` };
      }
      const k = 1 - p;
      return horizontal
        ? { transformOrigin: s < 0 ? "0% 50%" : "100% 50%", transform: `perspective(1400px) translateX(${(-s * k * 100).toFixed(2)}%) rotateY(${(-s * 90 * k).toFixed(2)}deg)`, filter: `brightness(${(1 - 0.4 * k).toFixed(3)})` }
        : { transformOrigin: s < 0 ? "50% 0%" : "50% 100%", transform: `perspective(1400px) translateY(${(-s * k * 100).toFixed(2)}%) rotateX(${(s * 90 * k).toFixed(2)}deg)`, filter: `brightness(${(1 - 0.4 * k).toFixed(3)})` };
    },
  },
  "page-curl": {
    duration: 1.2,
    exitOnTop: true,
    Decor: CurlFlap,
    style: (p, q, c) => {
      if (q <= 0) return {};
      const { keep } = curlCut(inOut(q), c.w, c.h);
      return { clipPath: keep.length > 2 ? poly(keep) : "polygon(0 0,0 0,0 0)" };
    },
  },
  doors: { duration: 1, exitOnTop: true, Exit: Doors, style: () => ({}) },
  pixelate: {
    duration: 1.2,
    Decor: PixelFilter,
    style: (p, q, c) => {
      const url = `url(#${c.sceneId}-px)`;
      if (q > 0) return { opacity: q < 0.5 ? 1 : 0, filter: url };
      return { opacity: p < 0.5 ? 0 : 1, filter: p >= 1 ? "none" : url };
    },
  },
  shatter: { duration: SHATTER_TIME, ease: "linear", exitOnTop: true, Exit: Shatter, style: () => ({}) },
};

/* ───────────── 單一畫面 ───────────── */

const EASE = [0.65, 0, 0.35, 1] as const;

function Scene({ def, ctx, first, duration, children }: { def: TransitionDef; ctx: Ctx; first: boolean; duration: number; children: ReactNode }) {
  const [isPresent, safeToRemove] = usePresence();
  const sceneId = useId().replace(/:/g, "");
  const p = useMotionValue(first || duration === 0 ? 1 : 0);
  const q = useMotionValue(0);
  const ctxRef = useRef<Ctx>(ctx);
  ctxRef.current = { ...ctx, sceneId };
  const transition = def.ease === "linear" ? { duration, ease: "linear" as const } : { duration, ease: EASE };

  useEffect(() => {
    if (first || duration === 0) return;
    const c = animate(p, 1, transition);
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isPresent) return;
    if (duration === 0) {
      safeToRemove?.();
      return;
    }
    const c = animate(q, 1, { ...transition, onComplete: () => safeToRemove?.() });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent]);

  const read = (key: keyof StyleOut, fallback: string | number) => () => def.style(p.get(), q.get(), ctxRef.current)[key] ?? fallback;
  const opacity = useTransform(read("opacity", 1) as () => number);
  const clipPath = useTransform(read("clipPath", "none") as () => string);
  const transform = useTransform(read("transform", "none") as () => string);
  const filter = useTransform(read("filter", "none") as () => string);
  const transformOrigin = useTransform(read("transformOrigin", "50% 50%") as () => string);

  const zIndex = isPresent ? (def.exitOnTop ? 1 : 2) : def.exitOnTop ? 3 : 1;
  const Exit = !isPresent ? def.Exit : undefined;
  const Decor = def.Decor;
  const dp = { p, q, ctx: ctxRef.current, exiting: !isPresent };

  return (
    <div className="absolute inset-0" style={{ zIndex }} aria-hidden={!isPresent || undefined}>
      {Decor && def.decorBelow && <Decor {...dp} />}
      {Exit ? (
        <Exit {...dp}>{children}</Exit>
      ) : (
        <motion.div className="absolute inset-0" style={{ opacity, clipPath, transform, filter, transformOrigin }}>
          {children}
        </motion.div>
      )}
      {Decor && !def.decorBelow && <Decor {...dp} />}
    </div>
  );
}

/* ───────────── 對外元件 ───────────── */

export interface SceneTransitionProps {
  /** 換這個值就觸發轉場，例如目前第幾張 */
  activeKey: string | number;
  /** 目前要顯示的畫面 */
  children: ReactNode;
  transition?: SceneTransitionName;
  /** 秒；不給時用每種轉場的建議長度 */
  duration?: number;
  /** 推移、擦除、方塊、百葉、快甩的方向（新畫面往哪邊移動） */
  direction?: SceneDirection;
  /** 圓形、星形、穿越、碎裂的起點（%），例如從按鈕或太陽的位置開始 */
  origin?: { x: number; y: number };
  /** bands 的色帶顏色、liquid 的液體顏色、page-curl 紙背的顏色 */
  colors?: string[];
  /** fade-to-black、iris 的底色 */
  backdrop?: string;
  className?: string;
}

const vectors: Record<SceneDirection, [number, number]> = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

export function SceneTransition({
  activeKey,
  children,
  transition = "cross-dissolve",
  duration,
  direction = "left",
  origin = { x: 50, y: 50 },
  colors = [],
  backdrop = "#000",
  className,
}: SceneTransitionProps) {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const firstKey = useRef(activeKey);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 減少動態：一律直接切換，資訊不遺失
  const def = defs[reduce ? "cut" : transition];
  const d = reduce ? 0 : duration ?? def.duration;
  const [vx, vy] = vectors[direction];
  const ctx: Ctx = { ...size, ox: origin.x, oy: origin.y, vx, vy, colors, sceneId: "" };

  return (
    <div ref={stageRef} className={cn("relative isolate overflow-hidden", className)}>
      {def.backdrop && <div aria-hidden="true" className="absolute inset-0" style={{ background: backdrop }} />}
      <AnimatePresence initial={false}>
        <Scene key={activeKey} def={def} ctx={ctx} first={activeKey === firstKey.current} duration={d}>
          {children}
        </Scene>
      </AnimatePresence>
    </div>
  );
}

/* ───────────── 自動輪播 ───────────── */

export interface SceneSlideshowProps extends Omit<SceneTransitionProps, "activeKey" | "children"> {
  scenes: ReactNode[];
  /** loop：自動輪播；inView：進入畫面才輪播；click：點一下換下一張 */
  trigger?: "loop" | "inView" | "click";
  /** 每張停留的毫秒數 */
  interval?: number;
  /** 顯示上一張、下一張與圓點 */
  controls?: boolean;
  labels?: { previous?: string; next?: string; goTo?: (n: number) => string };
  onIndexChange?: (index: number) => void;
}

export function SceneSlideshow({ scenes, trigger = "loop", interval = 3200, controls = false, labels = {}, onIndexChange, className, ...rest }: SceneSlideshowProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const n = scenes.length;

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const go = useCallback(
    (next: number) => {
      const i = (next + n) % n;
      setIndex(i);
      onIndexChange?.(i);
    },
    [n, onIndexChange],
  );

  const auto = trigger !== "click" && !reduce && inView && visible && n > 1;
  useEffect(() => {
    if (!auto) return;
    const id = window.setTimeout(() => go(index + 1), interval);
    return () => window.clearTimeout(id);
  }, [auto, index, interval, go]);

  const L = { previous: "Previous scene", next: "Next scene", goTo: (k: number) => `Scene ${k}`, ...labels };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <SceneTransition {...rest} activeKey={index} className="size-full">
        {trigger === "click" ? (
          <button type="button" aria-label={L.next} onClick={() => go(index + 1)} className="block size-full cursor-pointer text-left">
            {scenes[index]}
          </button>
        ) : (
          scenes[index]
        )}
      </SceneTransition>
      {controls && n > 1 && (
        <div className="absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-2">
          <button type="button" aria-label={L.previous} onClick={() => go(index - 1)} className="grid size-7 place-items-center rounded-full bg-background/80 text-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-4" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          {scenes.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={L.goTo(i + 1)}
              aria-current={i === index || undefined}
              onClick={() => go(i)}
              className={cn("size-2 rounded-full transition-colors", i === index ? "bg-foreground" : "bg-foreground/30")}
            />
          ))}
          <button type="button" aria-label={L.next} onClick={() => go(index + 1)} className="grid size-7 place-items-center rounded-full bg-background/80 text-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-4" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/** 給自訂播放器用：回傳每種轉場建議的秒數 */
export function getTransitionDuration(name: SceneTransitionName) {
  return defs[name].duration;
}
