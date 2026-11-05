// Pixel FX core: a small TypeScript port of the pixelfx engine (https://github.com/patch-gg/pixelfx).
// MIT License, Copyright (c) 2026 Patch, Copyright (c) 2026 Hugo Duprez. The painter, the two buffers and
// the glint adapt pixelfx's src/core (painter.js, fx.js, color.js, math.js) and Sprite Fusion's open-source
// pixel art VFX (https://www.spritefusion.com/pixel-art-vfx).
//
// How it works:
// - A frame has two buffers. `color` holds opaque pixels (fades use ordered dither, never blending), `light`
//   holds additive glow. composite() adds the light on top, which is what makes hot things read as hot.
// - Effects draw in local space around their own origin; the painter places them.
// - Every random number comes from a seed, so the same effect plays the same way every time.

export type Color = number;
export type Ramp = Color[];

export interface Frame {
  w: number;
  h: number;
  color: Uint32Array;
  light: Uint32Array;
}

// ---- math

export const TAU = Math.PI * 2;
export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
/** Progress 0..1 of t through the window [t0, t1]. */
export const seg = (t: number, t0: number, t1: number) => clamp((t - t0) / (t1 - t0));
export const smooth = (e0: number, e1: number, x: number) => {
  const t = seg(x, e0, e1);
  return t * t * (3 - 2 * t);
};

export const ease = {
  inQuad: (t: number) => t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outBack: (t: number, s = 1.70158) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2)),
};

/** 32-bit integer hash of any number of integers. */
export function hash(...ns: number[]) {
  let h = 0x9e3779b9;
  for (const n of ns) {
    h = Math.imul(h ^ (n | 0), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
  }
  return h >>> 0;
}
/** Deterministic random number in [0, 1) from integers. */
export const rand = (...ns: number[]) => hash(...ns) / 4294967296;

/** Seeded random generator (mulberry32). */
export class Rng {
  private s: number;
  constructor(seed = 1) {
    this.s = seed >>> 0 || 1;
  }
  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number) {
    return a + (b - a) * this.next();
  }
  sign() {
    return this.next() < 0.5 ? -1 : 1;
  }
  pick<T>(list: readonly T[]): T {
    return list[Math.floor(this.next() * list.length)];
  }
}

