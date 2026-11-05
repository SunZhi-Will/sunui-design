"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

import { cn } from "@/lib/utils";

/**
 * Raster Image: redraws a picture as print-style marks on a canvas.
 * The image is sampled once per size into a small darkness field, then each
 * mode turns that field into marks: halftone dots, ASCII characters, a dot
 * matrix, 1-bit ordered dither or engraved lines. Marks use the wrapper's
 * text color (`color` prop or the inherited currentColor), so Light and Dark
 * themes work without extra props. The canvas only redraws while something
 * moves (pointer ripple or the sweep-in); otherwise it sits idle.
 */

export const rasterModes = ["halftone", "ascii", "dots", "dither", "lines"] as const;
export type RasterMode = (typeof rasterModes)[number];

export type RasterImageProps = {
  /** Image URL or data URI. Remote images need CORS headers to be sampled. */
  src: string;
  /** Describes the picture; read by screen readers instead of the canvas. */
  alt: string;
  mode?: RasterMode;
  /** Grid size in CSS pixels. Smaller is finer and costs more per frame. */
  cell?: number;
  /** Mark color. Any CSS color, including var(--token). Defaults to currentColor. */
  color?: string;
  /** Background color behind the marks. Defaults to transparent. */
  background?: string;
  /** Swap dark and light: marks where the image is bright. */
  invert?: boolean;
  /** Halftone screen angle in degrees. */
  angle?: number;
  /** ASCII ramp from lightest to darkest. */
  chars?: string;
  fit?: "cover" | "contain";
  /** Marks near a fine pointer swell and push away, then ease back. */
  interactive?: boolean;
  /** Sweep the marks in from the left the first time it scrolls into view. */
  animateIn?: boolean;
  className?: string;
  style?: CSSProperties;
};

const TAU = Math.PI * 2;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const DEFAULT_CHARS = " .:-=+*#%@";

type Field = { data: Float32Array; sw: number; sh: number };
type Opts = Required<Pick<RasterImageProps, "mode" | "cell" | "invert" | "angle" | "chars">> & { color: string };
type Pointer = { x: number; y: number; k: number; inside: boolean };

/** Darkness (0 white, 1 black) on a grid at twice the cell density. */
function sampleImage(img: HTMLImageElement, w: number, h: number, cell: number, fit: "cover" | "contain"): Field | null {
  const sw = Math.max(1, Math.ceil((w * 2) / cell));
  const sh = Math.max(1, Math.ceil((h * 2) / cell));
  const c = document.createElement("canvas");
  c.width = sw;
  c.height = sh;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx || !img.naturalWidth) return null;
  ctx.imageSmoothingQuality = "high";
  // SVGs without width/height report a natural size that does not match how
  // drawImage crops them, so draw the whole image to a plain bitmap first.
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const flat = document.createElement("canvas");
  flat.width = iw;
  flat.height = ih;
  const fctx = flat.getContext("2d");
  if (!fctx) return null;
  fctx.drawImage(img, 0, 0, iw, ih);
  const src: CanvasImageSource = flat;
  const ir = iw / ih;
  const br = w / h;
  if (fit === "cover") {
    let sx = 0;
    let sy = 0;
    let cw = iw;
    let ch = ih;
    if (ir > br) {
      cw = ih * br;
      sx = (iw - cw) / 2;
    } else {
      ch = iw / br;
      sy = (ih - ch) / 2;
    }
    ctx.drawImage(src, sx, sy, cw, ch, 0, 0, sw, sh);
  } else {
    const dw = ir > br ? w : h * ir;
    const dh = ir > br ? w / ir : h;
    ctx.drawImage(src, ((w - dw) / 2) * (sw / w), ((h - dh) / 2) * (sh / h), dw * (sw / w), dh * (sh / h));
  }
  let px: Uint8ClampedArray;
  try {
    px = ctx.getImageData(0, 0, sw, sh).data;
  } catch {
    return null; // cross-origin image without CORS
  }
  const data = new Float32Array(sw * sh);
  for (let i = 0; i < data.length; i++) {
    const lum = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
    const a = px[i * 4 + 3] / 255;
    data[i] = a * (1 - lum); // transparent counts as paper
  }
  return { data, sw, sh };
}

