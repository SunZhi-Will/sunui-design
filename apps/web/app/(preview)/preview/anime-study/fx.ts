/**
 * anime-fx 原型（2026-11-26，階段 0 樣張用）：彈簧、共用時鐘、畫布層與幾種作畫特效。
 * 只給 anime-study 樣張用，不進 registry。正式引擎在階段 1 另寫成 registry/free/anime-fx。
 * 方法參考 Sakuga VFX（MIT）的規則：雙色加一條線、靠縮小離場不改透明度、壓扁保持體積、特效跟著速度。
 * 程式是重寫的，沒有複製原作。
 */

export type Palette = {
  fill: string; // 亮面
  shade: string; // 陰影面
  line: string; // 外框
  accent: string; // 點綴楔形
  ink: string; // 擬聲字墨色
  tone: boolean; // 陰影面用網點
};

export type WordStyle = "solid" | "hollow" | "dotted";

const TAU = Math.PI * 2;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const out = (t: number) => 1 - (1 - t) ** 3;
const inn = (t: number) => t * t * t;
const back = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** 彈簧：8ms 子步，跟手與落定都用它，不用 easing */
export class Spring {
  v = 0;
  to: number;
  constructor(public x: number, public k = 300, public d = 20) {
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
}

// ───────── 畫布層與時鐘 ─────────

type Fx = { t: number; life: number; draw: (g: CanvasRenderingContext2D, k: number, t: number) => void };
export type Layer = { c: HTMLCanvasElement | null; live: Fx[] };

const front: Layer = { c: null, live: [] };
const layers: Layer[] = [front];
const frames = new Set<(dt: number) => void>();
let timers: { at: number; f: () => void }[] = [];
let now = 0;
let last = 0;
let running = false;

const calm = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function ensureFront() {
  if (front.c || typeof document === "undefined") return;
  const c = document.createElement("canvas");
  c.setAttribute("aria-hidden", "true");
  c.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:60";
  document.body.appendChild(c);
  front.c = c;
}

/** 元件內、控制項後面的畫布（衝擊星要在按鈕後面） */
export function backLayer(c: HTMLCanvasElement): () => void {
  const L: Layer = { c, live: [] };
  layers.push(L);
  return () => {
    const i = layers.indexOf(L);
    if (i >= 0) layers.splice(i, 1);
  };
}

function add(life: number, draw: Fx["draw"], layer?: Layer | null) {
  if (calm()) return;
  if (layer === null) layer = undefined;
  const L = layer ?? front;
  if (L === front) ensureFront();
  L.live.push({ t: 0, life, draw });
  start();
}

export function layerFor(c: HTMLCanvasElement | null) {
  return layers.find((L) => L.c === c) ?? null;
}

export function later(ms: number, f: () => void) {
  timers.push({ at: now + ms / 1000, f });
  start();
}

export function onFrame(f: (dt: number) => void) {
  frames.add(f);
  start();
  return () => frames.delete(f);
}

function paint(dt: number) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  for (const L of layers) {
    const c = L.c;
    if (!c) continue;
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
    // 特效用頁面座標，畫的時候換成這張畫布的座標
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

// 看影格用：window.__animeFx.pause(true) 停住時間，step(秒) 往前推，像 Sakuga 的 look.mjs
let paused = false;
if (typeof window !== "undefined")
  (window as unknown as { __animeFx: unknown }).__animeFx = {
    pause: (v = true) => {
      paused = v;
      start();
    },
    step: (sec: number) => {
      for (let t = 0; t < sec; t += 1 / 60) advance(1 / 60);
    },
  };

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
  if (paused) {
    requestAnimationFrame(loop);
    return;
  }
  advance(dt);
  if (!frames.size && !timers.length && layers.every((L) => !L.live.length)) {
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

/** 元素上的一點，頁面座標 */
export function at(el: Element, fx = 0.5, fy = 0.5) {
  const b = el.getBoundingClientRect();
  return { x: b.left + scrollX + b.width * fx, y: b.top + scrollY + b.height * fy, w: b.width, h: b.height };
}

// ───────── 填色 ─────────

const tones = new Map<string, CanvasPattern | null>();
function toneOf(g: CanvasRenderingContext2D, dot: string, bg: string, r = 1.6, gap = 5) {
  const key = dot + bg + r + gap;
  if (tones.has(key)) return tones.get(key)!;
  const t = document.createElement("canvas");
  t.width = gap * 2;
  t.height = gap * 2;
  const x = t.getContext("2d")!;
  x.fillStyle = bg;
  x.fillRect(0, 0, t.width, t.height);
  x.fillStyle = dot;
  for (const [px, py] of [[0, 0], [gap * 2, 0], [0, gap * 2], [gap * 2, gap * 2], [gap, gap]]) {
    x.beginPath();
    x.arc(px, py, r, 0, TAU);
    x.fill();
  }
  const p = g.createPattern(t, "repeat");
  tones.set(key, p);
  return p;
}

function shadeFill(g: CanvasRenderingContext2D, P: Palette) {
  return P.tone ? (toneOf(g, P.line, P.fill) ?? P.shade) : P.shade;
}

/** 圓組成的一團：外框、陰影面、亮面往左上偏 */
function blob(g: CanvasRenderingContext2D, P: Palette, cs: [number, number, number][], lw = 1.6) {
  const u = new Path2D();
  const lit = new Path2D();
  for (const [x, y, r] of cs) {
    if (r <= 0.4) continue;
    u.moveTo(x + r, y);
    u.arc(x, y, r, 0, TAU);
    lit.moveTo(x - r * 0.18 + r * 0.78, y - r * 0.2);
    lit.arc(x - r * 0.18, y - r * 0.2, r * 0.78, 0, TAU);
  }
  g.strokeStyle = P.line;
  g.lineWidth = lw * 2;
  g.stroke(u);
  g.fillStyle = shadeFill(g, P);
  g.fill(u);
  g.fillStyle = P.fill;
  g.fill(lit);
}

// ───────── 特效 ─────────

/** 一團煙：膨脹帶一點過衝、翻滾、縮小離場 */
export function puff(P: Palette, x: number, y: number, o: { n?: number; size?: number; vx?: number; vy?: number; life?: number } = {}) {
  const { n = 5, size = 13, vx = 0, vy = -18, life = 0.8 } = o;
  const lobes = Array.from({ length: n }, (_, i) => ({ a: (i / n) * TAU + rnd(0, 0.6), d: rnd(0.25, 0.9) * size, r: rnd(0.55, 1) * size, sp: rnd(0.6, 1.3) }));
  add(life, (g, k, t) => {
    const grow = back(clamp(t / 0.22));
    const die = 1 - inn(clamp((k - 0.5) / 0.5));
    const px = x + vx * out(k) * life;
    const py = y + vy * out(k) * life;
    blob(g, P, lobes.map((l) => [px + Math.cos(l.a + t * l.sp) * l.d * (0.5 + out(k)), py + Math.sin(l.a + t * l.sp) * l.d * (0.5 + out(k)) - out(k) * 5, l.r * grow * die]));
  });
}

/** 衝擊星：點綴色的針、陰影面的大星、亮面的小星；離場時星尖變細到沒有 */
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
      const big = star(R * 1.16, 0.19, hollow);
      g.fillStyle = shadeFill(g, P);
      g.fill(big);
      g.strokeStyle = P.line;
      g.lineWidth = 1.4;
      g.stroke(big);
      const small = star(R * 0.84, 0, hollow);
      g.fillStyle = P.fill;
      g.fill(small);
      g.stroke(small);
    },
    layer,
  );
}

