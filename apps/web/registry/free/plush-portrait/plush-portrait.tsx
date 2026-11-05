"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * PlushPortrait: a cut-out portrait you can grab and stretch like a soft toy.
 *
 * The picture is a grid of nodes. Each node stores how far it has been pushed
 * from home (u) and obeys a damped wave equation with a restoring term:
 *
 *   ü = c²∇²u − ω²u − γu̇ + ν∇²u̇
 *
 * ∇²u lets a pull drag the skin around it, −ω²u ties the skin back to the
 * skull, γ settles the wobble and ν∇²u̇ swallows fine ripples first. On top of
 * that the head leans toward a pull on a slower spring, like a soft neck.
 * Faces cross-fade on hover, grab, pull and release; the eyes follow the
 * cursor, blink, and the portrait yawns when the page goes quiet.
 *
 * One WebGL draw, no dependencies. Without WebGL, or with reduced motion, it
 * stays a still picture.
 */

export const plushFrames = ["circle", "square", "none"] as const;
export type PlushFrame = (typeof plushFrames)[number];

/**
 * Image URLs, all the same size and framing so they can be cross-faded.
 * Only `rest` is required; a missing face is skipped.
 */
export type PlushFaces = {
  rest: string;
  /** A mouse resting on the face. */
  hover?: string;
  /** The moment it is grabbed, and after a tap or a poke. */
  grab?: string;
  /** Stretched far. */
  pull?: string;
  /** Just let go after a big pull. */
  dazed?: string;
  /** Eyes shut, shown for a moment every few seconds. */
  blink?: string;
  lookLeft?: string;
  lookRight?: string;
  /** Played when nobody has touched the page for a while (a yawn). */
  idle?: string;
};

type FaceKey = keyof PlushFaces;

export type PlushPortraitProps = {
  faces: PlushFaces;
  alt: string;
  /** The bust is clipped to this shape and the head pops out above it. */
  frame?: PlushFrame;
  /** Frame position in image space (0 to 1): centre height and half size. */
  frameBox?: { y: number; r: number };
  /** Classes for the shape behind the bust. Defaults to the primary color. */
  backdropClassName?: string;
  /** Wobble pitch in Hz. Lower is floppier. */
  wobble?: number;
  /** How far a pull spreads, in image widths. */
  reach?: number;
  /** Eyes follow the cursor (needs lookLeft and lookRight). */
  follow?: boolean;
  /** Yawn and blink on their own. */
  idle?: boolean;
  /** Accessible label of the poke button (keyboard and screen readers). */
  pokeLabel?: string;
  className?: string;
};

// ---------------------------------------------------------------- tuning

const GRID = 36; // cells per side
const PAD = 0.32; // empty margin around the image, in image widths
const GRAB_R = 0.1; // size of a handful
const RUB_R = 0.08; // skin a hovering cursor catches
const MAX_PULL = 0.5; // rubber band limit
const DAMPING = 0.14;
const FLESH = 0.35;

// ---------------------------------------------------------------- shaders

const VERT = `
attribute vec2 aPos;
attribute vec2 aUv;
attribute float aShade;
uniform float uPad;
uniform vec2 uPivot;
uniform float uTilt;
uniform vec2 uShift;
varying vec2 vUv;
varying float vShade;
void main() {
  vec2 p = aPos - uPivot;
  float s = sin(uTilt), c = cos(uTilt);
  p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + uPivot + uShift;
  vec2 q = (p + uPad) / (1.0 + 2.0 * uPad);
  gl_Position = vec4(q.x * 2.0 - 1.0, 1.0 - q.y * 2.0, 0.0, 1.0);
  vUv = aUv;
  vShade = aShade;
}`;

const FRAG = `
precision mediump float;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uMix;
uniform int uFrame;
uniform vec3 uBox;
varying vec2 vUv;
varying float vShade;
void main() {
  vec4 col = mix(texture2D(uA, vUv), texture2D(uB, vUv), uMix);
  float keep = 1.0;
  if (uFrame > 0 && vUv.y > uBox.y) {
    float edge;
    if (uFrame == 1) edge = uBox.z - distance(vUv, uBox.xy);
    else edge = uBox.z - max(abs(vUv.x - uBox.x), abs(vUv.y - uBox.y));
    keep = smoothstep(0.0, 0.004, edge);
  }
  gl_FragColor = vec4(col.rgb * vShade, col.a) * keep;
}`;

// ---------------------------------------------------------------- engine