function noise2(x: number, y: number, seed: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const a = rand(ix, iy, seed), b = rand(ix + 1, iy, seed), c = rand(ix, iy + 1, seed), d = rand(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
}
/** Fractal 2D value noise in about [-1, 1]. */
export function fbm(x: number, y: number, seed = 0, octaves = 3) {
  let s = 0, a = 0.5, n = 0;
  for (let o = 0; o < octaves; o++) {
    s += noise2(x, y, seed + o * 101) * a;
    n += a;
    x *= 2.03;
    y *= 2.03;
    a *= 0.5;
  }
  return s / n;
}

// ---- color: 32-bit integers laid out like ImageData bytes (R, G, B, A in memory)

export const rgb = (r: number, g: number, b: number): Color => ((255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) >>> 0;
const R_ = (c: Color) => c & 255, G_ = (c: Color) => (c >>> 8) & 255, B_ = (c: Color) => (c >>> 16) & 255;

/** "#rgb" or "#rrggbb" to a color number. */
export function hex(h: string | Color): Color {
  if (typeof h === "number") return h;
  let s = h.replace("#", "");
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  const v = parseInt(s.slice(0, 6), 16);
  return rgb((v >> 16) & 255, (v >> 8) & 255, v & 255);
}
export function mix(a: Color, b: Color, t: number): Color {
  t = clamp(t);
  return rgb(R_(a) + (R_(b) - R_(a)) * t, G_(a) + (G_(b) - G_(a)) * t, B_(a) + (B_(b) - B_(a)) * t);
}
export const scale = (c: Color, k: number) => rgb(Math.min(255, R_(c) * k), Math.min(255, G_(c) * k), Math.min(255, B_(c) * k));
/** Resample a ramp (dark to bright) to exactly n steps, keeping its ends. */
export function fit(r: readonly (string | Color)[], n: number): Ramp {
  const c = r.map(hex);
  if (c.length === n) return c;
  return Array.from({ length: n }, (_, i) => c[Math.round((i * (c.length - 1)) / Math.max(1, n - 1))]);
}
export const WHITE = hex("#ffffff");

// ---- frames

export function createFrame(w: number, h: number): Frame {
  return { w, h, color: new Uint32Array(w * h), light: new Uint32Array(w * h) };
}
export function clearFrame(f: Frame) {
  f.color.fill(0);
  f.light.fill(0);
}

/** Color plus light into RGBA bytes over transparency. Light becomes color with alpha (its brightest channel). */
export function composite(f: Frame, out: Uint8ClampedArray, lightK = 1) {
  const n = f.w * f.h, C = f.color, L = f.light;
  for (let i = 0; i < n; i++) {
    const c = C[i], l = L[i] & 0xffffff;
    let r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255, a = c >>> 24;
    if (l) {
      const lr = (l & 255) * lightK, lg = ((l >>> 8) & 255) * lightK, lb = ((l >>> 16) & 255) * lightK;
      if (a < 255) {
        const pa = a / 255, na = Math.min(1, Math.max(pa, Math.max(lr, lg, lb) / 255));
        if (na > 0) {
          r = Math.min(255, (r * pa + lr) / na);
          g = Math.min(255, (g * pa + lg) / na);
          b = Math.min(255, (b * pa + lb) / na);
          a = na * 255;
        }
      } else {
        r = Math.min(255, r + lr);
        g = Math.min(255, g + lg);
        b = Math.min(255, b + lb);
      }
    }
    const j = i * 4;
    out[j] = r;
    out[j + 1] = g;
    out[j + 2] = b;
    out[j + 3] = a;
  }
}

// ---- the painter

// 4x4 ordered (Bayer) thresholds: a pixel at alpha a is drawn when a is above its cell's threshold.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
type Fn<A extends unknown[]> = number | ((...args: A) => number);
const call = <A extends unknown[]>(v: Fn<A>, ...args: A) => (typeof v === "function" ? v(...args) : v);

export class Painter {
  /** Origin of local space, in frame pixels. */
  tx = 0;
  ty = 0;
  /** Multiplies every alpha and light: fades a whole effect out. */
  fade = 1;
  constructor(public f: Frame) {}

  place(x: number, y: number) {
    this.tx = x;
    this.ty = y;
    return this;
  }
  private sx(x: number) {
    return Math.floor(this.tx + Math.floor(x) + 0.5);
  }
  private sy(y: number) {
    return Math.floor(this.ty + Math.floor(y) + 0.5);
  }

  /** Raw write in frame space. Color 0 means nothing; alpha below 1 is dithered. */
  put(X: number, Y: number, c: Color, a = 1) {
    if (!c) return;
    a *= this.fade;
    if (a < 1 && a <= BAYER[((Y & 3) << 2) | (X & 3)]) return;
    if (X < 0 || Y < 0 || X >= this.f.w || Y >= this.f.h) return;
    this.f.color[Y * this.f.w + X] = c;
  }
  /** Raw additive light in frame space. */
  add(X: number, Y: number, c: Color, k = 1) {
    k *= this.fade;
    if (k <= 0.004 || X < 0 || Y < 0 || X >= this.f.w || Y >= this.f.h) return;
    const i = Y * this.f.w + X, d = this.f.light[i];
    const r = Math.min(255, (d & 255) + (c & 255) * k) | 0;
    const g = Math.min(255, ((d >>> 8) & 255) + ((c >>> 8) & 255) * k) | 0;
    const b = Math.min(255, ((d >>> 16) & 255) + ((c >>> 16) & 255) * k) | 0;
    this.f.light[i] = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }

  px(x: number, y: number, c: Color) {
    this.put(this.sx(x), this.sy(y), c, 1);
  }
  dot(x: number, y: number, c: Color, a = 1) {
    if (a > 0) this.put(this.sx(x), this.sy(y), c, a);
  }

  /** A pixel shader over a local box: fn returns a color (or 0) and may set o.a (alpha), o.l and o.k (light). */
  shade(x0: number, y0: number, x1: number, y1: number, fn: (x: number, y: number, o: { a: number; l: Color; k: number }) => Color | void) {
    const o = { a: 1, l: 0, k: 0 };
    const X0 = Math.max(0, Math.floor(this.tx + x0)), X1 = Math.min(this.f.w - 1, Math.ceil(this.tx + x1));
    const Y0 = Math.max(0, Math.floor(this.ty + y0)), Y1 = Math.min(this.f.h - 1, Math.ceil(this.ty + y1));
    for (let Y = Y0; Y <= Y1; Y++)
      for (let X = X0; X <= X1; X++) {
        o.a = 1;
        o.l = 0;
        o.k = 0;
        const c = fn(X + 0.5 - this.tx, Y + 0.5 - this.ty, o) || 0;
        if (c) this.put(X, Y, c, o.a);
        if (o.k > 0) this.add(X, Y, o.l || c, o.k);
      }
  }

  /** 1 px line; c and a may be functions of u (0 at the start, 1 at the end). */
  line(x0: number, y0: number, x1: number, y1: number, c: Fn<[number]>, a: Fn<[number]> = 1) {
    let X = this.sx(x0), Y = this.sy(y0);
    const ex = this.sx(x1), ey = this.sy(y1);
    const dx = Math.abs(ex - X), dy = -Math.abs(ey - Y), stx = X < ex ? 1 : -1, sty = Y < ey ? 1 : -1;
    const n = Math.max(dx, -dy) || 1;
    let err = dx + dy, i = 0;
    for (;;) {
      const u = i++ / n;
      this.put(X, Y, call(c, u), call(a, u));
      if (X === ex && Y === ey) break;
      const e2 = 2 * err;
      if (e2 >= dy) (err += dy), (X += stx);
      if (e2 <= dx) (err += dx), (Y += sty);
    }
  }
  circle(cx: number, cy: number, r: number, c: Color, a = 1) {
    if (r < 0.6) return this.dot(cx, cy, c, a);
    this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
      if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) return;
      o.a = a;
      return c;
    });
  }
  /** Ring from radius r - w to r. */
  ring(cx: number, cy: number, r: number, w: number, c: Color, a = 1) {
    const r0 = Math.max(0, r - w);
    this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2;
      if (d2 > r * r || d2 < r0 * r0) return;
      o.a = a;
      return c;
    });
  }
  rect(x: number, y: number, w: number, h: number, c: Color, a = 1) {
    const X0 = Math.round(x), Y0 = Math.round(y), X1 = Math.round(x + w), Y1 = Math.round(y + h);
    for (let yy = Y0; yy < Y1; yy++) for (let xx = X0; xx < X1; xx++) this.put(this.sx(xx), this.sy(yy), c, a);
  }

  /** Radial glow into the light buffer: k at the center, falling to 0 at radius r. */
  glow(x: number, y: number, r: number, c: Color, k = 0.5) {
    if (r < 1 || k <= 0.004) return;
    const cx = this.tx + x, cy = this.ty + y;
    for (let Y = Math.floor(cy - r); Y <= Math.ceil(cy + r); Y++)
      for (let X = Math.floor(cx - r); X <= Math.ceil(cx + r); X++) {
        const d = ((X + 0.5 - cx) / r) ** 2 + ((Y + 0.5 - cy) / r) ** 2;
        if (d >= 1) continue;
        const f = 1 - Math.sqrt(d);
        this.add(X, Y, c, f * f * k);
      }
  }
  /** Glow hugging a circle of radius R (a shockwave's light), falling off over width r. */
  glowRing(x: number, y: number, R: number, r: number, c: Color, k = 0.5) {
    if (r < 1 || k <= 0.004) return;
    const cx = this.tx + x, cy = this.ty + y, E = R + r;
    for (let Y = Math.floor(cy - E); Y <= Math.ceil(cy + E); Y++)
      for (let X = Math.floor(cx - E); X <= Math.ceil(cx + E); X++) {
        const d = Math.abs(Math.hypot(X + 0.5 - cx, Y + 0.5 - cy) - R) / r;
        if (d >= 1) continue;
        this.add(X, Y, c, (1 - d) ** 2 * k);
      }
  }
}