/** 水晶碎片：長切面，翻滾落下，縮小離場 */
export function shards(P: Palette, x: number, y: number, o: { n?: number; speed?: number; size?: number; life?: number; dir?: number; arc?: number } = {}) {
  const { n = 7, speed = 190, size = 5, life = 0.75, dir = -Math.PI / 2, arc = Math.PI } = o;
  for (let i = 0; i < n; i++) {
    const a = dir + rnd(-arc, arc) / 2;
    const v = speed * rnd(0.5, 1.15);
    const s = size * rnd(0.6, 1.4);
    const spin = rnd(-7, 7);
    const pts = [[-1.4, 0.1], [-0.6, -0.7], [1.2, -0.45], [1.5, 0.15], [0.4, 0.75]];
    add(life * rnd(0.7, 1), (g, k, t) => {
      const sc = s * (1 - inn(clamp((k - 0.6) / 0.4)));
      g.translate(x + Math.cos(a) * v * t, y + Math.sin(a) * v * t + 420 * t * t);
      g.rotate(spin * t);
      const p = new Path2D();
      pts.forEach(([px, py], m) => (m ? p.lineTo(px * sc, py * sc) : p.moveTo(px * sc, py * sc)));
      p.closePath();
      g.fillStyle = P.fill;
      g.fill(p);
      g.strokeStyle = P.line;
      g.lineWidth = 1.3;
      g.stroke(p);
    });
  }
}

/** 點綴楔形：指向某處再飛離 */
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

/** 速度線：往一個方向射出再變細 */
export function lines(P: Palette, x: number, y: number, o: { n?: number; dir?: number; len?: number; spread?: number; life?: number } = {}) {
  const { n = 5, dir = Math.PI, len = 40, spread = 22, life = 0.3 } = o;
  const ls = Array.from({ length: n }, () => ({ off: rnd(-spread, spread), l: len * rnd(0.6, 1.1) }));
  add(life, (g, k) => {
    g.strokeStyle = P.line;
    g.lineWidth = 2.4 * (1 - k);
    const nx = Math.cos(dir);
    const ny = Math.sin(dir);
    g.beginPath();
    for (const s of ls) {
      const bx = x - ny * s.off;
      const by = y + nx * s.off;
      const h = out(k) * s.l;
      const tl = inn(k) * s.l;
      g.moveTo(bx + nx * tl, by + ny * tl);
      g.lineTo(bx + nx * h, by + ny * h);
    }
    g.stroke();
  });
}

