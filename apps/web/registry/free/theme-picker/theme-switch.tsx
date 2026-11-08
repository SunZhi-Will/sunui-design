"use client";

import { motion, useMotionTemplate, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Theme switch: a glass key on a recessed track. A rim of light runs  */
/* around the key as it slides, and its pixel sun breaks apart and     */
/* lands as a pixel moon. Pair it with useThemeMode() from             */
/* theme-picker.tsx:                                                   */
/*   const { resolved, setMode } = useThemeMode();                     */
/*   <ThemeSwitch value={resolved} onValueChange={setMode} />          */
/* ------------------------------------------------------------------ */

export type ThemeSwitchValue = "light" | "dark";

type Pixel = { x: number; y: number; a: number };

/** The key is this many pixel cells across. The glyphs use about half of it. */
const CELLS = 32;

/** Glyph pixels in cell units, centered on the key. a is pixel opacity. */
function buildGlyphs() {
  const sun: Pixel[] = [];
  for (let y = -3.5; y <= 3.5; y++) {
    for (let x = -3.5; x <= 3.5; x++) {
      if (Math.abs(x) === 3.5 && Math.abs(y) === 3.5) continue;
      sun.push({ x, y, a: 1 });
    }
  }
  for (const d of [7, 8, 9]) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) sun.push({ x: dx * d, y: dy * d, a: 1 });
  }
  for (const d of [5, 6]) {
    for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) sun.push({ x: dx * d, y: dy * d, a: 1 });
  }

  const moon: Pixel[] = [];
  const push = (x: number, y: number, a: number) => moon.push({ x: x - 1, y: y + 1, a });
  for (let y = -6; y <= 6; y++) {
    for (let x = -6; x <= 6; x++) {
      const inDisc = x * x + y * y <= 6.3 ** 2;
      const inShadow = (x - 2.6) ** 2 + (y + 2.2) ** 2 <= 5.4 ** 2;
      if (inDisc && !inShadow) push(x, y, 1);
      else if (inDisc && (x + y) % 2 === 0) push(x, y, 0.3); // dithered night side of the disc
    }
  }
  // A twinkle star and two specks
  push(7, -7, 1);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) push(7 + dx, -7 + dy, 0.5);
  push(3, -8, 0.7);
  push(7, -4, 0.5);
  return { sun, moon };
}

/** Seeded random, so the server and every render agree. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

type Particle = {
  light: Pixel;
  dark: Pixel;
  /** how far it trails behind, and how far it floats, in cells */
  trail: number;
  float: number;
  sparkle: number;
  /** current state, so a second click mid-flight starts from here */
  x: number;
  y: number;
  a: number;
};

function buildParticles(): Particle[] {
  const { sun, moon } = buildGlyphs();
  const rand = rng(11);
  const n = Math.max(sun.length, moon.length);
  const shuffle = (list: Pixel[]) => {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  // The smaller glyph gets invisible extras on its own pixels, so every particle has a home in both.
  const pad = (list: Pixel[]) => {
    const out = shuffle(list);
    while (out.length < n) {
      const p = list[Math.floor(rand() * list.length)];
      out.push({ x: p.x, y: p.y, a: 0 });
    }
    return out;
  };
  const light = pad(sun);
  const dark = pad(moon);
  return light.map((l, i) => ({
    light: l,
    dark: dark[i],
    trail: 3 + rand() * 7,
    float: -5 + rand() * 7,
    sparkle: rand(),
    x: l.x,
    y: l.y,
    a: l.a,
  }));
}

// The switch shows a specific theme, so its colors are fixed on purpose.
const INK = { light: [92, 86, 80], dark: [246, 243, 236] } as const;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);

