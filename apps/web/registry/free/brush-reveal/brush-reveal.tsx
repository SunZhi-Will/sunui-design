"use client";

import { useReducedMotion } from "framer-motion";
import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/**
 * Brush Reveal: the pointer paints through the top of two stacked layers.
 *
 * How it works: both layers are ordinary React content. The `reveal` layer
 * sits on top with a CSS mask. The mask is a small offscreen canvas (a
 * quarter of the element's size, capped at 320px wide) where brush stamps
 * are drawn; while anything is painting or fading, the canvas is encoded
 * with toDataURL once per animation frame and set as `mask-image`. A small
 * canvas encodes in about a millisecond, and the browser scales the mask up
 * smoothly, which suits a soft brush. When nothing moves, nothing runs.
 * This keeps any markup (text, images, video) usable in either layer, which
 * compositing two images on a canvas could not do.
 *
 * Stamps are kept with their birth time and the mask is redrawn from them
 * each frame, so trails fade linearly to fully clear (fade 0 keeps them).
 */

export const brushShapes = ["soft", "ink"] as const;
export type BrushShape = (typeof brushShapes)[number];

export type BrushRevealProps = {
  /** The layer people see first. */
  children: ReactNode;
  /** The layer the brush uncovers. It is decorative to the pointer (pointer-events: none). */
  reveal: ReactNode;
  /** Brush diameter in CSS pixels. */
  brushSize?: number;
  /** Milliseconds for a stroke to fade back; 0 keeps strokes (they clear when the element is resized). */
  fade?: number;
  /** "soft" is an airbrush dot; "ink" is a blotchy drop with splatter. */
  shape?: BrushShape;
  /** Read by screen readers and shown nowhere; explains how to uncover the layer. */
  hint?: string;
  className?: string;
  style?: CSSProperties;
};

const EMPTY = "linear-gradient(transparent, transparent)";
const MAX_STAMPS = 900;