/** 晃動弧線：剛停下的東西旁邊兩道小弧 */
export function wob(P: Palette, x: number, y: number, o: { dir?: number; r?: number; life?: number } = {}) {
  const { dir = 1, r = 14, life = 0.4 } = o;
  add(life, (g, k) => {
    g.strokeStyle = P.line;
    g.lineWidth = 2.2 * (1 - k);
    const c = dir > 0 ? 0 : Math.PI;
    g.beginPath();
    for (const d of [0, 6]) {
      const rr = r + d + out(k) * 7;
      g.moveTo(x - dir * r + Math.cos(c - 0.45) * rr, y + Math.sin(c - 0.45) * rr);
      g.arc(x - dir * r, y, rr, c - 0.45, c + 0.45);
    }
    g.stroke();
  });
}

/** 閃光：四角星張開再收起 */
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

// ───────── 擬聲字 ─────────

/** 固定種子的亂數，同一個字每次排出來一樣 */
function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/**
 * 畫一個擬聲字：每個字各自轉一點、大小不一，越後面越往上（漫畫的字會跳）。
 * solid：墨色字加白邊再一圈墨；hollow：白字墨邊；dotted：網點字。
 */
export function drawWord(
  g: CanvasRenderingContext2D,
  P: Palette,
  text: string,
  x: number,
  y: number,
  size: number,
  style: WordStyle,
  family: string,
  seed = 7,
) {
  const r = seeded(seed);
  const chars = [...text];
  g.save();
  g.font = `900 ${size}px ${family}`;
  g.textBaseline = "middle";
  g.lineJoin = "round";
  const metrics = chars.map((ch, i) => {
    const big = ch === "!" || ch === "！" ? 0.95 : i === 0 ? 1.12 : 0.92 + r() * 0.12;
    g.font = `900 ${size * big}px ${family}`;
    return { ch, big, w: g.measureText(ch).width * 0.86, rot: (r() - 0.5) * 0.32, dy: -i * size * 0.06 + (r() - 0.5) * size * 0.08 };
  });
  const total = metrics.reduce((s, m) => s + m.w, 0);
  const cx = x - total / 2;
  const edge = Math.max(2, size * 0.05);
  const pass = (fn: (m: (typeof metrics)[number], px: number) => void) => {
    let px = cx;
    for (const m of metrics) {
      fn(m, px + m.w / 2);
      px += m.w;
    }
  };
  const glyph = (m: (typeof metrics)[number], px: number, paint: () => void) => {
    g.save();
    g.translate(px, y + m.dy);
    g.rotate(m.rot);
    g.font = `900 ${size * m.big}px ${family}`;
    g.textAlign = "center";
    paint();
    g.restore();
  };
  // 筆畫細的中文字（砰、喀）邊太粗會把字裡的空隙填滿，所以邊用字級的 5%
  // 外圈：實心與網點是墨色，空心是白色（深色底上也讀得到）
  const outer = style === "hollow" ? "#ffffff" : P.ink;
  const inner = style === "hollow" ? P.ink : "#ffffff";
  pass((m, px) => glyph(m, px, () => {
    g.strokeStyle = outer;
    g.lineWidth = edge * 2.2;
    g.strokeText(m.ch, 0, 0);
  }));
  pass((m, px) => glyph(m, px, () => {
    g.strokeStyle = inner;
    g.lineWidth = edge * (style === "hollow" ? 1.1 : 1.2);
    g.strokeText(m.ch, 0, 0);
  }));
  pass((m, px) => glyph(m, px, () => {
    if (style === "solid") g.fillStyle = P.ink;
    else if (style === "hollow") g.fillStyle = "#ffffff";
    else {
      const gap = Math.max(2.6, size * 0.05);
      g.fillStyle = toneOf(g, P.ink, "#ffffff", gap * 0.36, gap) ?? P.ink;
    }
    g.fillText(m.ch, 0, 0);
    if (style === "dotted") {
      g.strokeStyle = P.ink;
      g.lineWidth = Math.max(1, edge * 0.4);
      g.strokeText(m.ch, 0, 0);
    }
  }));
  g.restore();
}

/** 擬聲字落下：大一號落地、彈簧回到原尺寸、待著時微晃、最後縮小離場 */
export function sfx(P: Palette, text: string, x: number, y: number, o: { size?: number; rot?: number; life?: number; style?: WordStyle; family: string }) {
  const { size = 64, rot = -0.12, life = 1, style = "solid", family } = o;
  const s = new Spring(0.2, 520, 17);
  s.to = 1;
  let lastT = 0;
  const seed = Math.floor(Math.random() * 1e6);
  add(life, (g, k, t) => {
    const sc = s.step(t - lastT) * (1 - inn(clamp((k - 0.86) / 0.14)));
    lastT = t;
    if (sc < 0.02) return;
    g.translate(x, y);
    g.rotate(rot + Math.sin(t * 14) * 0.015);
    g.scale(sc, sc);
    drawWord(g, P, text, 0, 0, size, style, family, seed);
  });
}
