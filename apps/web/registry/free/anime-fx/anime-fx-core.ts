/**
 * anime-fx core: springs, the shared clock, canvas layers and the drawn effects. No React; anime-fx.tsx wraps it in hooks.
 *
 * Rules: every shape is a lit face, a shadow face and an outline in flat colour, with no gradients or blur;
 * effects leave by shrinking or thinning, never by fading; with reduced motion on, no effect is drawn and state changes as usual.
 * The method follows the rules of Sakuga VFX (MIT, github.com/finktheartist/sakuga-vfx); the code is our own.
 */

export type Palette = {
  /** Lit face */
  fill: string;
  /** Shadow face */
  shade: string;
  /** Outline */
  line: string;
  /** Accent wedges */
  accent: string;
  /** Lettering ink */
  ink: string;
};

const TAU = Math.PI * 2;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const out = (t: number) => 1 - (1 - t) ** 3;
export const inn = (t: number) => t * t * t;
const back = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** A spring with 8 ms substeps. Anything the hand moves, squashes or settles uses this, not an easing curve. */
export class Spring {
  v = 0;
  to: number;
  constructor(
    public x: number,
    public k = 300,
    public d = 20,
  ) {
    this.to = x;
  }
  step(dt: number) {
    if (!(dt > 0)) return this.x;
    const n = Math.ceil(dt / 0.008);
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      this.v += (-this.k * (this.x - this.to) - this.d * this.v) * h;
      this.x += this.v * h;
    }
    return this.x;
  }
  /** At rest on its target */
  get still() {
    return Math.abs(this.x - this.to) < 0.001 && Math.abs(this.v) < 0.01;
  }
}

// ───────── layers and the clock ─────────

export type Draw = (g: CanvasRenderingContext2D, k: number, t: number) => void;
type Fx = { t: number; life: number; draw: Draw };
export type Layer = { c: HTMLCanvasElement | null; live: Fx[] };

/** The front layer: one canvas over the whole viewport that ignores the pointer, created on the first effect. */
const front: Layer = { c: null, live: [] };
const layers: Layer[] = [front];
const frames = new Set<(dt: number) => void>();
let timers: { at: number; f: () => void }[] = [];
let now = 0;
let last = 0;
let running = false;
let paused = false;

export const calm = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function ensureFront() {
  if (front.c || typeof document === "undefined") return;
  const c = document.createElement("canvas");
  c.setAttribute("aria-hidden", "true");
  c.dataset.animeFx = "";
  c.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000";
  document.body.appendChild(c);
  front.c = c;
}

/** Register a canvas inside a component, behind its control (the impact star sits behind a button). Returns the layer and a function that unregisters it. */
export function addLayer(c: HTMLCanvasElement) {
  const L: Layer = { c, live: [] };
  layers.push(L);
  return {
    layer: L,
    remove: () => {
      const i = layers.indexOf(L);
      if (i >= 0) layers.splice(i, 1);
    },
  };
}

/** Add an effect. life is in seconds; draw receives progress k (0 to 1) and elapsed seconds t. */
export function add(life: number, draw: Draw, layer?: Layer | null) {
  if (calm()) return;
  const L = layer ?? front;
  if (L === front) ensureFront();
  L.live.push({ t: 0, life, draw });
  start();
}

/** Run later on the shared clock (not setTimeout), so the frame tool can step it. */
export function later(ms: number, f: () => void) {
  timers.push({ at: now + ms / 1000, f });
  start();
}

/** Call every frame; returns a function that stops it. The loop stops by itself when nothing moves. */
export function onFrame(f: (dt: number) => void) {
  frames.add(f);
  start();
  return () => {
    frames.delete(f);
  };
}

function paint(dt: number) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  for (const L of layers) {
    const c = L.c;
    if (!c || !c.isConnected) continue;
    const r = c.getBoundingClientRect();
    const w = Math.round(r.width * dpr);
    const h = Math.round(r.height * dpr);
    if (c.width !== w) c.width = w;
    if (c.height !== h) c.height = h;
    const g = c.getContext("2d");
    if (!g) continue;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    if (!L.live.length) continue;
    // Effects are placed in page coordinates and mapped to this canvas when drawn, so they scroll with their control
    g.setTransform(dpr, 0, 0, dpr, -(r.left + scrollX) * dpr, -(r.top + scrollY) * dpr);
    g.lineJoin = "round";
    g.lineCap = "round";
    for (const p of L.live) {
      p.t += dt;
      g.save();
      p.draw(g, clamp(p.t / p.life), p.t);
      g.restore();
    }
    L.live = L.live.filter((p) => p.t < p.life);
  }
}