/** Lights that flare and die. */
export class Lights {
  list: { x: number; y: number; r: number; c: Color; k: number; life: number; max: number }[] = [];
  add(x: number, y: number, r: number, c: Color, k: number, life: number) {
    this.list.push({ x, y, r, c, k, life, max: life });
  }
  update(dt: number) {
    for (let i = this.list.length - 1; i >= 0; i--) if ((this.list[i].life -= dt) <= 0) this.list.splice(i, 1);
  }
  draw(p: Painter) {
    for (const l of this.list) {
      const k = l.life / l.max;
      p.glow(l.x, l.y, l.r * (0.55 + 0.45 * k), l.c, l.k * k * k);
    }
  }
}

const CROSS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const;

/** A cross-shaped star glint: arms of length arm in c, tips in tip, a white heart and a little light. */
export function sparkle(p: Painter, x: number, y: number, arm: number, c: Color, tip = c, k = 0.4) {
  const n = Math.round(arm);
  if (n < 1) return;
  const X = Math.floor(x), Y = Math.floor(y);
  for (let d = 1; d <= n; d++) for (const [dx, dy] of CROSS) p.px(X + dx * d, Y + dy * d, d > n * 0.6 ? tip : c);
  if (n >= 3) for (const [dx, dy] of DIAG) p.px(X + dx, Y + dy, c);
  p.px(X, Y, WHITE);
  p.glow(x, y, 4 + n * 2, c, k);
}

