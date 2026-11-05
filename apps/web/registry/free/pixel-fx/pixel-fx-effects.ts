// Pixel FX effects, ported from pixelfx (https://github.com/patch-gg/pixelfx): pickups/collect-burst,
// ui/confetti and transitions/pixel-dissolve. MIT License, Copyright (c) 2026 Patch, Copyright (c) 2026 Hugo
// Duprez. The pop, the confetti flutter and the glints follow Sprite Fusion's open-source pickup, falling
// leaves and sparkle (https://www.spritefusion.com/pixel-art-vfx), MIT License, Copyright (c) 2026 Hugo Duprez.
// Changes from the originals: frame size is the caller's, default palettes follow SunUI's story tokens, and
// the confetti's smoke is left out.

import {
  type Color,
  type FxDefinition,
  type Painter,
  Lights,
  Rng,
  TAU,
  WHITE,
  clamp,
  ease,
  fbm,
  glint,
  hex,
  mix,
  rand,
  scale,
  seg,
  sparkle,
} from "./pixel-fx-core";

/** Ink to lamp gold to white: the story series' accent as a pixel ramp. */
export const GOLD_RAMP = ["#0b0e14", "#2a1f12", "#5a4122", "#8a6a3a", "#c9a063", "#e2c28a", "#f3e3c0", "#ffffff"] as const;
/** Vermilion, gold and paper: SunUI's brand colors as confetti. */
export const PAPER_CONFETTI = ["#171717", "#a3a3a3", "#f7f7f7", "#d4d4d4", "#ededed", "#e6e6e6", "#525252"] as const;

/**
 * The moment of a pickup: a white flash and a cross of light, a thin ring snapping out ahead of a softer one,
 * twinkles thrown wide on curving paths that brake, hang and wink out. Origin: the thing being collected.
 */