function render(ctx: CanvasRenderingContext2D, w: number, h: number, f: Field, o: Opts, p: Pointer, sweep: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = o.color;
  ctx.globalAlpha = 1;
  const cell = o.cell;
  const at = (x: number, y: number) => {
    const ix = Math.min(f.sw - 1, Math.max(0, ((x / w) * f.sw) | 0));
    const iy = Math.min(f.sh - 1, Math.max(0, ((y / h) * f.sh) | 0));
    const v = f.data[iy * f.sw + ix];
    return o.invert ? 1 - v : v;
  };
  // Pointer influence, written into scratch vars to avoid allocations.
  const R = cell * 7;
  let inf = 0;
  let nx = 0;
  let ny = 0;
  const influence = (x: number, y: number) => {
    inf = 0;
    if (p.k < 0.002) return;
    const dx = x - p.x;
    const dy = y - p.y;
    const d = Math.hypot(dx, dy);
    if (d >= R) return;
    const s = 1 - d / R;
    inf = p.k * s * s;
    nx = d ? dx / d : 0;
    ny = d ? dy / d : 0;
  };
  // Sweep-in: a soft band travelling left to right.
  const band = w * 0.3;
  const front = sweep * (w + band);
  const reveal = (x: number) => (sweep >= 1 ? 1 : Math.min(1, Math.max(0, (front - x) / band)));

  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);

  if (o.mode === "halftone") {
    const ang = (o.angle * Math.PI) / 180;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const half = Math.hypot(w, h) / 2;
    ctx.beginPath();
    for (let gy = -half; gy <= half; gy += cell) {
      for (let gx = -half; gx <= half; gx += cell) {
        let x = w / 2 + gx * cos - gy * sin;
        let y = h / 2 + gx * sin + gy * cos;
        if (x < -cell || y < -cell || x > w + cell || y > h + cell) continue;
        const v = at(x, y);
        influence(x, y);
        const r = Math.sqrt(v) * cell * 0.56 * (1 + 0.9 * inf) * reveal(x);
        if (r < 0.3) continue;
        x += nx * inf * cell * 0.9;
        y += ny * inf * cell * 0.9;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
    }
    ctx.fill();
    return;
  }

  if (o.mode === "dots") {
    const levels = 6;
    const paths = Array.from({ length: levels }, () => new Path2D());
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let x = (c + 0.5) * cell;
        let y = (r + 0.5) * cell;
        influence(x, y);
        const v = Math.min(1, at(x, y) + inf * 0.4) * reveal(x);
        const level = Math.round(v * levels);
        if (level <= 0) continue;
        const rad = cell * 0.36 * (1 + 0.5 * inf);
        x += nx * inf * cell * 0.8;
        y += ny * inf * cell * 0.8;
        paths[level - 1].moveTo(x + rad, y);
        paths[level - 1].arc(x, y, rad, 0, TAU);
      }
    }
    paths.forEach((path, i) => {
      ctx.globalAlpha = (i + 1) / levels;
      ctx.fill(path);
    });
    ctx.globalAlpha = 1;
    return;
  }

  if (o.mode === "ascii") {
    const ramp = o.chars.length ? o.chars : DEFAULT_CHARS;
    ctx.font = `${Math.round(cell * 1.15)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let x = (c + 0.5) * cell;
        let y = (r + 0.5) * cell;
        const rv = reveal(x);
        if (rv < 1 && ((c * 7 + r * 13) % 10) / 10 >= rv) continue;
        influence(x, y);
        const v = Math.min(1, at(x, y) + inf * 0.5);
        const ch = ramp[Math.min(ramp.length - 1, Math.floor(v * ramp.length))];
        if (ch === " ") continue;
        x += nx * inf * cell;
        y += ny * inf * cell;
        ctx.fillText(ch, x, y);
      }
    }
    return;
  }

  ctx.beginPath();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) * cell;
      const y = (r + 0.5) * cell;
      influence(x, y);
      const rv = reveal(x);
      if (o.mode === "dither") {
        const v = at(x, y) + inf * 0.35;
        const t = (BAYER[(r & 3) * 4 + (c & 3)] + 0.5) / 16;
        if (v * rv > t) ctx.rect(c * cell, r * cell, cell + 0.4, cell + 0.4);
      } else {
        const th = Math.min(cell, at(x, y) * cell * 0.85 * (1 + 0.6 * inf)) * rv;
        if (th < 0.25) continue;
        const yy = y + ny * inf * cell * 0.8;
        ctx.rect(c * cell, yy - th / 2, cell + 0.4, th);
      }
    }
  }
  ctx.fill();
}

export function RasterImage({
  src,
  alt,
  mode = "halftone",
  cell = 8,
  color,
  background,
  invert = false,
  angle = 45,
  chars = DEFAULT_CHARS,
  fit = "cover",
  interactive = true,
  animateIn = false,
  className,
  style,
}: RasterImageProps) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<Pointer>({ x: -9999, y: -9999, k: 0, inside: false });
  const opts = useRef({ mode, cell, invert, angle, chars, fit });
  opts.current = { mode, cell, invert, angle, chars, fit };
  const api = useRef<{ refresh: () => void; kick: () => void } | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;
    const p = pointer.current;
    let img: HTMLImageElement | null = null;
    let field: Field | null = null;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let visible = false;
    let sweep = animateIn && !reduce ? 0 : 1;
    let sweepStart = -1;

    const resample = () => {
      field = img && img.complete && w && h ? sampleImage(img, w, h, opts.current.cell, opts.current.fit) : null;
    };
    const paint = () => {
      if (!field) return ctx.clearRect(0, 0, w, h);
      const color = getComputedStyle(root).color;
      render(ctx, w, h, field, { ...opts.current, color }, p, sweep);
    };
    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      p.k += ((p.inside ? 1 : 0) - p.k) * (1 - Math.exp(-dt / 140));
      if (!p.inside && p.k < 0.002) p.k = 0;
      if (visible && sweep < 1 && field) {
        if (sweepStart < 0) sweepStart = now;
        sweep = Math.min(1, (now - sweepStart) / 1100);
      }
      paint();
      const busy = p.inside || p.k > 0 || (sweep < 1 && !!field);
      if (busy && visible && !document.hidden) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const kick = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = root.clientWidth;
      h = root.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resample();
      paint();
    };

    img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      resample();
      paint();
      kick();
    };
    img.src = src;

    const ro = new ResizeObserver(resize);
    ro.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    io.observe(root);
    const onVisibility = () => kick();
    document.addEventListener("visibilitychange", onVisibility);
    // Repaint when the theme flips (class or attribute on <html>, or the OS scheme).
    const mo = new MutationObserver(paint);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", paint);

    api.current = {
      refresh: () => {
        resample();
        paint();
      },
      kick,
    };
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      scheme.removeEventListener("change", paint);
      document.removeEventListener("visibilitychange", onVisibility);
      if (img) img.onload = null;
      api.current = null;
    };
  }, [src, reduce, animateIn]);

  useEffect(() => {
    api.current?.refresh();
  }, [mode, cell, invert, angle, chars, fit, color, background]);

  const fine = (e: ReactPointerEvent) => e.pointerType === "mouse" || e.pointerType === "pen";
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || reduce || !fine(e)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const p = pointer.current;
    p.x = e.clientX - rect.left;
    p.y = e.clientY - rect.top;
    p.inside = true;
    api.current?.kick();
  };
  const onLeave = () => {
    pointer.current.inside = false;
    api.current?.kick();
  };

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={alt}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("relative aspect-[4/3] w-full overflow-hidden", className)}
      style={{ color, backgroundColor: background, ...style }}
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
    </div>
  );
}

export default RasterImage;