function PixelGlyph({ dark, px, reduce }: { dark: boolean; px: number; reduce: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[] | null>(null);
  const first = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    particles.current ??= buildParticles();
    const list = particles.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(px * dpr);
    canvas.height = Math.round(px * dpr);
    const cell = px / CELLS;
    const dot = cell * 0.78;
    const snap = (v: number) => Math.round(v * dpr) / dpr;

    const from = list.map((p) => ({ x: p.x, y: p.y, a: p.a }));
    // The key slides left into dark and right into light. The leading side lands first,
    // the trailing side is left behind as loose sparks.
    const dir = dark ? -1 : 1;
    const inkFrom = dark ? INK.light : INK.dark;
    const inkTo = dark ? INK.dark : INK.light;
    const duration = reduce || first.current ? 0 : 950;
    first.current = false;
    const SPREAD = 0.4;
    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const p = duration ? Math.min((now - start) / duration, 1) : 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, px, px);
      const glow = dark ? p : 1 - p;
      ctx.shadowColor = `rgba(205, 210, 255, ${0.9 * glow})`;
      ctx.shadowBlur = glow > 0.05 ? cell * 1.6 : 0;

      list.forEach((q, i) => {
        const to = dark ? q.dark : q.light;
        const o = from[i];
        const lead = clamp01((to.x * dir + 10) / 20); // 1 on the leading side
        const t = clamp01((p - (1 - lead) * SPREAD) / (1 - SPREAD));
        const e = easeInOut(t);
        const lift = Math.sin(Math.PI * t);
        q.x = o.x + (to.x - o.x) * e - dir * q.trail * lift;
        q.y = o.y + (to.y - o.y) * e + q.float * lift;
        q.a = o.a + (to.a - o.a) * e;
        const alpha = Math.min(q.a * (1 - lift * 0.4) + lift * 0.35 * q.sparkle, 1);
        if (alpha <= 0.01) return;
        // Ink follows the glyph; loose sparks catch the light and flash pale.
        const mix = easeInOut(t);
        // On the pale day key a white spark would vanish, so only the night side flashes.
        const flash = dark ? lift * (q.sparkle > 0.55 ? 0.7 : 0.2) : 0;
        const ch = inkTo.map((v, k) => {
          const base = inkFrom[k] + (v - inkFrom[k]) * mix;
          return Math.round(base + (255 - base) * flash);
        });
        ctx.fillStyle = `rgb(${ch[0]} ${ch[1]} ${ch[2]})`;
        ctx.globalAlpha = alpha;
        const s = dot * (1 - lift * 0.45);
        const cx = px / 2 + q.x * cell;
        const cy = px / 2 + q.y * cell;
        ctx.fillRect(snap(cx - s / 2), snap(cy - s / 2), snap(s), snap(s));
      });
      ctx.globalAlpha = 1;
      if (p < 1) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [dark, px, reduce]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0" style={{ width: px, height: px }} />;
}

const SIZES = {
  sm: { w: 96, h: 50, pad: 4, key: 42, trackRadius: 17, keyRadius: 12, ring: 2, stroke: 1.25 },
  md: { w: 200, h: 104, pad: 7, key: 90, trackRadius: 36, keyRadius: 24, ring: 3, stroke: 2 },
} as const;

/** The rim light sits bottom left at night and top right by day, in conic degrees. */
const RIM_DARK = 205;
const RIM_LIGHT = 50;
const RIM_SPAN = 150;

function Ring({ start, color, inset, stroke, radius, blur, opacity }: { start: MotionValue<number>; color: MotionValue<string>; inset: number; stroke: number; radius: number; blur: number; opacity: number }) {
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        inset: -inset,
        padding: stroke,
        borderRadius: radius + inset,
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
        background: useMotionTemplate`conic-gradient(from ${start}deg, transparent 0deg, ${color} 28deg, ${color} ${RIM_SPAN - 28}deg, transparent ${RIM_SPAN}deg)`,
        // Only the padding shows, so the gradient draws a ring around the key.
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        maskComposite: "exclude",
      }}
    />
  );
}

export interface ThemeSwitchProps {
  value: ThemeSwitchValue;
  onValueChange: (value: ThemeSwitchValue) => void;
  /** sm fits a header, md is the showpiece size */
  size?: "sm" | "md";
  /** Read out with the state, for example "Dark mode" */
  "aria-label"?: string;
  className?: string;
}

