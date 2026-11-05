"use client";

import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

export const backgroundEffects = [
  "aurora",
  "mesh-gradient",
  "grid-pattern",
  "dot-glow",
  "retro-grid",
  "beams",
  "meteors",
  "particles",
  "starfield",
  "waves",
  "ripple-rings",
  "noise-grain",
  "spotlight",
] as const;

export type BackgroundEffect = (typeof backgroundEffects)[number];

/** 預設配色：跟隨主題的 primary，再與 foreground / background 混出兩個層次 */
export const defaultBackgroundColors = [
  "var(--primary)",
  "color-mix(in oklch, var(--primary) 55%, var(--foreground))",
  "color-mix(in oklch, var(--primary) 40%, var(--background))",
];

export interface EffectBackgroundProps {
  effect: BackgroundEffect;
  /** 效果用色，可放任何 CSS 顏色（含 var() 與 color-mix()） */
  colors?: string[];
  /** 速度倍率，1 為預設 */
  speed?: number;
  className?: string;
  /** 疊在效果上方的內容 */
  children?: ReactNode;
}

interface EffectCtx {
  colors: string[];
  speed: number;
  running: boolean;
  reduce: boolean;
  rootRef: RefObject<HTMLDivElement | null>;
}

const keyframes = `
.sui-bg[data-paused] *{animation-play-state:paused!important}
@keyframes sui-bg-curtain{0%,100%{transform:translateX(-12%) skewX(-14deg) scaleY(1);opacity:.5}50%{transform:translateX(14%) skewX(10deg) scaleY(1.25);opacity:.95}}
@keyframes sui-bg-drift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(var(--dx1),var(--dy1)) scale(1.18)}66%{transform:translate(var(--dx2),var(--dy2)) scale(.88)}}
@keyframes sui-bg-floor{to{background-position:0 40px}}
@keyframes sui-bg-beam{from{transform:translateY(-120%)}to{transform:translateY(560%)}}
@keyframes sui-bg-meteor{0%{transform:rotate(-45deg) translateX(0);opacity:0}4%{opacity:1}45%{transform:rotate(-45deg) translateX(-640px);opacity:0}100%{transform:rotate(-45deg) translateX(-640px);opacity:0}}
@keyframes sui-bg-slide{to{transform:translateX(-50%)}}
@keyframes sui-bg-ripple{0%{transform:translate(-50%,-50%) scale(.04);opacity:0}8%{opacity:.9}100%{transform:translate(-50%,-50%) scale(1);opacity:0}}
`;

/** 鋪滿最近的定位父層，效果在底，children 在上 */
export function EffectBackground({ effect, colors, speed = 1, className, children }: EffectBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const inView = useInView(rootRef);
  const visible = usePageVisible();
  const running = inView && visible && !reduce;
  const ctx: EffectCtx = {
    colors: colors && colors.length > 0 ? colors : defaultBackgroundColors,
    speed: Math.max(0.1, speed),
    running,
    reduce,
    rootRef,
  };

  return (
    <div
      ref={rootRef}
      data-paused={running ? undefined : ""}
      className={cn("sui-bg absolute inset-0 isolate overflow-hidden", className)}
    >
      <style href="sunui-background-effects" precedence="default">
        {keyframes}
      </style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {renderEffect(effect, ctx)}
      </div>
      {children !== undefined && <div className="relative h-full w-full">{children}</div>}
    </div>
  );
}

function renderEffect(effect: BackgroundEffect, ctx: EffectCtx) {
  switch (effect) {
    case "aurora":
      return <Aurora {...ctx} />;
    case "mesh-gradient":
      return <MeshGradient {...ctx} />;
    case "grid-pattern":
      return <GridPattern {...ctx} />;
    case "dot-glow":
      return <DotGlow {...ctx} />;
    case "retro-grid":
      return <RetroGrid {...ctx} />;
    case "beams":
      return <Beams {...ctx} />;
    case "meteors":
      return <Meteors {...ctx} />;
    case "particles":
      return <Particles {...ctx} />;
    case "starfield":
      return <Starfield {...ctx} />;
    case "waves":
      return <Waves {...ctx} />;
    case "ripple-rings":
      return <RippleRings {...ctx} />;
    case "noise-grain":
      return <NoiseGrain {...ctx} />;
    case "spotlight":
      return <Spotlight {...ctx} />;
  }
}

