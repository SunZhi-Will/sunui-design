"use client";

import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Transition,
} from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Every preset the backdrop can draw. Pick one with the `preset` prop. */
export const gradientPresets = [
  "mesh",
  "grain",
  "silk",
  "aurora",
  "flow",
  "floral",
  "horizon",
  "maze",
  "plasma",
] as const;

export type GradientPreset = (typeof gradientPresets)[number];

/**
 * Named palettes. Index 0 is the base (background) colour, the rest are accents.
 * Pass your own list to `colors` to use brand colours instead.
 */
export const gradientPalettes = {
  pastel: ["#fbf6ef", "#f59a94", "#6fcab7", "#86aef0", "#f2c75c"],
  dusk: ["#141a33", "#3d4a8a", "#e07a5f", "#f2cc8f", "#f4f1de"],
  ember: ["#1f0b07", "#b8360c", "#f2711c", "#f9b92b", "#ffe4a3"],
  lagoon: ["#03131c", "#0f4c5c", "#1fa2a6", "#8ee3c8", "#e8f7f3"],
  violet: ["#0a0714", "#3a1d8f", "#7c5cff", "#c4b5fd", "#f5f3ff"],
  meadow: ["#f4f6ec", "#9ccc86", "#4f9a63", "#f4c45f", "#e88a5e"],
  noir: ["#09090b", "#27272a", "#52525b", "#a1a1aa", "#fafafa"],
} as const satisfies Record<string, readonly string[]>;

export type GradientPalette = keyof typeof gradientPalettes;

const presetDefaults: Record<GradientPreset, { palette: GradientPalette; grain: number }> = {
  mesh: { palette: "pastel", grain: 0.12 },
  grain: { palette: "dusk", grain: 0.5 },
  silk: { palette: "noir", grain: 0.1 },
  aurora: { palette: "lagoon", grain: 0.15 },
  flow: { palette: "ember", grain: 0.3 },
  floral: { palette: "meadow", grain: 0.25 },
  horizon: { palette: "violet", grain: 0.08 },
  maze: { palette: "dusk", grain: 0.1 },
  plasma: { palette: "lagoon", grain: 0.18 },
};

export type GradientBackdropProps = {
  /** Which gradient to draw. Default "mesh". */
  preset?: GradientPreset;
  /** A named palette. Ignored when `colors` is set. Each preset has its own default. */
  palette?: GradientPalette;
  /** Your own colours, 3 to 5 CSS colours (hex, rgb, oklch or var(--token)). Index 0 is the base. */
  colors?: readonly string[];
  /** Film grain strength from 0 to 1. Each preset has its own default. */
  grain?: number;
  /** Animation speed multiplier. Default 1. */
  speed?: number;
  /** Set false for a still frame. Reduced motion always gives a still frame. */
  animate?: boolean;
  /** Adds a soft light that follows the pointer. */
  interactive?: boolean;
  className?: string;
  /** Content drawn on top of the gradient. */
  children?: ReactNode;
};

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

type LayerProps = { c: string[]; active: boolean; speed: number };

/** A looping transition while active, an instant jump while still. */
function loop(active: boolean, seconds: number, speed: number, delay = 0): Transition {
  if (!active) return { duration: 0 };
  return { duration: seconds / speed, delay: delay / speed, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" };
}

function spin(active: boolean, seconds: number, speed: number): Transition {
  if (!active) return { duration: 0 };
  return { duration: seconds / speed, repeat: Infinity, ease: "linear" };
}

/** Pick an accent, wrapping when the palette is short. Index 0 is the base, so accents start at 1. */
function accent(c: string[], i: number) {
  const accents = c.length > 1 ? c.slice(1) : c;
  return accents[i % accents.length];
}

function Blob({
  color,
  style,
  path,
  seconds,
  delay = 0,
  active,
  speed,
  blur = 48,
}: {
  color: string;
  style: CSSProperties;
  path: { x: string[]; y: string[]; scale?: number[] };
  seconds: number;
  delay?: number;
  active: boolean;
  speed: number;
  blur?: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        ...style,
        background: `radial-gradient(circle at center, ${color} 0%, ${color} 22%, transparent 70%)`,
        filter: `blur(${blur}px)`,
      }}
      initial={false}
      animate={active ? path : { x: path.x[0], y: path.y[0], scale: path.scale?.[0] ?? 1 }}
      transition={loop(active, seconds, speed, delay)}
    />
  );
}