type Engine = { destroy: () => void; poke: () => void; setFrame: (frame: PlushFrame, box: { y: number; r: number }) => void };

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
  return sh;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const smooth = (d: number, r: number) => (d >= r ? 0 : (1 - (d * d) / (r * r)) ** 2);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

async function createEngine(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  opts: Required<Pick<PlushPortraitProps, "faces" | "frame" | "frameBox" | "wobble" | "reach" | "follow" | "idle">>,
  onReady: () => void,
  onContextLost: () => void,
): Promise<Engine> {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true });
  if (!gl) throw new Error("no webgl");

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const U = (n: string) => gl.getUniformLocation(prog, n);

  // Mesh.
  const n = GRID + 1;
  const count = n * n;
  const h = 1 / GRID;
  const rest = new Float32Array(count * 2);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    rest[(r * n + c) * 2] = c * h;
    rest[(r * n + c) * 2 + 1] = r * h;
  }
  const idx = new Uint16Array(GRID * GRID * 6);
  let k = 0;
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
    const a = r * n + c, b = a + 1, d = a + n, e = d + 1;
    idx.set([a, b, d, b, e, d], k);
    k += 6;
  }
  const pos = new Float32Array(rest);
  const shade = new Float32Array(count).fill(1);

  const buf = (data: Float32Array, attr: string, size: number, usage: number) => {
    const b = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    const loc = gl.getAttribLocation(prog, attr);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    return b;
  };
  buf(rest, "aUv", 2, gl.STATIC_DRAW);
  const posBuf = buf(pos, "aPos", 2, gl.DYNAMIC_DRAW);
  const shadeBuf = buf(shade, "aShade", 1, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

  gl.uniform1f(U("uPad"), PAD);
  gl.uniform2f(U("uPivot"), 0.5, 0.85);
  // The frame is two uniforms: switching it needs no rebuild and no reload.
  const applyFrame = (frame: PlushFrame, box: { y: number; r: number }) => {
    gl.useProgram(prog);
    gl.uniform1i(U("uFrame"), frame === "circle" ? 1 : frame === "square" ? 2 : 0);
    gl.uniform3f(U("uBox"), 0.5, box.y, box.r);
  };
  applyFrame(opts.frame, opts.frameBox);
  gl.uniform1i(U("uA"), 0);
  gl.uniform1i(U("uB"), 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  // Faces. The resting face first; the rest arrive when they arrive.
  const tex = new Map<FaceKey, WebGLTexture>();
  const upload = (img: HTMLImageElement) => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const restImg = await loadImage(opts.faces.rest);
  tex.set("rest", upload(restImg));

  // A coarse alpha map, so only the person (not the empty corners) is grabbable.
  const HIT = 64;
  let hitMap: Uint8ClampedArray | null = null;
  try {
    const c2 = document.createElement("canvas");
    c2.width = c2.height = HIT;
    const ctx = c2.getContext("2d")!;
    ctx.drawImage(restImg, 0, 0, HIT, HIT);
    hitMap = ctx.getImageData(0, 0, HIT, HIT).data;
  } catch {
    hitMap = null; // cross-origin image without CORS: everything is grabbable
  }
  const onPerson = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= 1 || y >= 1) return false;
    if (!hitMap) return true;
    return hitMap[(Math.floor(y * HIT) * HIT + Math.floor(x * HIT)) * 4 + 3] > 40;
  };

  let destroyed = false;
  (Object.keys(opts.faces) as FaceKey[]).forEach((key) => {
    const src = opts.faces[key];
    if (key === "rest" || !src) return;
    loadImage(src).then((img) => { if (!destroyed) tex.set(key, upload(img)); }, () => {});
  });

  // Physics state.
  const ux = new Float32Array(count), uy = new Float32Array(count);
  const vx = new Float32Array(count), vy = new Float32Array(count);
  const lx = new Float32Array(count), ly = new Float32Array(count);
  const grabW = new Float32Array(count);
  const grabUx = new Float32Array(count), grabUy = new Float32Array(count);
  const height = new Float32Array(count);
  const omega = 2 * Math.PI * opts.wobble;
  const c2 = (opts.reach * omega) ** 2;
  const w2 = omega * omega;
  const gamma = 2 * DAMPING * omega;
  const nu = FLESH * 0.03;
  const invH2 = 1 / (h * h);

  let tilt = 0, tiltV = 0, shiftX = 0, shiftV = 0;

  const laplace = (f: Float32Array, out: Float32Array) => {
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = r * n + c, v = f[i];
      const L = c > 0 ? f[i - 1] : v, R = c < GRID ? f[i + 1] : v;
      const T = r > 0 ? f[i - n] : v, B = r < GRID ? f[i + n] : v;
      out[i] = (L + R + T + B - 4 * v) * invH2;
    }
  };
  const lvx = new Float32Array(count), lvy = new Float32Array(count);

  // Pointer state, in image space (0 to 1 over the picture).
  const hand = { down: false, id: -1, sx: 0, sy: 0, x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, pulled: 0 };
  const hover = { on: false, since: 0, x: 0, y: 0 };
  let pointer: { x: number; y: number } | null = null;
  let lastActive = performance.now();
  let pulls = 0;

  // The box is measured once and again only after a scroll or resize, so a
  // pointer move never forces a layout.
  let rect = root.getBoundingClientRect(), rectStale = false;
  const toImage = (e: PointerEvent) => {
    if (rectStale) { rect = root.getBoundingClientRect(); rectStale = false; }
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };
  const onScroll = () => { rectStale = true; };
  let gaze = 0; // -1 left, 0 ahead, 1 right
  const nodeAt = (i: number) => [rest[i * 2] + ux[i], rest[i * 2 + 1] + uy[i]] as const;

  const impulse = (x: number, y: number, dx: number, dy: number, radius: number) => {
    for (let i = 0; i < count; i++) {
      const [px, py] = nodeAt(i);
      const w = smooth(Math.hypot(px - x, py - y), radius);
      if (w) { vx[i] += dx * w; vy[i] += dy * w; }
    }
    wake();
  };

  // Faces and timing.
  let faceA: FaceKey = "rest", faceB: FaceKey = "rest", mixT = 1, fadeMs = 90;
  let flash: { face: FaceKey; until: number } | null = null;
  let dazedUntil = 0;
  let nextBlink = performance.now() + rand(2500, 5000), blinkUntil = 0;
  let nextIdle = performance.now() + rand(9000, 14000), idleUntil = 0;

  const has = (f: FaceKey) => tex.has(f);
  const want = (now: number): [FaceKey, number] => {
    if (flash && now < flash.until && has(flash.face)) return [flash.face, 60];
    if (hand.down) return [hand.pulled > 0.12 && has("pull") ? "pull" : has("grab") ? "grab" : "rest", 70];
    if (now < dazedUntil && has("dazed")) return ["dazed", 90];
    if (hover.on && now - hover.since > 350 && has("hover")) return ["hover", 120];
    if (now < idleUntil && has("idle")) return ["idle", 220];
    if (opts.idle && now < blinkUntil && has("blink")) return ["blink", 40];
    if (opts.follow && pointer && !hover.on) {
      const dx = pointer.x - 0.5;
      if (dx < -0.65 && has("lookLeft")) return ["lookLeft", 110];
      if (dx > 0.65 && has("lookRight")) return ["lookRight", 110];
    }
    return ["rest", 110];
  };

  const showFace = (face: FaceKey, ms: number) => {
    if (face === faceB) return;
    faceA = mixT > 0.5 ? faceB : faceA;
    faceB = face;
    mixT = 0;
    fadeMs = ms;
  };

  // Loop.
  // The loop only runs while something moves: the skin, a fade, a hand. At
  // rest it sleeps and a timer wakes it for the next blink or yawn.
  let raf = 0, timer = 0, running = false, onScreen = true, pageShown = document.visibilityState === "visible";
  let energy = 1, last = performance.now(), dirty = true;
  const visible = () => onScreen && pageShown;
  const kick = () => {
    dirty = true;
    clearTimeout(timer);
    if (!running && visible() && !destroyed) { running = true; last = performance.now(); raf = requestAnimationFrame(tick); }
  };
  const wake = () => { energy = 1; kick(); };
  const SLEEP = 2e-5;
  const nextClock = (now: number) => {
    const times = [blinkUntil, idleUntil, dazedUntil, flash ? flash.until : 0];
    if (hover.on) times.push(hover.since + 360);
    if (opts.idle) times.push(nextBlink, Math.max(nextIdle, lastActive + 9000));
    let soon = Infinity;
    for (const t of times) if (t > now && t < soon) soon = t;
    return soon;
  };

  const step = (dt: number) => {
    laplace(ux, lx); laplace(uy, ly); laplace(vx, lvx); laplace(vy, lvy);
    for (let i = 0; i < count; i++) {
      vx[i] += (c2 * lx[i] - w2 * ux[i] - gamma * vx[i] + nu * lvx[i]) * dt;
      vy[i] += (c2 * ly[i] - w2 * uy[i] - gamma * vy[i] + nu * lvy[i]) * dt;
      ux[i] += vx[i] * dt;
      uy[i] += vy[i] * dt;
    }
    if (hand.down) {
      let dx = hand.x - hand.sx, dy = hand.y - hand.sy;
      const d = Math.hypot(dx, dy);
      if (d > 0) {
        const s = (MAX_PULL * Math.tanh(d / MAX_PULL)) / d; // rubber band
        dx *= s; dy *= s;
      }
      hand.pulled = Math.hypot(dx, dy);
      for (let i = 0; i < count; i++) {
        const w = grabW[i];
        if (!w) continue;
        const tx = grabUx[i] + dx, ty = grabUy[i] + dy;
        ux[i] += (tx - ux[i]) * w;
        uy[i] += (ty - uy[i]) * w;
        vx[i] += (hand.vx - vx[i]) * w;
        vy[i] += (hand.vy - vy[i]) * w;
      }
    }
    // The soft neck.
    const targetTilt = hand.down ? Math.max(-0.14, Math.min(0.14, (hand.x - hand.sx) * 0.45)) : 0;
    const targetShift = hand.down ? (hand.x - hand.sx) * 0.05 : 0;
    const ws = 2 * Math.PI * 1.3;
    tiltV += (ws * ws * (targetTilt - tilt) - 2 * 0.22 * ws * tiltV) * dt;
    tilt += tiltV * dt;
    shiftV += (ws * ws * (targetShift - shiftX) - 2 * 0.3 * ws * shiftV) * dt;
    shiftX += shiftV * dt;
  };

  const updateMesh = () => {
    // Pulled skin lifts toward the viewer, bunched skin ridges up; the slope
    // of that height field fakes the light.
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = r * n + c;
      const L = c > 0 ? i - 1 : i, R = c < GRID ? i + 1 : i, T = r > 0 ? i - n : i, B = r < GRID ? i + n : i;
      const div = (ux[R] - ux[L] + uy[B] - uy[T]) / (2 * h);
      height[i] = Math.hypot(ux[i], uy[i]) * 0.9 + Math.max(0, -div) * 0.02;
      pos[i * 2] = rest[i * 2] + ux[i];
      pos[i * 2 + 1] = rest[i * 2 + 1] + uy[i];
    }
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = r * n + c;
      const L = c > 0 ? i - 1 : i, R = c < GRID ? i + 1 : i, T = r > 0 ? i - n : i, B = r < GRID ? i + n : i;
      const gx = (height[R] - height[L]) / (2 * h), gy = (height[B] - height[T]) / (2 * h);
      shade[i] = Math.max(0.78, Math.min(1.22, 1 + height[i] * 0.25 - (gx * 0.5 + gy * 0.7) * 0.06));
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, shadeBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, shade);
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.max(1, Math.round(rect.width * dpr));
    if (canvas.width !== size) { canvas.width = canvas.height = size; dirty = true; }
    gl.viewport(0, 0, canvas.width, canvas.height);
    wake();
  };

  const draw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex.get(faceA) ?? tex.get("rest")!);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex.get(faceB) ?? tex.get("rest")!);
    gl.uniform1f(U("uMix"), mixT);
    gl.uniform1f(U("uTilt"), tilt);
    gl.uniform2f(U("uShift"), shiftX, 0);
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
  };

  function tick(now: number) {
    if (destroyed) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // Clocks: blinking and idling.
    if (opts.idle) {
      if (now > nextBlink) { blinkUntil = now + 130; nextBlink = now + rand(2600, 5600); }
      if (now - lastActive > 9000 && now > nextIdle && !hover.on) {
        idleUntil = now + 1700;
        nextIdle = now + rand(11000, 17000);
        impulse(0.5, 0.55, 0, -0.25, 0.3);
      }
    }
    const [face, ms] = want(now);
    showFace(face, ms);
    if (mixT < 1) { mixT = Math.min(1, mixT + (dt * 1000) / fadeMs); dirty = true; }

    if (energy > SLEEP || hand.down) {
      const sub = 4;
      for (let s = 0; s < sub; s++) step(dt / sub);
      let e = 0;
      for (let i = 0; i < count; i++) e += Math.abs(ux[i]) + Math.abs(uy[i]) + Math.abs(vx[i]) * 0.1 + Math.abs(vy[i]) * 0.1;
      energy = e / count + Math.abs(tilt) + Math.abs(tiltV) * 0.1 + Math.abs(shiftX);
      if (energy <= SLEEP && !hand.down) {
        // Settled: put every node exactly home so the next frame is the plain picture.
        ux.fill(0); uy.fill(0); vx.fill(0); vy.fill(0);
        tilt = tiltV = shiftX = shiftV = 0;
      }
      updateMesh();
      dirty = true;
    }
    if (dirty) { draw(); dirty = false; }

    if (visible() && (energy > SLEEP || hand.down || mixT < 1)) {
      raf = requestAnimationFrame(tick);
      return;
    }
    running = false;
    if (!visible()) return;
    const soon = nextClock(now);
    if (soon < Infinity) timer = window.setTimeout(kick, Math.max(16, soon - now));
  }

  // Events.
  const onDown = (e: PointerEvent) => {
    const p = toImage(e);
    if (!onPerson(p.x, p.y)) return;
    lastActive = performance.now();
    if (e.pointerType === "touch") {
      // Fingers share the screen with scrolling: a tap prods, a sideways drag grabs.
      impulse(p.x, p.y, 0, 0.6, GRAB_R);
    }
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch { /* moves still arrive on window */ }
    hand.down = true;
    hand.id = e.pointerId;
    hand.sx = hand.x = hand.px = p.x;
    hand.sy = hand.y = hand.py = p.y;
    hand.vx = hand.vy = hand.pulled = 0;
    for (let i = 0; i < count; i++) {
      const [px, py] = nodeAt(i);
      grabW[i] = smooth(Math.hypot(px - p.x, py - p.y), GRAB_R);
      grabUx[i] = ux[i];
      grabUy[i] = uy[i];
    }
    wake();
  };
  const onMove = (e: PointerEvent) => {
    const p = toImage(e);
    pointer = p;
    if (hand.down && e.pointerId === hand.id) {
      const now = performance.now();
      hand.vx = (p.x - hand.px) * 60;
      hand.vy = (p.y - hand.py) * 60;
      hand.px = hand.x = p.x;
      hand.py = hand.y = p.y;
      lastActive = now;
      wake();
      return;
    }
    if (e.pointerType !== "mouse") return;
    if (opts.follow) {
      // Only a change of direction needs a frame.
      const dx = p.x - 0.5, g = dx < -0.65 ? -1 : dx > 0.65 ? 1 : 0;
      if (g !== gaze) { gaze = g; kick(); }
    }
    const over = onPerson(p.x, p.y);
    if (over && !hover.on) hover.since = performance.now();
    if (over) {
      // A hovering cursor already has half a hold of the skin.
      const dx = p.x - hover.x, dy = p.y - hover.y;
      if (hover.on && Math.hypot(dx, dy) < 0.08) {
        for (let i = 0; i < count; i++) {
          const [px, py] = nodeAt(i);
          const w = smooth(Math.hypot(px - p.x, py - p.y), RUB_R);
          if (w) { ux[i] += dx * w * 0.35; uy[i] += dy * w * 0.35; }
        }
      }
      lastActive = performance.now();
      wake();
    }
    if (hover.on && !over) kick();
    hover.on = over;
    hover.x = p.x;
    hover.y = p.y;
  };
  const onUp = (e: PointerEvent) => {
    if (!hand.down || e.pointerId !== hand.id) return;
    hand.down = false;
    const now = performance.now();
    if (hand.pulled > 0.15) {
      pulls++;
      dazedUntil = now + (pulls >= 3 ? 1800 : 1100);
    } else {
      flash = { face: "grab", until: now + 380 };
      pulls = Math.max(0, pulls - 1);
    }
    lastActive = now;
    wake();
  };
  const onLeave = () => { if (hover.on) { hover.on = false; kick(); } };

  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);
  window.addEventListener("scroll", onScroll, { passive: true, capture: true });

  const ro = new ResizeObserver(() => { rectStale = true; resize(); });
  ro.observe(canvas);
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (visible()) kick();
  });
  io.observe(root);
  const onVis = () => {
    pageShown = document.visibilityState === "visible";
    if (visible()) kick();
  };
  document.addEventListener("visibilitychange", onVis);
  // Phones take WebGL away when they need the memory: fall back to the picture.
  const onLost = (e: Event) => { e.preventDefault(); destroyed = true; cancelAnimationFrame(raf); clearTimeout(timer); onContextLost(); };
  canvas.addEventListener("webglcontextlost", onLost);

  resize();
  updateMesh();
  draw();
  onReady();

  return {
    setFrame: (frame, box) => { if (!destroyed) { applyFrame(frame, box); kick(); } },
    poke: () => {
      const now = performance.now();
      flash = { face: "grab", until: now + 500 };
      lastActive = now;
      impulse(0.5, 0.42, rand(-0.6, 0.6), 0.9, 0.16);
    },
    destroy: () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

// ---------------------------------------------------------------- component

export function PlushPortrait({
  faces,
  alt,
  frame = "circle",
  frameBox = { y: 0.58, r: 0.42 },
  backdropClassName = "bg-primary",
  wobble = 2.3,
  reach = 0.085,
  follow = true,
  idle = true,
  pokeLabel = "Poke",
  className,
}: PlushPortraitProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [live, setLive] = useState(false);
  const reduced = useReducedMotion();

  const facesKey = JSON.stringify(faces);
  const boxKey = `${frameBox.y},${frameBox.r}`;
  // A rebuilt engine needs a fresh canvas: the old one's WebGL context is released on destroy.
  const engineKey = [facesKey, wobble, reach, follow, idle].join("|");
  const frameRef = useRef({ frame, frameBox });
  frameRef.current = { frame, frameBox };

  useEffect(() => {
    const root = rootRef.current, canvas = canvasRef.current;
    if (!root || !canvas || reduced) return;
    let cancelled = false;
    // Nothing is downloaded until the portrait is about to come into view.
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      createEngine(
        root,
        canvas,
        { faces, ...frameRef.current, wobble, reach, follow, idle },
        () => { if (!cancelled) setLive(true); },
        () => { engineRef.current = null; if (!cancelled) setLive(false); },
      ).then(
        (engine) => { if (cancelled) engine.destroy(); else engineRef.current = engine; },
        () => { /* No WebGL: the picture stays. */ },
      );
    }, { rootMargin: "300px" });
    io.observe(root);
    return () => {
      cancelled = true;
      io.disconnect();
      engineRef.current?.destroy();
      engineRef.current = null;
      setLive(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineKey, reduced]);

  useEffect(() => {
    engineRef.current?.setFrame(frame, frameBox);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, boxKey]);

  const { y, r } = frameBox;
  // The still picture gets the same clip as the shader: inside the shape, or above its centre.
  const mask =
    frame === "none"
      ? undefined
      : `${frame === "circle"
          ? `radial-gradient(${r * 100}% ${r * 100}% at 50% ${y * 100}%, #000 99.5%, transparent 100%)`
          : `linear-gradient(#000, #000) ${(0.5 - r) * 100}% ${(y - r) * 100}% / ${r * 200}% ${r * 200}% no-repeat`
        }, linear-gradient(#000 ${y * 100}%, transparent ${y * 100}%)`;

  return (
    <div ref={rootRef} className={cn("relative aspect-square w-full select-none", className)}>
      {frame !== "none" && (
        <div
          aria-hidden
          className={cn("absolute", frame === "circle" ? "rounded-full" : "rounded-[12%]", backdropClassName)}
          style={{ left: `${(0.5 - r) * 100}%`, top: `${(y - r) * 100}%`, width: `${r * 200}%`, height: `${r * 200}%` }}
        />
      )}
      <img
        src={faces.rest}
        alt={alt}
        draggable={false}
        className={cn("absolute inset-0 size-full transition-opacity duration-300", live && "opacity-0")}
        style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      />
      {!reduced && (
        <canvas
          key={engineKey}
          ref={canvasRef}
          aria-hidden
          className={cn("absolute cursor-grab touch-pan-y active:cursor-grabbing", !live && "invisible")}
          style={{ inset: `${-PAD * 100}%`, width: `${(1 + 2 * PAD) * 100}%`, height: `${(1 + 2 * PAD) * 100}%` }}
        />
      )}
      {live && (
        <button
          type="button"
          onClick={() => engineRef.current?.poke()}
          className="absolute left-1/2 top-[30%] size-[30%] -translate-x-1/2 rounded-full opacity-0 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring pointer-events-none focus-visible:pointer-events-auto"
          aria-label={pokeLabel}
        />
      )}
    </div>
  );
}