/* ---------- 共用工具 ---------- */

const pick = (colors: string[], i: number) => colors[i % colors.length] ?? "currentColor";
const fade = (color: string, pct: number) => `color-mix(in oklch, ${color} ${pct}%, transparent)`;

/** 固定種子的亂數，伺服器與瀏覽器算出一樣的位置，避免 hydration 不一致 */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((s) => (s.w === width && s.h === height ? s : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** CSS 動畫秒數依 speed 縮放 */
const secs = (base: number, speed: number) => `${(base / speed).toFixed(2)}s`;

/* ---------- Canvas 共用 ---------- */

interface CanvasScene {
  resize?(w: number, h: number): void;
  /** dt 為 0 時只重畫目前狀態（靜態影格） */
  frame(ctx: CanvasRenderingContext2D, w: number, h: number, dt: number, colors: string[]): void;
}

/** 把 var() 與 color-mix() 解析成 canvas 讀得懂的顏色 */
function resolveColors(colors: string[], host: HTMLElement) {
  const probe = document.createElement("span");
  probe.style.display = "none";
  host.appendChild(probe);
  const out = colors.map((c) => {
    probe.style.color = "";
    probe.style.color = c;
    return getComputedStyle(probe).color || "currentColor";
  });
  probe.remove();
  return out;
}

function useCanvasScene(
  { running, colors, speed }: Pick<EffectCtx, "running" | "colors" | "speed">,
  create: () => CanvasScene,
  resolution?: number,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CanvasScene | null>(null);
  const resolvedRef = useRef<string[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const speedRef = useRef(speed);
  const runningRef = useRef(running);
  useEffect(() => {
    speedRef.current = speed;
    runningRef.current = running;
  }, [speed, running]);
  if (!sceneRef.current) sceneRef.current = create();
  const colorKey = colors.join("|");

  // 尺寸、devicePixelRatio、主題切換時重新解析顏色
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const scene = sceneRef.current;
    if (!canvas || !ctx || !scene) return;
    const host = canvas.parentElement ?? canvas;
    const repaint = () => scene.frame(ctx, sizeRef.current.w, sizeRef.current.h, 0, resolvedRef.current);
    const recolor = () => {
      resolvedRef.current = resolveColors(colorKey.split("|"), host);
      if (!runningRef.current) repaint();
    };
    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      const r = resolution ?? Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * r));
      canvas.height = Math.max(1, Math.round(rect.height * r));
      ctx.setTransform(r, 0, 0, r, 0, 0);
      sizeRef.current = { w: rect.width, h: rect.height };
      scene.resize?.(rect.width, rect.height);
      repaint();
    };
    resolvedRef.current = resolveColors(colorKey.split("|"), host);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    const mo = new MutationObserver(recolor);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [colorKey, resolution]);

  // 主迴圈：只在可見且非 reduced motion 時跑
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const scene = sceneRef.current;
    if (!running || !ctx || !scene) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) * speedRef.current;
      last = now;
      scene.frame(ctx, sizeRef.current.w, sizeRef.current.h, dt, resolvedRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  return canvasRef;
}

/* ---------- 效果 ---------- */

function Aurora({ colors, speed, reduce }: EffectCtx) {
  const bands = [
    { left: "-15%", width: "60%", c: 0, dur: 14, delay: 0 },
    { left: "20%", width: "55%", c: 1, dur: 19, delay: -7 },
    { left: "50%", width: "60%", c: 2, dur: 16, delay: -3 },
  ];
  return (
    <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_20%,transparent_90%)]">
      {bands.map((b, i) => (
        <div
          key={i}
          className="absolute -top-1/4 h-[95%] rounded-[50%] blur-3xl"
          style={{
            left: b.left,
            width: b.width,
            background: `linear-gradient(to bottom, transparent, ${fade(pick(colors, b.c), 75)} 45%, transparent)`,
            animation: reduce ? undefined : `sui-bg-curtain ${secs(b.dur, speed)} ease-in-out ${secs(b.delay, speed)} infinite`,
            transform: reduce ? "skewX(-8deg)" : undefined,
            opacity: reduce ? 0.7 : undefined,
          }}
        />
      ))}
    </div>
  );
}