/* Mesh: soft colour pools drifting over a light base, like a SaaS hero. */
function MeshLayer({ c, active, speed }: LayerProps) {
  const pools = [
    { style: { left: "-15%", top: "-20%", width: "70%", aspectRatio: "1" }, path: { x: ["0%", "18%", "6%"], y: ["0%", "12%", "-6%"] } },
    { style: { right: "-20%", top: "-10%", width: "65%", aspectRatio: "1" }, path: { x: ["0%", "-14%", "4%"], y: ["0%", "16%", "8%"] } },
    { style: { left: "10%", bottom: "-35%", width: "75%", aspectRatio: "1" }, path: { x: ["0%", "12%", "-8%"], y: ["0%", "-14%", "-4%"] } },
    { style: { right: "-10%", bottom: "-30%", width: "55%", aspectRatio: "1" }, path: { x: ["0%", "-10%", "-18%"], y: ["0%", "-8%", "6%"] } },
  ];
  return (
    <>
      {pools.map((p, i) => (
        <Blob key={i} color={accent(c, i)} style={p.style} path={p.path} seconds={14 + i * 3} delay={i} active={active} speed={speed} />
      ))}
    </>
  );
}

/* Grain: big still washes of colour that only breathe; the film grain does the work. */
function GrainLayer({ c, active, speed }: LayerProps) {
  return (
    <>
      <motion.div
        className="absolute inset-[-20%]"
        style={{
          background: `radial-gradient(60% 55% at 20% 30%, ${accent(c, 1)} 0%, transparent 70%), radial-gradient(55% 60% at 80% 70%, ${accent(c, 2)} 0%, transparent 70%), radial-gradient(45% 45% at 70% 15%, ${accent(c, 0)} 0%, transparent 70%)`,
        }}
        initial={false}
        animate={active ? { scale: [1, 1.08, 1.02], rotate: [0, 4, -2] } : { scale: 1, rotate: 0 }}
        transition={loop(active, 18, speed)}
      />
    </>
  );
}