export function ThemeSwitch({ value, onValueChange, size = "md", "aria-label": ariaLabel = "Dark mode", className }: ThemeSwitchProps) {
  const reduce = useReducedMotion() ?? false;
  const dark = value === "dark";
  const s = SIZES[size];
  const travel = s.w - s.pad * 2 - s.key;

  // One spring drives the slide, the rim light and the materials: 0 is night, 1 is day.
  const day = useSpring(dark ? 0 : 1, reduce ? { duration: 0 } : { stiffness: 140, damping: 21, mass: 1 });
  useEffect(() => {
    day.set(dark ? 0 : 1);
  }, [dark, day]);

  const x = useTransform(day, [0, 1], [s.pad, s.pad + travel]);
  const night = useTransform(day, [0, 1], [1, 0]);
  const rimStart = useTransform(day, [0, 1], [RIM_DARK - RIM_SPAN / 2, RIM_LIGHT - RIM_SPAN / 2]);
  const rimColor = useTransform(day, [0, 0.5, 1], ["#e6e8ff", "#ffffff", "#ffcf45"]);
  const bloomColor = useTransform(day, [0, 0.5, 1], ["#6a78ff", "#d9ccff", "#ff9410"]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={ariaLabel}
      onClick={() => onValueChange(dark ? "light" : "dark")}
      className={cn("relative isolate shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", className)}
      style={{ width: s.w, height: s.h, borderRadius: s.trackRadius }}
    >
      {/* Track: recessed, pale by day and nearly black at night */}
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          borderRadius: s.trackRadius,
          background: "linear-gradient(180deg, #e4e3e0, #efeeeb)",
          boxShadow: "inset 0 3px 8px rgba(0,0,0,0.14), inset 0 0 0 1px rgba(0,0,0,0.05), 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px rgba(255,255,255,0.5)",
        }}
      />
      <motion.span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          opacity: night,
          borderRadius: s.trackRadius,
          background: "linear-gradient(180deg, #050507, #0e0e14)",
          boxShadow: "inset 0 3px 12px rgba(0,0,0,0.95), inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(0,0,0,0.4)",
        }}
      />

      <motion.span className="absolute left-0 block" initial={false} style={{ x, top: (s.h - s.key) / 2, width: s.key, height: s.key }}>
        <motion.span className="absolute inset-0 block" whileTap={reduce ? undefined : { scale: 0.96 }}>
          {/* Key by day: warm white, lit from the top right */}
          <motion.span
            className="absolute inset-0 overflow-hidden"
            style={{
              opacity: day,
              borderRadius: s.keyRadius,
              background: "radial-gradient(90% 90% at 100% 15%, rgba(255,196,90,0.38), transparent 60%), linear-gradient(160deg, #ffffff 30%, #f5f0e6)",
              boxShadow: "inset 0 1px 0 #ffffff, inset 0 0 0 1px rgba(0,0,0,0.035), 0 8px 18px rgba(60,40,10,0.16), 0 2px 4px rgba(0,0,0,0.06)",
            }}
          />
          {/* Key at night: frosted glass, lit from below */}
          <motion.span
            className="absolute inset-0 overflow-hidden"
            style={{
              opacity: night,
              borderRadius: s.keyRadius,
              background:
                "radial-gradient(110% 70% at 30% 110%, rgba(120,132,255,0.45), transparent 65%), linear-gradient(165deg, rgba(128,128,146,0.62), rgba(52,52,66,0.7) 75%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.32), inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 -1px 0 rgba(200,205,255,0.5), 0 10px 22px rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
            }}
          />
          <span className="absolute inset-0 overflow-hidden" style={{ borderRadius: s.keyRadius }}>
            <PixelGlyph dark={dark} px={s.key} reduce={reduce} />
          </span>
          {/* Rim light, drawn over the key's shadow: a wide bloom, a soft halo and the thin bright line */}
          <Ring start={rimStart} color={bloomColor} inset={s.ring + s.stroke * 3} stroke={s.stroke * 5} radius={s.keyRadius} blur={s.key / 8} opacity={0.6} />
          <Ring start={rimStart} color={rimColor} inset={s.ring + s.stroke * 0.5} stroke={s.stroke * 1.8} radius={s.keyRadius} blur={s.key / 45} opacity={0.5} />
          <Ring start={rimStart} color={rimColor} inset={s.ring} stroke={s.stroke} radius={s.keyRadius} blur={0} opacity={1} />
        </motion.span>
      </motion.span>
    </button>
  );
}