export const collectBurst: FxDefinition = {
  name: "collect-burst",
  palette: GOLD_RAMP,
  steps: 8,
  origin: [0.5, 0.5],
  create({ palette: C, seed }) {
    const R = new Rng(seed), lights = new Lights();
    lights.add(0, 0, 36, C[5], 0.85, 0.32);
    lights.add(0, 0, 14, WHITE, 0.75, 0.08);
    const stars = Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * TAU + R.range(-0.2, 0.2), sp = R.range(145, 225) * (i % 3 === 0 ? 1.12 : 0.85);
      return { x: 0, y: 0, a, sp, turn: (i % 2 ? 1 : -1) * R.range(2.5, 5), life: R.range(0.75, 1.15), age: 0, size: i % 3 === 0 ? 2.6 : R.range(1.2, 2), tr: [] as [number, number][], c: i % 4 === 0 ? WHITE : i % 2 ? C[6] : C[5], ph: R.range(0, TAU) };
    });
    const motes = Array.from({ length: 7 }, () => ({ x: R.range(-8, 8), y: R.range(-4, 6), vy: -R.range(12, 30), life: R.range(0.5, 0.9), d: R.range(0.05, 0.25), w: R.range(0, TAU) }));
    let t = 0;
    return {
      duration: 1.35,
      update(dt) {
        t += dt;
        for (const s of stars) {
          if (s.age > s.life) continue;
          s.age += dt;
          s.tr.unshift([s.x, s.y]);
          if (s.tr.length > 4) s.tr.pop();
          s.a += s.turn * dt * Math.max(0, 1 - s.age * 1.5);
          s.sp -= s.sp * 4.3 * dt;
          s.x += Math.cos(s.a) * s.sp * dt;
          s.y += Math.sin(s.a) * s.sp * dt + 6 * s.age * dt;
        }
        lights.update(dt);
      },
      draw(p) {
        if (t < 0.07) p.circle(0, 0, 5.5 * (1 - t / 0.07) + 1, WHITE);
        if (t < 0.16) {
          const k = 1 - t / 0.16, L = 26 * ease.outCubic(Math.min(1, t / 0.03 + 0.4)) * k;
          for (const [dx, dy, l] of [[1, 0, 1], [-1, 0, 1], [0, 1, 0.6], [0, -1, 0.6]])
            p.line(0, 0, dx * L * l, dy * L * l, (u) => (u < 0.3 ? WHITE : u < 0.65 ? C[6] : C[5]), (u) => (u < 0.5 ? 1 : (1 - u) * 2) * (0.5 + k));
          p.glow(0, 0, 20 * k + 4, C[5], 0.6 * k);
        }
        const u1 = t / 0.32;
        if (u1 < 1) {
          const r = 3 + 23 * ease.outExpo(u1);
          p.ring(0, 0, r, 1, u1 < 0.3 ? WHITE : C[6], 1.3 - u1 * 1.2);
          p.glowRing(0, 0, r, 4, C[5], 0.4 * (1 - u1));
        }
        const u2 = (t - 0.04) / 0.5;
        if (u2 > 0 && u2 < 1) p.ring(0, 0, 2 + 16 * ease.outCubic(u2), Math.max(1, 2.6 * (1 - u2)), C[5], 1 - u2);
        for (const s of stars) {
          if (s.age > s.life) continue;
          const k = 1 - s.age / s.life, tw = 0.65 + 0.35 * Math.sin(s.age * 26 + s.ph);
          s.tr.forEach(([x, y], i) => i > 0 && p.dot(x, y, i < 2 ? C[5] : C[4], (1 - i / 4) * k * 1.4));
          if (k < 0.3 && Math.sin(s.age * 40 + s.ph) < 0) continue;
          sparkle(p, s.x, s.y, Math.round(s.size * tw * Math.min(1, k * 2.5)), s.c, scale(s.c, 0.8), 0.45 * k);
        }
        for (const m of motes) {
          const a = t - m.d;
          if (a < 0 || a > m.life) continue;
          const k = 1 - a / m.life, x = m.x + Math.sin(a * 6 + m.w) * 1.5, y = m.y + m.vy * a;
          p.dot(x, y, k > 0.5 ? C[6] : C[5], k * 1.5);
          p.glow(x + 0.5, y + 0.5, 3, C[5], 0.3 * k);
        }
        lights.draw(p);
      },
    };
  },
};

const INK = hex("#141019");

// a party popper: a striped cone pointing along a, kicked back k px when it fires
function popper(p: Painter, x: number, y: number, a: number, k: number, stripe: Color, alpha: number) {
  const ca = Math.cos(a), sa = Math.sin(a), bx = x - ca * k, by = y - sa * k;
  p.shade(bx - 12, by - 12, bx + 12, by + 12, (px, py, o) => {
    const dx = px - bx, dy = py - by, u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
    if (u < 0 || u > 11) return;
    const hw = 0.8 + u * 0.32;
    if (Math.abs(v) > hw + 0.6) return;
    o.a = alpha;
    if (Math.abs(v) > hw - 0.4 || u > 10.2 || u < 0.8) return INK;
    const on = Math.floor((u + v * 0.6) / 2.2) % 2 === 0;
    return on ? (v < 0 ? stripe : scale(stripe, 0.75)) : v < 0 ? WHITE : hex("#c8c0d8");
  });
}

/**
 * Two party poppers bang one after the other: paper bits and curly streamers burst out, stall, then tumble
 * and flutter down, flipping, and settle on the floor. Origin: the middle of the floor.
 */