/* Silk: long blurred folds sliding past each other with a satin sheen. */
function SilkLayer({ c, active, speed }: LayerProps) {
  const folds = [
    { top: "-5%", rotate: -14, color: accent(c, 3) },
    { top: "25%", rotate: -10, color: accent(c, 1) },
    { top: "50%", rotate: -16, color: accent(c, 2) },
    { top: "72%", rotate: -12, color: accent(c, 3) },
  ];
  return (
    <>
      {folds.map((f, i) => (
        <motion.div
          key={i}
          className="absolute left-[-30%] h-[34%] w-[160%] rounded-[50%]"
          style={{
            top: f.top,
            background: `linear-gradient(90deg, transparent 0%, ${f.color} 35%, ${f.color} 55%, transparent 100%)`,
            filter: "blur(26px)",
            opacity: 0.85,
          }}
          initial={false}
          animate={
            active
              ? { rotate: [f.rotate, f.rotate + 5, f.rotate - 2], x: ["0%", i % 2 ? "-8%" : "8%", "0%"], scaleY: [1, 1.25, 0.9] }
              : { rotate: f.rotate, x: "0%", scaleY: 1 }
          }
          transition={loop(active, 12 + i * 2.5, speed, i * 0.8)}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{ backgroundImage: "repeating-linear-gradient(-12deg, #fff 0 1px, transparent 1px 6px)" }}
      />
    </>
  );
}

/* Aurora: banded curtains drifting sideways, faded towards the ground. */
function AuroraLayer({ c, active, speed }: LayerProps) {
  const bands = `repeating-linear-gradient(100deg, ${accent(c, 0)} 8%, ${accent(c, 1)} 14%, ${accent(c, 2)} 20%, ${accent(c, 3)} 26%, ${accent(c, 0)} 32%)`;
  return (
    <div
      className="absolute inset-0"
      style={{
        maskImage: "radial-gradient(ellipse 110% 85% at 50% 0%, #000 35%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse 110% 85% at 50% 0%, #000 35%, transparent 80%)",
      }}
    >
      <motion.div
        className="absolute inset-[-10%]"
        style={{ backgroundImage: bands, backgroundSize: "300% 100%", filter: "blur(14px)", opacity: 0.9 }}
        initial={false}
        animate={active ? { backgroundPosition: ["0% 50%", "100% 50%"] } : { backgroundPosition: "0% 50%" }}
        transition={loop(active, 22, speed)}
      />
      <motion.div
        className="absolute inset-[-10%] mix-blend-screen"
        style={{ backgroundImage: bands, backgroundSize: "200% 100%", filter: "blur(10px)", opacity: 0.35 }}
        initial={false}
        animate={active ? { backgroundPosition: ["100% 50%", "0% 50%"] } : { backgroundPosition: "100% 50%" }}
        transition={loop(active, 30, speed)}
      />
    </div>
  );
}

/* Flow: a warm colour wheel turning slowly behind heavy blur. */
function FlowLayer({ c, active, speed }: LayerProps) {
  const ring = [0, 1, 2, 3].map((i) => accent(c, i));
  return (
    <>
      <motion.div
        className="absolute top-1/2 left-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2"
        style={{ background: `conic-gradient(from 0deg, ${ring.join(", ")}, ${ring[0]})`, filter: "blur(60px)" }}
        initial={false}
        animate={active ? { rotate: 360 } : { rotate: 0 }}
        transition={spin(active, 28, speed)}
      />
      <Blob
        color={c[0]}
        style={{ left: "30%", top: "25%", width: "45%", aspectRatio: "1" }}
        path={{ x: ["-20%", "25%", "0%"], y: ["10%", "-15%", "20%"], scale: [0.9, 1.2, 1] }}
        seconds={16}
        active={active}
        speed={speed}
        blur={40}
      />
    </>
  );
}

/* Floral: soft petals around a centre that slowly open and turn. */
function FloralLayer({ c, active, speed }: LayerProps) {
  const petals = 6;
  return (
    <motion.div
      className="absolute top-1/2 left-1/2 size-0"
      initial={false}
      animate={active ? { rotate: [0, 40, 15], scale: [0.95, 1.08, 1] } : { rotate: 0, scale: 1 }}
      transition={loop(active, 20, speed)}
    >
      {Array.from({ length: petals }, (_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 left-0 h-[34cqmin] w-[58cqmin] origin-left -translate-y-1/2 rounded-[50%]"
          style={{
            rotate: (360 / petals) * i,
            background: `radial-gradient(closest-side, ${accent(c, i)} 0%, ${accent(c, i)} 40%, transparent 100%)`,
            filter: "blur(18px)",
            opacity: 0.9,
          }}
          initial={false}
          animate={active ? { scaleX: [0.8, 1.15, 0.95] } : { scaleX: 1 }}
          transition={loop(active, 9 + (i % 3) * 2, speed, i * 0.6)}
        />
      ))}
    </motion.div>
  );
}

/* Horizon: a glowing floor of light with fine vertical streaks rising from it. */
function HorizonLayer({ c, active, speed }: LayerProps) {
  const fade = "linear-gradient(to top, #000 0%, rgb(0 0 0 / 0.6) 25%, transparent 60%)";
  return (
    <>
      <motion.div
        className="absolute inset-x-[-20%] bottom-[-35%] h-[80%] rounded-[50%]"
        style={{
          background: `radial-gradient(closest-side, ${accent(c, 2)} 0%, ${accent(c, 1)} 45%, transparent 100%)`,
          filter: "blur(30px)",
        }}
        initial={false}
        animate={active ? { opacity: [0.75, 1, 0.85], scaleX: [1, 1.08, 1] } : { opacity: 0.9, scaleX: 1 }}
        transition={loop(active, 6, speed)}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${accent(c, 2)} 0 2px, transparent 2px 7px, ${accent(c, 1)} 7px 8px, transparent 8px 13px)`,
          backgroundSize: "260px 100%",
          maskImage: fade,
          WebkitMaskImage: fade,
          opacity: 0.55,
        }}
        initial={false}
        animate={active ? { backgroundPosition: ["0px 0px", "260px 0px"] } : { backgroundPosition: "0px 0px" }}
        transition={spin(active, 40, speed)}
      />
      <div
        className="absolute inset-x-0 bottom-[18%] h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent(c, 3)}, transparent)`, boxShadow: `0 0 24px 4px ${accent(c, 2)}` }}
      />
    </>
  );
}