function MeshGradient({ colors, speed, reduce }: EffectCtx) {
  const blobs = [
    { cls: "-left-1/4 -top-1/3", c: 0, dur: 17, v: ["30%", "20%", "10%", "40%"] },
    { cls: "-right-1/4 -top-1/4", c: 1, dur: 21, v: ["-25%", "30%", "-40%", "5%"] },
    { cls: "-bottom-1/3 -left-1/5", c: 2, dur: 19, v: ["35%", "-25%", "15%", "-5%"] },
    { cls: "-bottom-1/4 -right-1/5", c: 0, dur: 23, v: ["-30%", "-30%", "-5%", "-45%"] },
  ];
  return (
    <div className="absolute inset-0">
      {blobs.map((b, i) => (
        <div
          key={i}
          className={cn("absolute aspect-square w-[75%] rounded-full blur-2xl", b.cls)}
          style={
            {
              background: `radial-gradient(closest-side, ${fade(pick(colors, b.c), 70)}, transparent)`,
              "--dx1": b.v[0],
              "--dy1": b.v[1],
              "--dx2": b.v[2],
              "--dy2": b.v[3],
              animation: reduce ? undefined : `sui-bg-drift ${secs(b.dur, speed)} ease-in-out ${secs(-i * 3, speed)} infinite`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function GridPattern({ colors, speed, running, reduce, rootRef }: EffectCtx) {
  const cell = 32;
  const size = useElementSize(rootRef);
  const cols = Math.ceil(size.w / cell);
  const total = cols * Math.ceil(size.h / cell);
  const [lit, setLit] = useState<number[]>([]);

  useEffect(() => {
    if (!total) return;
    const rand = seeded(7);
    const n = Math.max(3, Math.round(total / 14));
    setLit(Array.from({ length: n }, () => Math.floor(rand() * total)));
  }, [total]);

  // 每拍換掉幾格，讓亮格隨機遊走
  useEffect(() => {
    if (!running || !total) return;
    const id = setInterval(() => {
      setLit((prev) => {
        const next = [...prev];
        for (let k = 0; k < 2; k++) next[Math.floor(Math.random() * next.length)] = Math.floor(Math.random() * total);
        return next;
      });
    }, 650 / speed);
    return () => clearInterval(id);
  }, [running, total, speed]);

  const line = "color-mix(in oklch, var(--foreground) 12%, transparent)";
  return (
    <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
          backgroundSize: `${cell}px ${cell}px`,
        }}
      />
      <AnimatePresence>
        {Array.from(new Set(lit)).map((idx) => (
          <motion.div
            key={idx}
            className="absolute"
            style={{
              left: (idx % Math.max(1, cols)) * cell + 1,
              top: Math.floor(idx / Math.max(1, cols)) * cell + 1,
              width: cell - 1,
              height: cell - 1,
              background: fade(pick(colors, 0), 30),
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.9 / speed }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function DotGlow(ctx: EffectCtx) {
  const ref = useCanvasScene(ctx, () => {
    let t = 0;
    return {
      frame(c, w, h, dt, colors) {
        t += dt;
        c.clearRect(0, 0, w, h);
        const gap = 16;
        for (let y = gap / 2; y < h; y += gap) {
          for (let x = gap / 2; x < w; x += gap) {
            const hash = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
            const wave = (Math.sin(x * 0.014 + y * 0.009 - t * 1.6 + hash * 0.8) + 1) / 2;
            const g = Math.pow(wave, 8);
            c.globalAlpha = 0.22;
            c.fillStyle = colors[1] ?? "gray";
            c.beginPath();
            c.arc(x, y, 1, 0, Math.PI * 2);
            c.fill();
            if (g > 0.02) {
              c.fillStyle = colors[0] ?? "gray";
              c.globalAlpha = g * 0.25;
              c.beginPath();
              c.arc(x, y, 1 + g * 4, 0, Math.PI * 2);
              c.fill();
              c.globalAlpha = g;
              c.beginPath();
              c.arc(x, y, 1 + g * 1.2, 0, Math.PI * 2);
              c.fill();
            }
          }
        }
        c.globalAlpha = 1;
      },
    };
  });
  return <canvas ref={ref} className="absolute inset-0 size-full" />;
}

function RetroGrid({ colors, speed, reduce }: EffectCtx) {
  const line = fade(pick(colors, 0), 55);
  return (
    <div className="absolute inset-0 [perspective:220px]">
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse 70% 30% at 50% 50%, ${fade(pick(colors, 1), 30)}, transparent)` }}
      />
      <div className="absolute inset-0 [mask-image:linear-gradient(to_top,black_10%,transparent_55%)]">
        <div
          className="absolute -left-1/2 bottom-0 h-[200%] w-[200%] origin-bottom"
          style={{
            transform: "rotateX(75deg)",
            backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            animation: reduce ? undefined : `sui-bg-floor ${secs(1.6, speed)} linear infinite`,
          }}
        />
      </div>
    </div>
  );
}

function Beams({ colors, speed, reduce }: EffectCtx) {
  const rand = seeded(11);
  const beams = Array.from({ length: 8 }, (_, i) => ({
    left: 5 + rand() * 90,
    dur: 5 + rand() * 5,
    delay: -rand() * 10,
    still: rand() * 450,
    c: i % 3,
    width: rand() > 0.7 ? 2 : 1,
  }));
  return (
    <div className="absolute left-1/2 top-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 rotate-[35deg]">
      {beams.map((b, i) => (
        <span
          key={i}
          className="absolute top-0 h-[18%]"
          style={{
            left: `${b.left}%`,
            width: b.width,
            background: `linear-gradient(to bottom, transparent, ${pick(colors, b.c)}, transparent)`,
            animation: reduce ? undefined : `sui-bg-beam ${secs(b.dur, speed)} linear ${secs(b.delay, speed)} infinite`,
            transform: reduce ? `translateY(${b.still}%)` : undefined,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

function Meteors({ colors, speed, reduce }: EffectCtx) {
  const rand = seeded(23);
  const meteors = Array.from({ length: 14 }, () => ({
    left: 15 + rand() * 105,
    top: -15 + rand() * 60,
    dur: 4 + rand() * 5,
    delay: rand() * 8,
    len: 60 + rand() * 60,
  }));
  return (
    <div className="absolute inset-0">
      {meteors.map((m, i) => {
        const c = pick(colors, i % 2);
        return (
          <span
            key={i}
            className="absolute h-px"
            style={{
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: m.len,
              background: `linear-gradient(to right, ${c}, transparent)`,
              animation: reduce ? undefined : `sui-bg-meteor ${secs(m.dur, speed)} linear ${secs(m.delay, speed)} infinite both`,
              transform: reduce ? "rotate(-45deg)" : undefined,
              opacity: reduce ? 0.5 : undefined,
            }}
          >
            <span
              className="absolute left-0 top-1/2 size-1 -translate-y-1/2 rounded-full"
              style={{ background: c, boxShadow: `0 0 6px 1px ${c}` }}
            />
          </span>
        );
      })}
    </div>
  );
}

function Particles(ctx: EffectCtx) {
  const pointer = useRef({ x: 0, y: 0, active: false });
  const ref = useCanvasScene(ctx, () => {
    const pts: { x: number; y: number; vx: number; vy: number }[] = [];
    const rand = seeded(3);
    return {
      resize(w, h) {
        const n = Math.min(110, Math.max(18, Math.round((w * h) / 7000)));
        while (pts.length < n) pts.push({ x: rand() * w, y: rand() * h, vx: (rand() - 0.5) * 24, vy: (rand() - 0.5) * 24 });
        pts.length = n;
        for (const p of pts) {
          p.x = Math.min(p.x, w);
          p.y = Math.min(p.y, h);
        }
      },
      frame(c, w, h, dt, colors) {
        c.clearRect(0, 0, w, h);
        const ptr = pointer.current;
        for (const p of pts) {
          if (ptr.active && dt > 0) {
            const dx = p.x - ptr.x;
            const dy = p.y - ptr.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < 110) {
              // 指標附近的粒子被輕輕推開
              p.x += (dx / d) * (110 - d) * dt * 2;
              p.y += (dy / d) * (110 - d) * dt * 2;
            }
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          p.x = Math.max(0, Math.min(w, p.x));
          p.y = Math.max(0, Math.min(h, p.y));
        }
        c.lineWidth = 1;
        c.strokeStyle = colors[1] ?? "gray";
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i]!;
          for (let j = i + 1; j < pts.length; j++) {
            const b = pts[j]!;
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 100) {
              c.globalAlpha = (1 - d / 100) * 0.45;
              c.beginPath();
              c.moveTo(a.x, a.y);
              c.lineTo(b.x, b.y);
              c.stroke();
            }
          }
          if (ptr.active) {
            const d = Math.hypot(a.x - ptr.x, a.y - ptr.y);
            if (d < 150) {
              c.strokeStyle = colors[0] ?? "gray";
              c.globalAlpha = (1 - d / 150) * 0.8;
              c.beginPath();
              c.moveTo(a.x, a.y);
              c.lineTo(ptr.x, ptr.y);
              c.stroke();
              c.strokeStyle = colors[1] ?? "gray";
            }
          }
        }
        c.globalAlpha = 0.9;
        c.fillStyle = colors[0] ?? "gray";
        for (const p of pts) {
          c.beginPath();
          c.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
          c.fill();
        }
        c.globalAlpha = 1;
      },
    };
  });

  useEffect(() => {
    const root = ctx.rootRef.current;
    if (!root || ctx.reduce) return;
    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top, active: true };
    };
    const leave = () => {
      pointer.current.active = false;
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
    };
  }, [ctx.rootRef, ctx.reduce]);

  return <canvas ref={ref} className="absolute inset-0 size-full" />;
}

function Starfield(ctx: EffectCtx) {
  const ref = useCanvasScene(ctx, () => {
    const stars: { x: number; y: number; z: number; pz: number }[] = [];
    const rand = seeded(5);
    const reset = (s: { x: number; y: number; z: number; pz: number }, z = 1) => {
      s.x = rand() * 2 - 1;
      s.y = rand() * 2 - 1;
      s.z = z;
      s.pz = z;
    };
    return {
      resize(w, h) {
        const n = Math.min(380, Math.max(60, Math.round((w * h) / 2500)));
        while (stars.length < n) {
          const s = { x: 0, y: 0, z: 1, pz: 1 };
          reset(s, 0.05 + rand() * 0.95);
          stars.push(s);
        }
        stars.length = n;
      },
      frame(c, w, h, dt, colors) {
        c.clearRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2;
        const f = Math.max(w, h) * 0.5;
        c.strokeStyle = colors[1] ?? "gray";
        c.fillStyle = colors[1] ?? "gray";
        c.lineCap = "round";
        for (const s of stars) {
          s.pz = s.z;
          s.z -= dt * 0.3;
          if (s.z <= 0.02) reset(s);
          const sx = cx + (s.x / s.z) * f;
          const sy = cy + (s.y / s.z) * f;
          if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) {
            reset(s);
            continue;
          }
          const px = cx + (s.x / s.pz) * f;
          const py = cy + (s.y / s.pz) * f;
          const k = 1 - s.z;
          c.globalAlpha = Math.min(1, k * 1.2);
          c.lineWidth = 0.4 + k * 2;
          c.beginPath();
          c.moveTo(px, py);
          c.lineTo(sx, sy);
          c.stroke();
          c.beginPath();
          c.arc(sx, sy, 0.3 + k, 0, Math.PI * 2);
          c.fill();
        }
        c.globalAlpha = 1;
      },
    };
  });
  return <canvas ref={ref} className="absolute inset-0 size-full" />;
}

function wavePath(period: number, amp: number, y0: number, height: number, periods: number) {
  let d = `M0 ${y0} Q${period / 4} ${y0 - amp} ${period / 2} ${y0}`;
  for (let k = 2; k <= periods * 2; k++) d += ` T${(k * period) / 2} ${y0}`;
  return `${d} L${periods * period} ${height} L0 ${height} Z`;
}

function Waves({ colors, speed, reduce }: EffectCtx) {
  const layers = [
    { y0: 70, amp: 26, dur: 16, c: 2, opacity: 0.35, period: 400 },
    { y0: 100, amp: 20, dur: 11, c: 1, opacity: 0.35, period: 400 },
    { y0: 130, amp: 16, dur: 7, c: 0, opacity: 0.4, period: 200 },
  ];
  return (
    <div className="absolute inset-0">
      {layers.map((l, i) => (
        <svg
          key={i}
          viewBox="0 0 1600 200"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 h-[60%] w-[200%]"
          style={{
            animation: reduce ? undefined : `sui-bg-slide ${secs(l.dur, speed)} linear infinite`,
            animationDirection: i === 1 ? "reverse" : undefined,
          }}
        >
          <path d={wavePath(l.period, l.amp, l.y0, 200, 1600 / l.period)} fill={pick(colors, l.c)} fillOpacity={l.opacity} />
        </svg>
      ))}
    </div>
  );
}

function RippleRings({ colors, speed, reduce }: EffectCtx) {
  const rings = [0, 1, 2, 3];
  const c = pick(colors, 0);
  return (
    <div className="absolute inset-0">
      <div
        className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{ background: fade(c, 40) }}
      />
      {rings.map((i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 aspect-square w-[160%] rounded-full border-[1.5px]"
          style={{
            borderColor: fade(c, 70),
            animation: reduce ? undefined : `sui-bg-ripple ${secs(6, speed)} cubic-bezier(.2,.6,.4,1) ${secs(-i * 1.5, speed)} infinite`,
            transform: reduce ? `translate(-50%,-50%) scale(${0.15 + i * 0.2})` : "translate(-50%,-50%) scale(0)",
            opacity: reduce ? 0.8 - i * 0.18 : undefined,
          }}
        />
      ))}
    </div>
  );
}

function NoiseGrain(ctx: EffectCtx) {
  const ref = useCanvasScene(
    ctx,
    () => {
      let acc = 1;
      let img: ImageData | null = null;
      return {
        resize() {
          img = null;
        },
        frame(c, _w, _h, dt) {
          acc += dt;
          // 約 24 fps 換一次顆粒；dt 為 0 時畫一張靜態顆粒
          if (dt > 0 && acc < 1 / 24) return;
          if (dt === 0 && img) {
            c.putImageData(img, 0, 0);
            return;
          }
          acc = 0;
          const { width, height } = c.canvas;
          if (!img || img.width !== width || img.height !== height) img = c.createImageData(width, height);
          const data = img.data;
          for (let i = 0; i < data.length; i += 4) {
            const v = Math.random() > 0.5 ? 255 : 0;
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
            data[i + 3] = Math.random() * 70;
          }
          c.putImageData(img, 0, 0);
        },
      };
    },
    0.5,
  );
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${fade(pick(ctx.colors, 0), 30)}, transparent 60%), radial-gradient(ellipse at 80% 90%, ${fade(pick(ctx.colors, 1), 25)}, transparent 60%)`,
        }}
      />
      <canvas ref={ref} className="absolute inset-0 size-full opacity-60 [image-rendering:pixelated]" />
    </>
  );
}

function Spotlight({ colors, reduce, rootRef }: EffectCtx) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 140, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 140, damping: 22, mass: 0.6 });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const center = () => {
      const r = root.getBoundingClientRect();
      x.set(r.width / 2);
      y.set(r.height / 2);
    };
    center();
    sx.jump(x.get());
    sy.jump(y.get());
    if (reduce) return;
    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      x.set(e.clientX - r.left);
      y.set(e.clientY - r.top);
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", center);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", center);
    };
  }, [rootRef, reduce, x, y, sx, sy]);

  const c = pick(colors, 0);
  return (
    <div className="absolute inset-0">
      <motion.div
        className="absolute left-0 top-0 -ml-[18rem] -mt-[18rem] size-[36rem] rounded-full"
        style={{
          x: reduce ? x : sx,
          y: reduce ? y : sy,
          background: `radial-gradient(circle closest-side, ${fade(c, 38)}, ${fade(c, 10)} 55%, transparent)`,
        }}
      />
    </div>
  );
}