export const confetti: FxDefinition = {
  name: "confetti",
  palette: PAPER_CONFETTI,
  steps: 7,
  origin: [0.5, 1],
  create({ w, h, palette: C, seed }) {
    const R = new Rng(seed), lights = new Lights(), D = 3.4, end = D - 0.05;
    // the original stage is 200 x 140; throws scale with the frame's height so the paper reaches the top
    const K = clamp(h / 140, 0.6, 2.4), side = Math.max(16, Math.min(w / 2 - 12, 74 * K));
    const poppers = [
      { x: -side, y: -1, a: -Math.PI / 2 + 0.62, t: 0.1, fired: false },
      { x: side, y: -1, a: -Math.PI / 2 - 0.62, t: 0.26, fired: false },
    ];
    type Bit = { x: number; y: number; vx: number; vy: number; c: Color; w: number; h: number; ang: number; spin: number; flip: number; fs: number; ph: number; amp: number; fw: number; x0: number; mode: number; fall: number };
    type Ribbon = { pts: [number, number][]; vx: number; vy: number; c: Color; ph: number; amp: number; fw: number; mode: number; x0: number; curl: number; fall: number };
    type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number };
    const bits: Bit[] = [], ribbons: Ribbon[] = [], sparks: Spark[] = [];
    const kick = (t: number, pp: (typeof poppers)[number]) => (t < pp.t ? 0 : 3 * Math.exp(-(t - pp.t) * 14));

    function fire(pp: (typeof poppers)[number]) {
      const mx = pp.x + Math.cos(pp.a) * 11, my = pp.y + Math.sin(pp.a) * 11;
      lights.add(mx, my, 34, WHITE, 0.6, 0.12);
      lights.add(mx, my, 50, C[1], 0.4, 0.4);
      for (let i = 0; i < 12; i++) {
        const an = pp.a + R.range(-0.5, 0.5), sp = R.range(120, 260);
        sparks.push({ x: mx, y: my, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, life: R.range(0.1, 0.25), max: 0.25 });
      }
      for (let i = 0; i < 46; i++) {
        const an = pp.a + R.range(-0.38, 0.38), sp = R.range(200, 380) * K;
        bits.push({ x: mx, y: my, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, c: R.pick(C), w: R.range(2, 3), h: R.range(3, 4.6), ang: R.range(0, TAU), spin: R.range(-14, 14), flip: R.range(0, TAU), fs: R.range(5, 13), ph: R.range(0, TAU), amp: R.range(5, 12), fw: R.range(2, 3.4), x0: 0, mode: 0, fall: R.range(26, 40) });
      }
      for (let i = 0; i < 4; i++) {
        const an = pp.a + R.range(-0.25, 0.25), sp = R.range(220, 330) * K;
        ribbons.push({ pts: Array.from({ length: 11 }, () => [mx, my] as [number, number]), vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, c: R.pick(C), ph: R.range(0, TAU), amp: R.range(6, 12), fw: R.range(1.5, 2.4), mode: 0, x0: 0, curl: R.range(0.7, 1.1), fall: R.range(22, 32) });
      }
    }

    let t = 0;
    return {
      duration: D,
      update(dt) {
        t += dt;
        for (const pp of poppers) if (!pp.fired && t >= pp.t) (pp.fired = true), fire(pp);
        for (const b of bits) {
          if (b.mode === 2) continue;
          b.flip += b.fs * dt;
          if (b.mode === 0) {
            // the burst: heavy drag, a little gravity, tumbling fast; once slow it starts to flutter
            b.vx -= b.vx * 3.4 * dt;
            b.vy -= b.vy * 3.4 * dt - 140 * dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.ang += b.spin * dt;
            if (Math.hypot(b.vx, b.vy) < 40) (b.mode = 1), (b.x0 = b.x - Math.sin(b.ph) * b.amp);
          } else {
            b.ph += b.fw * dt;
            b.x0 += b.vx * dt;
            b.vx -= b.vx * 2 * dt;
            b.x = b.x0 + Math.sin(b.ph) * b.amp;
            b.y += b.fall * K * (0.4 + 0.9 * Math.abs(Math.cos(b.ph))) * dt;
            b.ang = Math.cos(b.ph) * 0.9;
            if (b.y >= -1) (b.y = -0.5), (b.mode = 2), (b.ang = R.range(-0.3, 0.3)), (b.flip = 0);
          }
        }
        for (const r of ribbons) {
          const hd = r.pts[0];
          if (r.mode === 0) {
            r.vx -= r.vx * 3 * dt;
            r.vy -= r.vy * 3 * dt - 120 * dt;
            hd[0] += r.vx * dt;
            hd[1] += r.vy * dt;
            if (Math.hypot(r.vx, r.vy) < 35) (r.mode = 1), (r.x0 = hd[0] - Math.sin(r.ph) * r.amp);
          } else if (hd[1] < -1) {
            r.ph += r.fw * dt;
            r.x0 += r.vx * dt;
            r.vx -= r.vx * 2 * dt;
            hd[0] = r.x0 + Math.sin(r.ph) * r.amp;
            hd[1] += r.fall * K * (0.5 + 0.7 * Math.abs(Math.cos(r.ph))) * dt;
          }
          // the tail follows the head link by link and hangs a little
          for (let i = 1; i < r.pts.length; i++) {
            const a = r.pts[i - 1], b = r.pts[i];
            b[1] = Math.min(-0.5, b[1] + 20 * dt);
            const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
            if (d > 2.6) (b[0] = a[0] + (dx / d) * 2.6), (b[1] = a[1] + (dy / d) * 2.6);
          }
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          if ((s.life -= dt) <= 0) {
            sparks.splice(i, 1);
            continue;
          }
          s.vx -= s.vx * 2.2 * dt;
          s.vy += 430 * dt - s.vy * 2.2 * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
        }
        lights.update(dt);
      },
      draw(p) {
        const fade = 1 - seg(t, end - 0.45, end - 0.05);
        for (const pp of poppers) {
          popper(p, pp.x, pp.y, pp.a, kick(t, pp), C[0], 1 - seg(t, 2.5, 2.9));
          const ft = t - pp.t;
          if (ft > 0 && ft < 0.12) sparkle(p, pp.x + Math.cos(pp.a) * 13, pp.y + Math.sin(pp.a) * 13, 7 * (1 - ft / 0.12), WHITE, C[1], 0.7);
        }
        for (const s of sparks) {
          const sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp, len = Math.min(9, 1 + sp * 0.022), k = s.life / s.max;
          p.line(s.x - ux * len, s.y - uy * len, s.x, s.y, k > 0.5 ? WHITE : hex("#ffc23d"));
        }
        for (const r of ribbons) {
          const pts = r.pts.map(([x, y], i) => [x + Math.sin(i * r.curl + t * 9 + r.ph) * (i ? 1.6 : 0), y]);
          for (let i = 1; i < pts.length; i++) {
            const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], front = Math.sin(i * r.curl + t * 9 + r.ph) > 0;
            p.line(x0, y0, x1, y1, front ? r.c : scale(r.c, 0.6), fade);
            p.line(x0 + 1, y0, x1 + 1, y1, front ? mix(r.c, WHITE, 0.35) : scale(r.c, 0.45), fade);
          }
        }
        // paper bits: a little card turned by its tilt, its width by its flip; the back side shows darker
        for (const b of bits) {
          if (b.y > 1) continue;
          if (b.mode === 2) {
            p.dot(b.x, b.y, scale(b.c, 0.8), fade);
            p.dot(b.x + 1, b.y, scale(b.c, 0.6), fade);
            continue;
          }
          const fw = Math.cos(b.flip), wd = Math.max(0.5, Math.abs(fw) * b.w), ca = Math.cos(b.ang), sa = Math.sin(b.ang);
          const c = fw >= 0 ? b.c : scale(b.c, 0.62);
          p.shade(b.x - 4, b.y - 4, b.x + 4, b.y + 4, (x, y, out) => {
            const dx = x - b.x, dy = y - b.y, u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
            if (Math.abs(u) > wd / 2 + 0.2 || Math.abs(v) > b.h / 2) return;
            out.a = fade;
            return Math.abs(fw) > 0.92 && v < -b.h / 2 + 1 ? WHITE : c;
          });
          if (Math.abs(fw) > 0.97) p.glow(b.x, b.y, 5, mix(b.c, WHITE, 0.5), 0.35 * fade);
        }
        lights.draw(p);
      },
    };
  },
};