function advance(dt: number) {
  now += dt;
  const due = timers.filter((q) => q.at <= now);
  timers = timers.filter((q) => q.at > now);
  for (const q of due) q.f();
  for (const f of frames) f(dt);
  paint(dt);
}

function loop(ms: number) {
  const dt = clamp((ms - last) / 1000, 0, 0.034);
  last = ms;
  if (!paused) advance(dt);
  if (!paused && !frames.size && !timers.length && layers.every((L) => !L.live.length)) {
    running = false;
    paint(0);
    return;
  }
  requestAnimationFrame(loop);
}

function start() {
  if (running || typeof window === "undefined") return;
  running = true;
  last = performance.now();
  requestAnimationFrame(loop);
}

// For frame sheets: pause(true) stops the clock, step(seconds) advances it at 60 fps
if (typeof window !== "undefined")
  (window as unknown as { __animeFx?: object }).__animeFx ??= {
    pause: (v = true) => {
      paused = v;
      start();
    },
    step: (sec: number) => {
      for (let t = 0; t < sec - 1e-6; t += 1 / 60) advance(1 / 60);
    },
  };

/** A point on an element in page coordinates; fx and fy go from 0 to 1. */
export function at(el: Element, fx = 0.5, fy = 0.5) {
  const b = el.getBoundingClientRect();
  return { x: b.left + scrollX + b.width * fx, y: b.top + scrollY + b.height * fy, w: b.width, h: b.height };
}

/** Turn a CSS colour (variables, color-mix) into a string the canvas accepts. */
function resolve(el: Element, css: string) {
  const probe = document.createElement("span");
  probe.style.cssText = `display:none;color:${css}`;
  el.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
}

const SPOT = "var(--sunui-spot, var(--primary))";

/**
 * Colours from the element's theme: the lit face is always white (drawn effects are white, and read better on a dark page too),
 * the shadow face is the brand spot mixed into white, the outline is the brand spot, accents are the semantic red.
 * Read on every trigger, so theme and brand colour changes apply.
 */
export function paletteOf(el: Element): Palette {
  return {
    fill: "#ffffff",
    shade: resolve(el, `color-mix(in oklch, ${SPOT} 24%, #fff)`),
    line: resolve(el, SPOT),
    accent: resolve(el, "var(--sunui-like, #dc3d43)"),
    ink: "#141414",
  };
}

// ───────── fills ─────────

const tones = new Map<string, CanvasPattern | null>();
/** Screentone: a grid of dots on a ground colour. */
export function tone(g: CanvasRenderingContext2D, dot: string, bg: string, r: number, gap: number) {
  const key = `${dot}|${bg}|${r}|${gap}`;
  if (tones.has(key)) return tones.get(key)!;
  const t = document.createElement("canvas");
  t.width = Math.round(gap * 2);
  t.height = Math.round(gap * 2);
  const x = t.getContext("2d")!;
  x.fillStyle = bg;
  x.fillRect(0, 0, t.width, t.height);
  x.fillStyle = dot;
  const s = t.width / 2;
  for (const [px, py] of [[0, 0], [s * 2, 0], [0, s * 2], [s * 2, s * 2], [s, s]]) {
    x.beginPath();
    x.arc(px, py, r, 0, TAU);
    x.fill();
  }
  const p = g.createPattern(t, "repeat");
  tones.set(key, p);
  return p;
}

/** Circles drawn as one shape: outline, shadow face, then the lit face shifted up and left. */
function blob(g: CanvasRenderingContext2D, P: Palette, cs: [number, number, number][], lw = 1.6) {
  const all = new Path2D();
  const lit = new Path2D();
  for (const [x, y, r] of cs) {
    if (r <= 0.4) continue;
    all.moveTo(x + r, y);
    all.arc(x, y, r, 0, TAU);
    const lx = x - r * 0.18;
    const ly = y - r * 0.2;
    lit.moveTo(lx + r * 0.78, ly);
    lit.arc(lx, ly, r * 0.78, 0, TAU);
  }
  g.strokeStyle = P.line;
  g.lineWidth = lw * 2;
  g.stroke(all);
  g.fillStyle = P.shade;
  g.fill(all);
  g.fillStyle = P.fill;
  g.fill(lit);
}

// ───────── effects (all in page coordinates) ─────────