/** A spinning 8-ray glint: long rays white at the heart, c1 in the middle, c2 at the tips. */
export function glint(p: Painter, x: number, y: number, L: number, ang: number, c1: Color, c2: Color, a = 1) {
  if (L < 0.8 || a <= 0) return;
  for (let i = 0; i < 8; i++) {
    const diag = i % 2 === 1, an = ang + (i * TAU) / 8, len = diag ? L * 0.42 : L, ca = Math.cos(an), sa = Math.sin(an);
    for (let d = 0; d <= len; d += 0.5) {
      const u = d / len, c = diag ? (u < 0.5 ? c1 : c2) : u < 0.3 ? WHITE : u < 0.65 ? c1 : c2;
      p.dot(x + ca * d, y + sa * d, c, a * (u < 0.7 ? 1 : 1 - (u - 0.7) / 0.35));
    }
  }
  p.dot(x, y, WHITE, a);
  p.glow(x, y, 4 + L * 1.4, c1, 0.5 * a);
}

/**
 * An effect instance. update(dt) advances it (simulations step at 120 Hz or finer, so they look the same at
 * any frame rate); draw(p) paints the current moment around the painter's origin.
 */
export interface FxInstance {
  duration: number;
  update(dt: number): void;
  draw(p: Painter): void;
}
export interface FxContext {
  /** Frame size in art pixels. */
  w: number;
  h: number;
  palette: Ramp;
  seed: number;
}
export interface FxDefinition {
  name: string;
  /** Dark-to-bright ramp used when the caller passes none. */
  palette: readonly string[];
  /** Steps the effect indexes; any palette is resampled to this length. */
  steps: number;
  /** Where its origin sits, as fractions of the frame: [0.5, 0.5] is the middle. */
  origin: readonly [number, number];
  create(ctx: FxContext): FxInstance;
}