type Stamp = { x: number; y: number; t: number; a: number; v: number };

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A pre-drawn brush tip, so each stamp is a single drawImage. */
function makeSprite(shape: BrushShape, size: number, seed: number) {
  const s = Math.max(4, Math.ceil(size));
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const m = s / 2;
  if (shape === "soft") {
    const g = ctx.createRadialGradient(m, m, 0, m, m, m);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.45, "rgba(0,0,0,0.9)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    return c;
  }
  const r = rng(seed);
  ctx.fillStyle = "#000";
  ctx.beginPath();
  const n = 16;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rad = s * 0.3 * (0.78 + r() * 0.4);
    return [m + Math.cos(a) * rad, m + Math.sin(a) * rad] as const;
  });
  // Smooth closed curve through the midpoints.
  const mid = (i: number) => {
    const [ax, ay] = pts[i % n];
    const [bx, by] = pts[(i + 1) % n];
    return [(ax + bx) / 2, (ay + by) / 2] as const;
  };
  ctx.moveTo(...mid(0));
  for (let i = 1; i <= n; i++) ctx.quadraticCurveTo(pts[i % n][0], pts[i % n][1], ...mid(i));
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const a = r() * Math.PI * 2;
    const d = s * (0.34 + r() * 0.12);
    ctx.beginPath();
    ctx.arc(m + Math.cos(a) * d, m + Math.sin(a) * d, s * (0.02 + r() * 0.05), 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

export function BrushReveal({
  children,
  reveal,
  brushSize = 90,
  fade = 1400,
  shape = "soft",
  hint = "Move the pointer or a finger across this area to uncover the layer underneath. When focused, the whole layer shows.",
  className,
  style,
}: BrushRevealProps) {
  const reduce = useReducedMotion() ?? false;
  const hintId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const opts = useRef({ brushSize, fade, shape });
  opts.current = { brushSize, fade, shape };
  const api = useRef<{
    stroke: (x: number, y: number) => void;
    lift: () => void;
    setFull: (on: boolean) => void;
  } | null>(null);
  const painting = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    const layer = layerRef.current;
    if (!root || !layer) return;
    const mask = document.createElement("canvas");
    const mctx = mask.getContext("2d");
    if (!mctx) return;
    let w = 0;
    let h = 0;
    let k = 0.25;
    let sprites: HTMLCanvasElement[] = [];
    let stamps: Stamp[] = [];
    let last: { x: number; y: number } | null = null;
    let raf = 0;
    let full = false;
    let dirty = false;
    let count = 0;

    const setMask = (value: string) => {
      layer.style.setProperty("mask-image", value);
      layer.style.setProperty("-webkit-mask-image", value);
    };
    const build = () => {
      const { brushSize: size, shape: tip } = opts.current;
      sprites = [0, 1, 2].map((i) => makeSprite(tip, size * k, 11 + i * 7));
    };
    const resize = () => {
      w = root.clientWidth;
      h = root.clientHeight;
      k = Math.min(0.25, 320 / Math.max(1, w));
      mask.width = Math.max(1, Math.ceil(w * k));
      mask.height = Math.max(1, Math.ceil(h * k));
      build();
      stamps = [];
      mctx.clearRect(0, 0, mask.width, mask.height);
      if (!full) setMask(EMPTY);
    };
    const drawStamp = (st: Stamp, alpha: number) => {
      const sp = sprites[st.v];
      if (!sp) return;
      mctx.globalAlpha = alpha;
      mctx.save();
      mctx.translate(st.x * k, st.y * k);
      mctx.rotate(st.a);
      mctx.drawImage(sp, -sp.width / 2, -sp.height / 2);
      mctx.restore();
    };
    const flush = () => {
      if (!full) setMask(`url(${mask.toDataURL()})`);
    };
    const frame = (now: number) => {
      raf = 0;
      const { fade: life } = opts.current;
      if (life > 0) {
        while (stamps.length && now - stamps[0].t >= life) stamps.shift();
        mctx.clearRect(0, 0, mask.width, mask.height);
        for (const st of stamps) drawStamp(st, 1 - (now - st.t) / life);
        if (stamps.length) flush();
        else if (!full) setMask(EMPTY);
        if (stamps.length && !document.hidden) raf = requestAnimationFrame(frame);
      } else if (dirty) {
        dirty = false;
        flush();
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const stroke = (x: number, y: number) => {
      const step = Math.max(2, opts.current.brushSize * 0.18);
      const from = last ?? { x, y };
      const dist = Math.hypot(x - from.x, y - from.y);
      const n = Math.max(1, Math.ceil(dist / step));
      const now = performance.now();
      for (let i = last ? 1 : 0; i <= n; i++) {
        const t = i / n;
        count++;
        const st: Stamp = { x: from.x + (x - from.x) * t, y: from.y + (y - from.y) * t, t: now, a: count * 2.4, v: count % 3 };
        if (opts.current.fade > 0) {
          stamps.push(st);
          if (stamps.length > MAX_STAMPS) stamps.shift();
        } else {
          drawStamp(st, 1);
          dirty = true;
        }
      }
      last = { x, y };
      kick();
    };
    const lift = () => {
      last = null;
    };
    const setFull = (on: boolean) => {
      full = on;
      if (on) setMask("none");
      else if (opts.current.fade > 0) {
        if (stamps.length) kick();
        else setMask(EMPTY);
      } else if (count > 0) flush();
      else setMask(EMPTY);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(root);
    const onVisibility = () => {
      if (!document.hidden && stamps.length) kick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    api.current = { stroke, lift, setFull };
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      api.current = null;
    };
  }, [brushSize, shape, fade]);

  const local = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top] as const;
  };
  const onEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce && e.pointerType === "mouse") api.current?.setFull(true);
  };
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce) {
      // Touch under reduced motion: a tap shows the whole layer.
      if (e.pointerType !== "mouse") api.current?.setFull(true);
      return;
    }
    if (e.pointerType === "mouse") return;
    painting.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    api.current?.stroke(...local(e));
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    if (e.pointerType === "mouse" || painting.current) api.current?.stroke(...local(e));
  };
  const onUp = () => {
    painting.current = false;
    api.current?.lift();
  };
  const onLeave = (e: ReactPointerEvent<HTMLDivElement>) => {
    painting.current = false;
    api.current?.lift();
    if (reduce && e.pointerType === "mouse") api.current?.setFull(false);
  };

  return (
    <div
      ref={rootRef}
      role="group"
      // Focus is the keyboard way to see the reveal layer, so the group must be focusable.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-describedby={hintId}
      onPointerEnter={onEnter}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onLeave}
      onFocus={(e) => e.target === e.currentTarget && api.current?.setFull(true)}
      onBlur={(e) => e.target === e.currentTarget && api.current?.setFull(false)}
      className={cn(
        "relative isolate touch-none select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      style={style}
    >
      <div className="relative h-full w-full">{children}</div>
      <div
        ref={layerRef}
        className="pointer-events-none absolute inset-0"
        style={{
          maskImage: EMPTY,
          WebkitMaskImage: EMPTY,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      >
        {reveal}
      </div>
      <span id={hintId} className="sr-only">
        {hint}
      </span>
    </div>
  );
}

export default BrushReveal;