/* Maze: fine crossing lines lit by a slowly moving colour field. */
function MazeLayer({ c, active, speed }: LayerProps) {
  const field = `linear-gradient(120deg, ${accent(c, 0)}, ${accent(c, 1)}, ${accent(c, 2)}, ${accent(c, 3)}, ${accent(c, 0)})`;
  const vignette = "radial-gradient(ellipse 75% 70% at 50% 50%, #000 20%, transparent 80%)";
  const lines = (angle: number, gap: number): CSSProperties => {
    const m = `repeating-linear-gradient(${angle}deg, #000 0 1px, transparent 1px ${gap}px)`;
    return { maskImage: m, WebkitMaskImage: m };
  };
  return (
    <div className="absolute inset-0" style={{ maskImage: vignette, WebkitMaskImage: vignette }}>
      {[
        { angle: 45, gap: 12, opacity: 0.9 },
        { angle: -45, gap: 24, opacity: 0.5 },
        { angle: 90, gap: 48, opacity: 0.35 },
      ].map((l, i) => (
        <div key={i} className="absolute inset-0" style={{ ...lines(l.angle, l.gap), opacity: l.opacity }}>
          <motion.div
            className="absolute inset-0"
            style={{ backgroundImage: field, backgroundSize: "300% 300%" }}
            initial={false}
            animate={active ? { backgroundPosition: ["0% 0%", "100% 100%"] } : { backgroundPosition: "0% 0%" }}
            transition={loop(active, 16 + i * 4, speed)}
          />
        </div>
      ))}
    </div>
  );
}

/* Plasma: a real-time sine field coloured through the palette, drawn small and scaled up. */
function PlasmaLayer({ c, active, speed }: LayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const key = c.join("|");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const W = 96;
    const H = 60;
    canvas.width = W;
    canvas.height = H;
    const stops = resolveRgb(canvas, c);
    const lut = buildLut(stops);
    const img = ctx.createImageData(W, H);
    let raf = 0;
    let t = 0;
    let last = performance.now();

    const draw = () => {
      const d = img.data;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const dx = x - W / 2;
          const dy = y - H / 2;
          const v =
            Math.sin(x * 0.07 + t) +
            Math.sin(y * 0.11 - t * 0.8) +
            Math.sin((x * 0.05 + y * 0.06) + t * 1.2) +
            Math.sin(Math.sqrt(dx * dx + dy * dy) * 0.12 - t * 0.6);
          const idx = Math.max(0, Math.min(255, Math.round(((v + 4) / 8) * 255))) * 3;
          const o = (y * W + x) * 4;
          d[o] = lut[idx];
          d[o + 1] = lut[idx + 1];
          d[o + 2] = lut[idx + 2];
          d[o + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (!document.hidden) {
        t += (dt / 1000) * 0.5 * speed;
        draw();
      }
      raf = requestAnimationFrame(tick);
    };

    draw();
    if (active) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `key` stands in for the colour list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active, speed]);

  return <canvas ref={canvasRef} className="absolute inset-[-4%] size-[108%]" style={{ filter: "blur(14px) saturate(1.1)" }} />;
}

