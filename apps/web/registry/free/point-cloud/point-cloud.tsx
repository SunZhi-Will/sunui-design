"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

import { cn } from "@/lib/utils";

/**
 * Point Cloud: a few thousand dots arranged in 3D (sphere, torus, helix,
 * cube, wave or the outline of a word), drawn with Canvas 2D and a simple
 * perspective projection. Drag to spin it (with inertia); a fine pointer
 * pushes nearby dots aside and they spring back. Changing `shape` morphs
 * every dot from where it is to its new place. Dots use the wrapper's text
 * color, so they follow the theme unless `color` is set.
 */

export const pointCloudShapes = ["sphere", "torus", "helix", "cube", "wave", "text"] as const;
export type PointCloudShape = (typeof pointCloudShapes)[number];

export type PointCloudProps = {
  shape?: PointCloudShape;
  /** The word drawn when shape is "text". CJK works with the default font. */
  text?: string;
  /** Font family for the text shape. */
  font?: string;
  /** Number of dots. 800 to 2000 suits most heroes. */
  count?: number;
  /** Dot color. Any CSS color, including var(--token). Defaults to currentColor. */
  color?: string;
  /** Dot radius in CSS pixels at the center depth. */
  pointSize?: number;
  /** Slow spin (a gentle sway for text) while on screen. */
  autoRotate?: boolean;
  /** Drag to rotate and pointer repel. */
  interactive?: boolean;
  /** Accessible description of what the cloud shows. */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

const TAU = Math.PI * 2;
const MORPH_MS = 900;

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function textPoints(text: string, font: string) {
  const W = 600;
  const H = 220;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  let size = 170;
  ctx.font = `700 ${size}px ${font}`;
  const width = ctx.measureText(text).width || 1;
  size = Math.min(size, (size * 560) / width);
  ctx.font = `700 ${size}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H / 2);
  const px = ctx.getImageData(0, 0, W, H).data;
  const pts: number[] = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (px[(y * W + x) * 4 + 3] > 128) pts.push(((x - W / 2) / (W / 2)) * 1.25, (-(y - H / 2) / (W / 2)) * 1.25);
    }
  }
  return pts;
}

/** Positions for `n` dots in a unit-ish space (radius about 1). */
function makeShape(shape: PointCloudShape, n: number, text: string, font: string): Float32Array {
  const out = new Float32Array(n * 3);
  const r = rng(7);
  const set = (i: number, x: number, y: number, z: number) => {
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  };
  const glyphs = shape === "text" ? textPoints(text || " ", font) : [];
  const kind: PointCloudShape = shape === "text" && glyphs.length < 2 ? "sphere" : shape;
  const side = Math.ceil(Math.sqrt(n));
  for (let i = 0; i < n; i++) {
    if (kind === "sphere") {
      const y = 1 - (2 * (i + 0.5)) / n;
      const rad = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      set(i, Math.cos(th) * rad, y, Math.sin(th) * rad);
    } else if (kind === "torus") {
      const u = r() * TAU;
      const v = r() * TAU;
      const ring = 0.72 + 0.3 * Math.cos(v);
      set(i, ring * Math.cos(u), 0.3 * Math.sin(v), ring * Math.sin(u));
    } else if (kind === "helix") {
      const t = i / n;
      const ang = t * TAU * 3;
      const y = t * 2.2 - 1.1;
      if (i % 9 === 0) {
        const k = r() * 2 - 1; // rung between the two strands
        set(i, Math.cos(ang) * 0.5 * k, y, Math.sin(ang) * 0.5 * k);
      } else {
        const a = ang + (i % 2) * Math.PI;
        const j = (r() - 0.5) * 0.06;
        set(i, Math.cos(a) * (0.5 + j), y + j, Math.sin(a) * (0.5 + j));
      }
    } else if (kind === "cube") {
      const face = i % 6;
      const s = 0.72;
      const sign = face & 1 ? 1 : -1;
      const u = (r() * 2 - 1) * s;
      const v = (r() * 2 - 1) * s;
      if (face < 2) set(i, sign * s, u, v);
      else if (face < 4) set(i, u, sign * s, v);
      else set(i, u, v, sign * s);
    } else if (kind === "wave") {
      const x = ((i % side) / Math.max(1, side - 1)) * 2.2 - 1.1;
      const z = (Math.floor(i / side) / Math.max(1, side - 1)) * 2.2 - 1.1;
      set(i, x, 0.22 * Math.sin(x * 3) * Math.cos(z * 3), z);
    } else {
      const g = Math.floor(r() * (glyphs.length / 2)) * 2;
      set(i, glyphs[g], glyphs[g + 1], (r() - 0.5) * 0.14);
    }
  }
  return out;
}

type State = {
  n: number;
  cur: Float32Array;
  from: Float32Array;
  to: Float32Array;
  morphStart: number;
  ox: Float32Array;
  oy: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  yaw: number;
  pitch: number;
  vyaw: number;
  vpitch: number;
  sway: number;
  dragging: boolean;
  lastX: number;
  lastY: number;
  px: number;
  py: number;
  inside: boolean;
  energy: number;
};

export function PointCloud({
  shape = "sphere",
  text = "SALE",
  font = "ui-sans-serif, system-ui, sans-serif",
  count = 1200,
  color,
  pointSize = 1.6,
  autoRotate = true,
  interactive = true,
  label = "Rotating cloud of dots",
  className,
  style,
}: PointCloudProps) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const S = useRef<State | null>(null);
  const props = useRef({ shape, autoRotate, interactive, pointSize, reduce });
  props.current = { shape, autoRotate, interactive, pointSize, reduce };
  const api = useRef<{ kick: () => void; paint: () => void } | null>(null);

  if (!S.current) {
    const empty = new Float32Array(0);
    S.current = {
      n: 0, cur: empty, from: empty, to: empty, morphStart: -1, ox: empty, oy: empty, vx: empty, vy: empty,
      yaw: 0.6, pitch: -0.25, vyaw: 0, vpitch: 0, sway: 0, dragging: false, lastX: 0, lastY: 0,
      px: -9999, py: -9999, inside: false, energy: 0,
    };
  }

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const s = S.current;
    if (!root || !canvas || !ctx || !s) return;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let visible = false;
    // Resolved color, read once and again only when the theme or props change,
    // so frames never force a style recalculation.
    let ink = "";

    const paint = () => {
      ctx.clearRect(0, 0, w, h);
      if (!s.n || !w) return;
      const P = props.current;
      if (!ink) ink = getComputedStyle(root).color;
      ctx.fillStyle = ink;
      const cyaw = Math.cos(s.yaw);
      const syaw = Math.sin(s.yaw);
      const cp = Math.cos(s.pitch);
      const sp = Math.sin(s.pitch);
      const scale = P.shape === "text" ? Math.min(w / 2.9, h * 0.9) : Math.min(w, h) * 0.36;
      const D = 3.4;
      const R = Math.min(w, h) * 0.18;
      const repel = P.interactive && !P.reduce;
      const buckets = Array.from({ length: 6 }, () => new Path2D());
      let energy = 0;
      for (let i = 0; i < s.n; i++) {
        const x = s.cur[i * 3];
        const y = s.cur[i * 3 + 1];
        const z = s.cur[i * 3 + 2];
        const x1 = x * cyaw + z * syaw;
        const z1 = -x * syaw + z * cyaw;
        const y2 = y * cp - z1 * sp;
        const z2 = y * sp + z1 * cp;
        const persp = D / (D - z2);
        let sx = w / 2 + x1 * scale * persp;
        let sy = h / 2 - y2 * scale * persp;
        if (repel) {
          let tx = 0;
          let ty = 0;
          if (s.inside && !s.dragging) {
            const dx = sx - s.px;
            const dy = sy - s.py;
            const d = Math.hypot(dx, dy);
            if (d < R && d > 0.01) {
              const push = (1 - d / R) ** 2 * R * 0.45;
              tx = (dx / d) * push;
              ty = (dy / d) * push;
            }
          }
          s.vx[i] = (s.vx[i] + (tx - s.ox[i]) * 0.14) * 0.8;
          s.vy[i] = (s.vy[i] + (ty - s.oy[i]) * 0.14) * 0.8;
          s.ox[i] += s.vx[i];
          s.oy[i] += s.vy[i];
          energy += Math.abs(s.ox[i]) + Math.abs(s.vx[i]) + Math.abs(s.oy[i]) + Math.abs(s.vy[i]);
          sx += s.ox[i];
          sy += s.oy[i];
        }
        const depth = Math.min(1, Math.max(0, (z2 + 1.3) / 2.6));
        const b = Math.min(5, Math.floor(depth * 6));
        const size = P.pointSize * persp;
        buckets[b].moveTo(sx + size, sy);
        buckets[b].arc(sx, sy, size, 0, TAU);
      }
      s.energy = energy / s.n;
      buckets.forEach((path, b) => {
        ctx.globalAlpha = 0.16 + (0.84 * (b + 0.5)) / 6;
        ctx.fill(path);
      });
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = 0;
      const P = props.current;
      const dt = (last ? Math.min(50, now - last) : 16.7) / 16.7;
      last = now;
      if (s.morphStart >= 0) {
        const t = P.reduce ? 1 : Math.min(1, (now - s.morphStart) / MORPH_MS);
        const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
        for (let i = 0; i < s.cur.length; i++) s.cur[i] = s.from[i] + (s.to[i] - s.from[i]) * e;
        if (t >= 1) s.morphStart = -1;
      }
      if (!s.dragging && !P.reduce) {
        s.yaw += s.vyaw * dt;
        s.pitch = Math.max(-1.2, Math.min(1.2, s.pitch + s.vpitch * dt));
        s.vyaw *= 0.94 ** dt;
        s.vpitch *= 0.94 ** dt;
        if (Math.abs(s.vyaw) < 1e-4) s.vyaw = 0;
        if (Math.abs(s.vpitch) < 1e-4) s.vpitch = 0;
        if (P.autoRotate) {
          if (P.shape === "text") {
            // Words stay readable: drift back to face front, then sway.
            s.sway += 0.012 * dt;
            const target = Math.sin(s.sway) * 0.45;
            s.yaw += (target - s.yaw) * 0.04 * dt;
            s.pitch += (-0.05 - s.pitch) * 0.04 * dt;
          } else {
            s.yaw += 0.0035 * dt;
          }
        }
      }
      paint();
      const busy =
        !P.reduce &&
        (P.autoRotate || s.morphStart >= 0 || s.vyaw !== 0 || s.vpitch !== 0 || s.dragging || s.inside || s.energy > 0.02);
      if ((busy || s.morphStart >= 0) && visible && !document.hidden) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const kick = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const retheme = () => {
      ink = "";
      paint();
    };
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = root.clientWidth;
      h = root.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      retheme();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    io.observe(root);
    const onVisibility = () => kick();
    document.addEventListener("visibilitychange", onVisibility);
    const mo = new MutationObserver(retheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", retheme);

    api.current = { kick, paint: retheme };
    kick();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      scheme.removeEventListener("change", retheme);
      document.removeEventListener("visibilitychange", onVisibility);
      api.current = null;
    };
  }, [reduce]);

  // New target positions: morph from wherever the dots are now.
  useEffect(() => {
    const s = S.current;
    if (!s) return;
    const target = makeShape(shape, count, text, font);
    if (s.n !== count) {
      s.n = count;
      s.cur = target.slice();
      s.from = target.slice();
      s.to = target;
      s.ox = new Float32Array(count);
      s.oy = new Float32Array(count);
      s.vx = new Float32Array(count);
      s.vy = new Float32Array(count);
      s.morphStart = -1;
    } else {
      s.from = s.cur.slice();
      s.to = target;
      s.morphStart = performance.now();
    }
    api.current?.paint();
    api.current?.kick();
  }, [shape, text, font, count]);

  useEffect(() => {
    api.current?.paint();
    api.current?.kick();
  }, [color, pointSize, autoRotate, interactive]);

  const local = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top] as const;
  };
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = S.current;
    if (!interactive || !s) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    s.dragging = true;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    s.vyaw = 0;
    s.vpitch = 0;
    api.current?.kick();
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = S.current;
    if (!interactive || !s) return;
    if (e.pointerType !== "touch") {
      [s.px, s.py] = local(e);
      s.inside = true;
    }
    if (s.dragging) {
      const dx = (e.clientX - s.lastX) * 0.008;
      const dy = (e.clientY - s.lastY) * 0.008;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.yaw += dx;
      s.pitch = Math.max(-1.2, Math.min(1.2, s.pitch + dy));
      s.vyaw = reduce ? 0 : dx;
      s.vpitch = reduce ? 0 : dy;
      if (reduce) api.current?.paint();
    }
    api.current?.kick();
  };
  const onUp = () => {
    const s = S.current;
    if (!s) return;
    s.dragging = false;
    api.current?.kick();
  };
  const onLeave = () => {
    const s = S.current;
    if (!s) return;
    s.inside = false;
    api.current?.kick();
  };

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={label}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onLeave}
      className={cn(
        "relative aspect-square w-full select-none overflow-hidden",
        interactive && "cursor-grab touch-pan-y active:cursor-grabbing",
        className,
      )}
      style={{ color, ...style }}
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
    </div>
  );
}

export default PointCloud;