// ---- pixel dissolve: blocks over the whole frame, each winking in and out at its own time read off a
// clumpy noise field, so they gather in growing patches.

const DP = 0.17, IN0 = 0.04, IN1 = 0.8, OUT0 = 1.12, OUT1 = 1.85;
type Block = { x: number; y: number; s: number; tin: number; tout: number; glint: boolean; gx: number; gy: number; spin: number; L: number };

function layout(w: number, h: number, cell: number, seed: number) {
  const blocks: Block[] = [];
  for (let cy = 0; cy < Math.ceil(h / cell); cy++)
    for (let cx = 0; cx < Math.ceil(w / cell); cx++) {
      const r = rand(cx, cy, seed), n = r < 0.32 ? 1 : r < 0.74 ? 2 : 4, s = cell / n;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) blocks.push({ x: cx * cell + i * s, y: cy * cell + j * s, s, tin: 0, tout: 0, glint: false, gx: 0, gy: 0, spin: 0, L: 0 });
    }
  const rank = (key: (b: Block) => number) => {
    const v = blocks.map(key), out = new Float32Array(v.length);
    v.map((_, i) => i).sort((a, b) => v[a] - v[b]).forEach((i, k) => (out[i] = k / Math.max(1, v.length - 1)));
    return out;
  };
  const at = (b: Block, sd: number) => fbm((b.x + b.s / 2) / 64, (b.y + b.s / 2) / 64, sd, 3);
  const big = (b: Block) => b.s === cell, small = (b: Block) => b.s === cell / 4;
  const uin = rank((b) => at(b, seed) + 0.22 * rand(b.x, b.y, seed + 1) + (big(b) ? 0.12 : small(b) ? -0.08 : 0));
  const uout = rank((b) => at(b, seed + 7) + 0.22 * rand(b.x, b.y, seed + 2) + (big(b) ? -0.14 : small(b) ? 0.1 : 0));
  blocks.forEach((b, i) => {
    b.tin = IN0 + uin[i] * (IN1 - IN0);
    b.tout = OUT0 + uout[i] * (OUT1 - OUT0);
    b.glint = rand(b.x, b.y, seed + 3) < (b.s >= cell / 2 ? 0.32 : 0.1);
    b.gx = b.x + (rand(b.x, b.y, seed + 4) < 0.5 ? 0 : b.s);
    b.gy = b.y + (rand(b.x, b.y, seed + 5) < 0.5 ? 0 : b.s);
    b.spin = (rand(b.x, b.y, seed + 6) - 0.5) * 3;
    b.L = big(b) && rand(b.x, b.y, seed + 8) < 0.45 ? 9 + 6 * rand(b.x, b.y, seed + 9) : 2.5 + b.s * 0.32;
  });
  return blocks;
}