/** Resolve any CSS colour (including var(--token) and oklch) to RGB through the canvas itself. */
function resolveRgb(el: HTMLElement, colors: string[]) {
  const probe = document.createElement("span");
  probe.style.display = "none";
  el.parentElement?.appendChild(probe);
  const px = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const out = colors.map((color) => {
    probe.style.color = "";
    probe.style.color = color;
    const computed = getComputedStyle(probe).color || "#000";
    if (!px) return [0, 0, 0] as const;
    px.clearRect(0, 0, 1, 1);
    px.fillStyle = "#000";
    px.fillStyle = computed;
    px.fillRect(0, 0, 1, 1);
    const [r, g, b] = px.getImageData(0, 0, 1, 1).data;
    return [r, g, b] as const;
  });
  probe.remove();
  return out;
}

function buildLut(stops: (readonly [number, number, number])[]) {
  const lut = new Uint8ClampedArray(256 * 3);
  const n = Math.max(1, stops.length - 1);
  for (let i = 0; i < 256; i++) {
    const p = (i / 255) * n;
    const a = Math.min(n, Math.floor(p));
    const b = Math.min(n, a + 1);
    const f = p - a;
    const s = f * f * (3 - 2 * f);
    for (let k = 0; k < 3; k++) lut[i * 3 + k] = stops[a][k] + (stops[b][k] - stops[a][k]) * s;
  }
  return lut;
}

const layers: Record<GradientPreset, (p: LayerProps) => ReactNode> = {
  mesh: MeshLayer,
  grain: GrainLayer,
  silk: SilkLayer,
  aurora: AuroraLayer,
  flow: FlowLayer,
  floral: FloralLayer,
  horizon: HorizonLayer,
  maze: MazeLayer,
  plasma: PlasmaLayer,
};

/**
 * A code-drawn gradient backdrop. Nine presets, palette or brand colours, optional film grain
 * and pointer light. Content passed as children sits on top.
 */
export function GradientBackdrop({
  preset = "mesh",
  palette,
  colors,
  grain,
  speed = 1,
  animate = true,
  interactive = false,
  className,
  children,
}: GradientBackdropProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "100px" });
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const active = animate && !reduced && inView && visible;

  const defaults = presetDefaults[preset];
  const c = [...(colors && colors.length > 0 ? colors : gradientPalettes[palette ?? defaults.palette])];
  const grainAmount = Math.max(0, Math.min(1, grain ?? defaults.grain));
  const Layer = layers[preset];

  const glowOpacity = useMotionValue(0);
  const px = useMotionValue(50);
  const py = useMotionValue(50);
  const sx = useSpring(px, { stiffness: 120, damping: 20 });
  const sy = useSpring(py, { stiffness: 120, damping: 20 });
  const glow = useMotionTemplate`radial-gradient(circle at ${sx}% ${sy}%, ${accent(c, c.length - 2)} 0%, transparent 35%)`;

  return (
    <div
      ref={ref}
      className={cn("relative isolate overflow-hidden", className)}
      style={{ backgroundColor: c[0] }}
      onPointerMove={
        interactive
          ? (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              px.set(((e.clientX - r.left) / r.width) * 100);
              py.set(((e.clientY - r.top) / r.height) * 100);
              glowOpacity.set(0.6);
            }
          : undefined
      }
      onPointerLeave={interactive ? () => glowOpacity.set(0) : undefined}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [container-type:size]">
        <Layer c={c} active={active} speed={Math.max(0.05, speed)} />
        {interactive && !reduced ? (
          <motion.div className="absolute inset-0 mix-blend-soft-light transition-opacity duration-300" style={{ backgroundImage: glow, opacity: glowOpacity }} />
        ) : null}
        {grainAmount > 0 ? (
          <div
            className="absolute inset-0 mix-blend-overlay"
            style={{ backgroundImage: NOISE, backgroundSize: "180px 180px", opacity: grainAmount }}
          />
        ) : null}
      </div>
      {children}
    </div>
  );
}

function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}
