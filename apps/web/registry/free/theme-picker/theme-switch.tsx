"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Theme switch: a glowing key that slides along a track. Its pixel    */
/* sun breaks into loose pixels on the way and lands as a pixel moon.  */
/* Pair it with useThemeMode() from theme-picker.tsx:                   */
/*   const { resolved, setMode } = useThemeMode();                     */
/*   <ThemeSwitch value={resolved} onValueChange={setMode} />          */
/* ------------------------------------------------------------------ */

export type ThemeSwitchValue = "light" | "dark";

type Pixel = { x: number; y: number; a: number };

const GRID = 13;

/** Both glyphs are built from a 13 by 13 grid. a is pixel opacity. */
function buildGlyphs() {
  const sun = new Map<string, Pixel>();
  const moon = new Map<string, Pixel>();
  const put = (m: Map<string, Pixel>, x: number, y: number, a: number) => {
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return;
    const k = `${x},${y}`;
    m.set(k, { x, y, a: Math.max(a, m.get(k)?.a ?? 0) });
  };
  const c = 6;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if ((x - c) ** 2 + (y - c) ** 2 <= 6.6) put(sun, x, y, 1);
      const inA = (x - 5.6) ** 2 + (y - 6.6) ** 2 <= 4.7 ** 2;
      const inB = (x - 8) ** 2 + (y - 4.6) ** 2 <= 3.8 ** 2;
      if (inA && !inB) put(moon, x, y, 1);
      else if (inA && inB && (x + y) % 2 === 0) put(moon, x, y, 0.3); // dithered night side
    }
  }
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    put(sun, c + 4 * dx, c + 4 * dy, 1);
    put(sun, c + 5 * dx, c + 5 * dy, 0.5);
  }
  for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    put(sun, c + 3 * dx, c + 3 * dy, 1);
    put(sun, c + 4 * dx, c + 4 * dy, 0.5);
  }
  put(moon, 10, 2, 1);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(moon, 10 + dx, 2 + dy, 0.5);
  put(moon, 12, 5, 0.6);
  put(moon, 8, 0, 0.4);
  return { sun: [...sun.values()], moon: [...moon.values()] };
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
  /** where it drifts to halfway, in grid cells */
  jx: number;
  jy: number;
  delay: number;
  flicker: number;
  /** current state, so a second click mid-flight starts from here */
  x: number;
  y: number;
  a: number;
};