function square(p: Painter, x: number, y: number, s: number, fill: Color, rim: Color) {
  const X = Math.round(x), Y = Math.round(y), S = Math.max(1, Math.round(s));
  if (fill) p.rect(X, Y, S, S, fill);
  if (rim && S > 2) p.rect(X, Y, S, 1, rim), p.rect(X, Y + S - 1, S, 1, rim), p.rect(X, Y, 1, S, rim), p.rect(X + S - 1, Y, 1, S, rim);
}

function mote(p: Painter, x: number, y: number, c: Color, cross: boolean) {
  p.px(x, y, c);
  if (cross) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.px(x + dx, y + dy, c);
}

function dissolve(start: number, name: string, seams: boolean): FxDefinition {
  return {
    name,
    palette: GOLD_RAMP,
    steps: 8,
    origin: [0, 0],
    create({ w, h, palette: C, seed }) {
      // cells of about a sixteenth of the frame's width, kept between 12 and 24 art pixels
      const cell = Math.round(clamp(w / 16, 12, 24) / 4) * 4, blocks = layout(w, h, cell, seed), ink = C[0];
      let t = start;
      return {
        duration: 2.2 - start,
        update(dt) {
          t += dt;
        },
        draw(p) {
          const frame = Math.floor(t * 15), glints: [Block, number, number][] = [];
          for (let n = 0; n < blocks.length; n++) {
            const b = blocks[n], ki = (t - b.tin) / DP, ko = (t - b.tout) / DP, { x, y, s } = b, cx = x + s / 2, cy = y + s / 2;
            if (ki < 0 || ko >= 1.6) continue;
            if (ko < 0) {
              // a reveal rests covered, so its blocks show faint seams and read as a seal, not an empty box
              if (ki >= 1) square(p, x, y, s, ink, seams ? C[1] : 0);
              else {
                // winking in: a white outline swells to the block, it fills with ink, its rim cools down the ramp
                const g = ki < 0.35 ? 0.35 + 0.65 * ease.outBack(ki / 0.35) : 1, hh = s * g;
                const rim = ki < 0.45 ? WHITE : ki < 0.6 ? C[6] : ki < 0.75 ? C[5] : ki < 0.9 ? C[4] : C[3];
                square(p, cx - hh / 2, cy - hh / 2, hh, ki > 0.2 ? ink : 0, rim);
                p.glow(cx, cy, s * 0.8 + 4, C[5], 0.45 * (1 - ki));
              }
              if (b.glint && ki > 0.15 && ki < 1.6) glints.push([b, (ki - 0.15) / 1.45, 1]);
              if (ki < 1.4 && rand(frame, n, 9) < 0.35) mote(p, x + rand(frame, n, 10) * (s + 6) - 3, y + rand(frame, n, 11) * (s + 6) - 3, rand(frame, n, 12) < 0.5 ? WHITE : C[6], rand(frame, n, 17) < 0.25);
            } else {
              if (ko < 0.35) {
                // winking out: its rim lights up...
                const q = ko / 0.35;
                square(p, x, y, s, ink, q < 0.4 ? C[4] : q < 0.75 ? C[5] : C[6]);
                p.glow(cx, cy, s * 0.8 + 3, C[4], 0.35 * q);
              } else if (ko < 0.75) {
                // ...the ink drops away and the white outline collapses into its heart
                const q = (ko - 0.35) / 0.4, hh = s * (1 - ease.inQuad(q) * 0.85);
                square(p, cx - hh / 2, cy - hh / 2, hh, 0, q < 0.5 ? WHITE : C[6]);
                p.glow(cx, cy, s * 0.8 + 4, C[5], 0.45 * (1 - q * 0.5));
              } else if (ko < 1) {
                const q = (ko - 0.75) / 0.25;
                for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (!(dx || dy) || q < 0.5) p.px(cx - 0.5 + dx, cy - 0.5 + dy, dx || dy ? C[6] : WHITE);
                p.glow(cx, cy, s * 0.5 + 3, C[5], 0.35 * (1 - q));
              }
              if (b.glint && ko > 0.3) glints.push([b, (ko - 0.3) / 1.3, -1]);
              if (ko > 0.3 && ko < 1.5 && rand(frame, n, 13) < 0.3) mote(p, x + rand(frame, n, 14) * (s + 6) - 3, y + rand(frame, n, 15) * (s + 6) - 3, rand(frame, n, 16) < 0.5 ? WHITE : C[6], rand(frame, n, 18) < 0.25);
            }
          }
          for (const [b, u, dir] of glints) {
            if (u <= 0 || u >= 1) continue;
            const L = b.L * Math.pow(Math.sin(Math.PI * u), 0.7);
            glint(p, b.gx, b.gy, L, b.spin * u * dir + 0.4, C[5], C[4]);
          }
        },
      };
    },
  };
}

/** Blocks wink in over the whole frame, hold, then wink out: a screen transition (cover, then uncover). */
export const pixelDissolve = dissolve(0, "pixel-dissolve", false);
/** Starts fully covered and only winks out: unveils whatever is underneath (a prize, a code, a new screen). */
export const pixelReveal = dissolve(OUT0 - 0.02, "pixel-reveal", true);