/** A smoke puff: swells with a little overshoot, rolls, and shrinks away. */
export function puff(P: Palette, x: number, y: number, o: { n?: number; size?: number; vx?: number; vy?: number; life?: number; layer?: Layer | null } = {}) {
  const { n = 5, size = 13, vx = 0, vy = -18, life = 0.8, layer } = o;
  const lobes = Array.from({ length: n }, (_, i) => ({ a: (i / n) * TAU + rnd(0, 0.6), d: rnd(0.25, 0.9) * size, r: rnd(0.55, 1) * size, sp: rnd(0.6, 1.3) }));
  add(
    life,
    (g, k, t) => {
      const grow = back(clamp(t / 0.22));
      const die = 1 - inn(clamp((k - 0.5) / 0.5));
      const px = x + vx * out(k) * life;
      const py = y + vy * out(k) * life;
      const spread = 0.5 + out(k);
      blob(g, P, lobes.map((l) => [px + Math.cos(l.a + t * l.sp) * l.d * spread, py + Math.sin(l.a + t * l.sp) * l.d * spread - out(k) * 5, l.r * grow * die]));
    },
    layer,
  );
}

/** The impact star: a large star in the shadow face under a lit one; it leaves by its points thinning away. Usually on the layer behind the control. */
export function burst(P: Palette, x: number, y: number, o: { r?: number; spikes?: number; life?: number; layer?: Layer | null } = {}) {
  const { r = 60, spikes = 13, life = 0.4, layer } = o;
  const j = Array.from({ length: spikes * 2 }, (_, i) => (i % 2 ? rnd(0.34, 0.5) : rnd(0.75, 1.15)));
  const rot = rnd(0, TAU);
  const star = (R: number, turn: number, inner: number) => {
    const p = new Path2D();
    j.forEach((m, i) => {
      const a = rot + turn + (i / j.length) * TAU;
      const rr = R * (i % 2 ? m * inner : m);
      if (i) p.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      else p.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    });
    p.closePath();
    return p;
  };
  add(
    life,
    (g, k) => {
      const R = r * out(clamp(k / 0.3));
      const hollow = 1 + inn(clamp((k - 0.35) / 0.65)) * 1.3;
      g.strokeStyle = P.line;
      g.lineWidth = 1.4;
      const big = star(R * 1.16, 0.19, hollow);
      g.fillStyle = P.shade;
      g.fill(big);
      g.stroke(big);
      const small = star(R * 0.84, 0, hollow);
      g.fillStyle = P.fill;
      g.fill(small);
      g.stroke(small);
    },
    layer,
  );
}

/** Crystal chips: long facets that tumble, fall and shrink away. Launch them from the edge of a control (or on its back layer) so they never cover the label. */
export function shards(P: Palette, x: number, y: number, o: { n?: number; speed?: number; size?: number; life?: number; dir?: number; arc?: number; layer?: Layer | null } = {}) {
  const { n = 7, speed = 190, size = 5, life = 0.75, dir = -Math.PI / 2, arc = Math.PI, layer } = o;
  const shape = [[-1.4, 0.1], [-0.6, -0.7], [1.2, -0.45], [1.5, 0.15], [0.4, 0.75]];
  for (let i = 0; i < n; i++) {
    const a = dir + rnd(-arc, arc) / 2;
    const v = speed * rnd(0.5, 1.15);
    const s = size * rnd(0.6, 1.4);
    const spin = rnd(-7, 7);
    add(life * rnd(0.7, 1), (g, k, t) => {
      const sc = s * (1 - inn(clamp((k - 0.6) / 0.4)));
      g.translate(x + Math.cos(a) * v * t, y + Math.sin(a) * v * t + 420 * t * t);
      g.rotate(spin * t);
      const p = new Path2D();
      shape.forEach(([px, py], m) => (m ? p.lineTo(px * sc, py * sc) : p.moveTo(px * sc, py * sc)));
      p.closePath();
      g.fillStyle = P.fill;
      g.fill(p);
      g.strokeStyle = P.line;
      g.lineWidth = 1.3;
      g.stroke(p);
    }, layer);
  }
}

/** Accent wedges: point at something, then fly off it. */
export function ticks(P: Palette, x: number, y: number, o: { n?: number; r?: number; len?: number; dir?: number; life?: number; fan?: number } = {}) {
  const { n = 3, r = 16, len = 12, dir = -Math.PI / 2, life = 0.4, fan = 0.45 } = o;
  add(life, (g, k) => {
    const a = out(clamp(k / 0.5));
    const b = inn(clamp((k - 0.4) / 0.6));
    g.fillStyle = P.accent;
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const an = dir + (i - (n - 1) / 2) * fan;
      const r0 = r + len * b * 1.25;
      const r1 = r + len * a * 1.25;
      const hw = 0.07 + 2.2 / (r1 + 8);
      if (r1 - r0 < 0.6) continue;
      g.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0);
      g.lineTo(x + Math.cos(an - hw) * r1, y + Math.sin(an - hw) * r1);
      g.lineTo(x + Math.cos(an + hw) * r1, y + Math.sin(an + hw) * r1);
      g.closePath();
    }
    g.fill();
  });
}