function buildParticles(): Particle[] {
  const { sun, moon } = buildGlyphs();
  const rand = rng(7);
  const n = Math.max(sun.length, moon.length);
  const shuffle = (list: Pixel[]) => {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  // The shorter glyph gets invisible extras near its pixels, so every particle has a home in both.
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
  return light.map((l, i) => {
    const angle = rand() * Math.PI * 2;
    const dist = 1.5 + rand() * 3.5;
    return {
      light: l,
      dark: dark[i],
      jx: Math.cos(angle) * dist,
      jy: Math.sin(angle) * dist,
      delay: rand() * 0.18,
      flicker: rand(),
      x: l.x,
      y: l.y,
      a: l.a,
    };
  });
}

// The switch shows a specific theme, so its colors are fixed on purpose.
const INK = { light: [87, 83, 78], dark: [244, 245, 255] } as const;

const SIZES = {
  sm: { w: 80, h: 46, pad: 4, key: 38, radius: 12 },
  md: { w: 120, h: 68, pad: 6, key: 56, radius: 18 },
} as const;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = px * dpr;
    canvas.height = px * dpr;
    const cell = px / GRID;
    const dot = cell * 0.8;

    const from = list.map((p) => ({ x: p.x, y: p.y, a: p.a }));
    const inkFrom = dark ? INK.light : INK.dark;
    const inkTo = dark ? INK.dark : INK.light;
    const duration = reduce || first.current ? 0 : 720;
    first.current = false;
    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const p = duration ? Math.min((now - start) / duration, 1) : 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, px, px);
      const ink = inkTo.map((v, i) => Math.round(inkFrom[i] + (v - inkFrom[i]) * easeInOut(p)));
      ctx.fillStyle = `rgb(${ink[0]} ${ink[1]} ${ink[2]})`;
      // Night pixels glow a little, like the screen behind the glass.
      ctx.shadowColor = dark ? `rgba(190, 200, 255, ${0.85 * p})` : `rgba(190, 200, 255, ${0.85 * (1 - p)})`;
      ctx.shadowBlur = cell * 0.9;
      list.forEach((q, i) => {
        const t = Math.min(Math.max((p - q.delay) / (1 - 0.18), 0), 1);
        const e = easeInOut(t);
        const lift = Math.sin(Math.PI * t);
        const o = from[i];
        const to = dark ? q.dark : q.light;
        q.x = o.x + (to.x - o.x) * e + q.jx * lift;
        q.y = o.y + (to.y - o.y) * e + q.jy * lift;
        q.a = o.a + (to.a - o.a) * e;
        // Loose pixels twinkle while they travel.
        const alpha = q.a * (1 - lift * 0.55 * q.flicker) + lift * 0.25 * q.flicker;
        if (alpha <= 0.01) return;
        ctx.globalAlpha = Math.min(alpha, 1);
        const s = dot * (1 - lift * 0.35);
        ctx.fillRect(q.x * cell + (cell - s) / 2, q.y * cell + (cell - s) / 2, s, s);
      });
      ctx.globalAlpha = 1;
      if (p < 1) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [dark, px, reduce]);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ width: px, height: px }} />;
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
  const keyY = (s.h - s.key) / 2;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={ariaLabel}
      onClick={() => onValueChange(dark ? "light" : "dark")}
      className={cn(
        "relative shrink-0 rounded-full outline-none transition-[background-color,box-shadow] duration-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      style={{
        width: s.w,
        height: s.h,
        borderRadius: s.h / 2.4,
        backgroundColor: dark ? "#0b0b0f" : "#e7e5e1",
        boxShadow: dark
          ? "inset 0 2px 10px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.05), 0 1px 0 rgba(255,255,255,0.06)"
          : "inset 0 2px 8px rgba(0,0,0,0.13), inset 0 0 0 1px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      {/* Sun on the right in daylight, moon on the left at night. */}
      <motion.span
        className="absolute left-0 top-0 block"
        initial={false}
        animate={{ x: s.pad + (dark ? 0 : travel), y: keyY }}
        whileTap={reduce ? undefined : { scale: 0.94 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 26, mass: 0.9 }}
        style={{ width: s.key, height: s.key }}
      >
        {/* Rim light: warm on the outer edge by day, cool underneath at night. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            borderRadius: s.radius,
            opacity: dark ? 0 : 1,
            boxShadow: "3px 1px 0 -0.5px #ffb43c, 5px 2px 16px rgba(255,160,20,0.55)",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            borderRadius: s.radius,
            opacity: dark ? 1 : 0,
            boxShadow: "-2px 3px 0 -0.5px #b4bcff, -4px 6px 20px rgba(110,120,255,0.7)",
          }}
        />
        <span
          className="absolute inset-0 grid place-items-center overflow-hidden transition-[background,box-shadow] duration-500"
          style={{
            borderRadius: s.radius,
            background: dark
              ? "linear-gradient(160deg, rgba(160,162,190,0.42), rgba(70,72,96,0.5))"
              : "linear-gradient(160deg, #ffffff, #f1efea)",
            boxShadow: dark
              ? "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.12), 0 6px 16px rgba(0,0,0,0.6)"
              : "inset 0 1px 0 #ffffff, inset 0 0 0 1px rgba(0,0,0,0.04), 0 6px 14px rgba(0,0,0,0.14)",
          }}
        >
          <PixelGlyph dark={dark} px={Math.round(s.key * 0.56)} reduce={reduce} />
        </span>
      </motion.span>
    </button>
  );
}