/** Speed lines: shoot out along dir and end when the tail catches the head. */
export function lines(P: Palette, x: number, y: number, o: { n?: number; dir?: number; len?: number; spread?: number; life?: number } = {}) {
  const { n = 5, dir = Math.PI, len = 40, spread = 22, life = 0.3 } = o;
  const ls = Array.from({ length: n }, () => ({ off: rnd(-spread, spread), l: len * rnd(0.6, 1.1) }));
  const nx = Math.cos(dir);
  const ny = Math.sin(dir);
  add(life, (g, k) => {
    g.strokeStyle = P.line;
    g.lineWidth = 2.4 * (1 - k);
    g.beginPath();
    for (const s of ls) {
      const bx = x - ny * s.off;
      const by = y + nx * s.off;
      g.moveTo(bx + nx * inn(k) * s.l, by + ny * inn(k) * s.l);
      g.lineTo(bx + nx * out(k) * s.l, by + ny * out(k) * s.l);
    }
    g.stroke();
  });
}

/** Wobble marks: two small arcs beside something that has just stopped. dir 1 draws on the right, -1 on the left. */
export function wob(P: Palette, x: number, y: number, o: { dir?: number; r?: number; life?: number } = {}) {
  const { dir = 1, r = 14, life = 0.4 } = o;
  const c = dir > 0 ? 0 : Math.PI;
  add(life, (g, k) => {
    g.strokeStyle = P.line;
    g.lineWidth = 2.2 * (1 - k);
    g.beginPath();
    for (const d of [0, 6]) {
      const rr = r + d + out(k) * 7;
      g.moveTo(x - dir * r + Math.cos(c - 0.45) * rr, y + Math.sin(c - 0.45) * rr);
      g.arc(x - dir * r, y, rr, c - 0.45, c + 0.45);
    }
    g.stroke();
  });
}

/** A glint: a four-pointed sparkle that opens and closes. */
export function kira(P: Palette, x: number, y: number, o: { r?: number; life?: number } = {}) {
  const { r = 9, life = 0.6 } = o;
  add(life, (g, k) => {
    const s = r * Math.sin(k * Math.PI) ** 0.6;
    const q = s * 0.16;
    const p = new Path2D();
    p.moveTo(x, y - s);
    p.quadraticCurveTo(x + q, y - q, x + s * 0.7, y);
    p.quadraticCurveTo(x + q, y + q, x, y + s);
    p.quadraticCurveTo(x - q, y + q, x - s * 0.7, y);
    p.quadraticCurveTo(x - q, y - q, x, y - s);
    g.fillStyle = P.fill;
    g.fill(p);
    g.strokeStyle = P.line;
    g.lineWidth = 1.4;
    g.stroke(p);
  });
}

/** A splash crown: tongues of water rise and fall back while drops fly. */
export function splash(P: Palette, x: number, y: number, o: { w?: number; h?: number; life?: number } = {}) {
  const { w = 30, h = 22, life = 0.6 } = o;
  const n = 6;
  const tongues = Array.from({ length: n }, (_, i) => ({ u: i / (n - 1) - 0.5, h: h * rnd(0.55, 1.1) * (1 - Math.abs(i / (n - 1) - 0.5) * 0.7), lean: rnd(-0.4, 0.4) }));
  add(life, (g, k) => {
    const rise = Math.sin(clamp(k / 0.9) * Math.PI);
    const p = new Path2D();
    p.moveTo(x - w * 0.6, y);
    for (const t of tongues) {
      const tx = x + t.u * w * 1.1 + t.lean * t.h * rise;
      const ty = y - t.h * rise;
      p.lineTo(tx - 2.2, y - t.h * rise * 0.3);
      p.lineTo(tx, ty);
      p.lineTo(tx + 2.2, y - t.h * rise * 0.3);
    }
    p.lineTo(x + w * 0.6, y);
    p.closePath();
    g.fillStyle = P.fill;
    g.fill(p);
    g.strokeStyle = P.line;
    g.lineWidth = 1.5;
    g.stroke(p);
  });
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + rnd(-1.1, 1.1);
    const v = rnd(90, 180);
    const r0 = rnd(1.8, 3.4);
    add(life * rnd(0.8, 1.1), (g, k, t) => {
      const r = r0 * (1 - inn(clamp((k - 0.6) / 0.4)));
      g.beginPath();
      g.arc(x + Math.cos(a) * v * t, y - 4 + Math.sin(a) * v * t + 520 * t * t, r, 0, TAU);
      g.fillStyle = P.fill;
      g.fill();
      g.strokeStyle = P.line;
      g.lineWidth = 1.2;
      g.stroke();
    });
  }
}
