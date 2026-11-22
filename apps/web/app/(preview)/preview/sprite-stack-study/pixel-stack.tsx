"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";
import {
  pixelIcons,
  pixelPaths,
  resolvePalette,
  tonesFor,
  type PixelIconName,
} from "@/registry/icons/sunui-pixel-icons";

import { frameSize, renderStack, shapeFromFront, type Grid, type Rgb, type ShapeMode, type Volume } from "./stack-core";

/**
 * 互動方式：
 * - spin：游標移入或聚焦時轉一圈，停回 3/4 角（圖示的 hover 狀態）。
 * - drag：拖曳轉動，放手有慣性，上下拖改俯角；閒置一陣子後慢慢自轉（商品、獎勵檢視）。
 * - auto：一直轉（載入中）。
 * - tilt：跟著游標偏一點角度（卡片上的小物件）。
 * - explode：游標移入時每片分開（看結構的爆炸圖）。
 * - none：靜止，角度由 turn 決定。
 */
export type StackBehavior = "spin" | "drag" | "auto" | "tilt" | "explode" | "none";

export type PixelStackHandle = { bloom: () => void };

export type PixelStackProps = {
  icon: PixelIconName;
  mode?: ShapeMode;
  depth?: number;
  /** 每個美術像素在螢幕上幾個 CSS px，整數才銳利 */
  scale?: number;
  behavior?: StackBehavior;
  /** 靜止時的角度（弧度），預設 -0.5，看得到側面 */
  turn?: number;
  /** 俯角壓扁，預設 0.55 */
  squash?: number;
  /** 明暗階數，0 是連續 */
  bands?: number;
  /** 整疊描一次外框 */
  outline?: boolean;
  /** 每次這個數字改變就重播一次由下往上長出來的登場 */
  bloomKey?: number;
  /** 自轉速度（弧度／秒），auto 與 drag 閒置時用 */
  speed?: number;
  /** 爆炸的程度（每片之間多出的間距倍數），explode 用；給數字就固定在這個值 */
  explode?: number;
  className?: string;
  style?: CSSProperties;
  label?: string;
  /** 由父層控制的 hover（例如整顆按鈕 hover 時讓圖示轉），spin 與 explode 用 */
  active?: boolean;
};

const cache = new Map<string, Rgb>();
let probeCanvas: CanvasRenderingContext2D | null = null;

/** 把任何 CSS 顏色（oklch(from var(...))、light-dark、currentColor）在 host 底下算成 rgb */
function cssToRgb(host: HTMLElement, css: string, opacity: number, paper: Rgb): Rgb {
  const key = `${css}|${opacity}|${paper.join(",")}|${getComputedStyle(host).color}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const probe = document.createElement("span");
  probe.style.color = css;
  probe.style.display = "none";
  host.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  probeCanvas ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const ctx = probeCanvas!;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  // 墨色模式的半透明填色疊在紙色上，變成不透明的體素
  const mix = (c: number, p: number) => Math.round(c * opacity + p * (1 - opacity));
  const out: Rgb = [mix(r, paper[0]), mix(g, paper[1]), mix(b, paper[2])];
  cache.set(key, out);
  return out;
}

/** 從 pixelPaths 的 "M{x} {y}h{n}v1..." 還原成點陣，保留 o（邊）與 i（內線）的區分 */
function gridFromIcon(name: PixelIconName): Grid {
  const size = pixelIcons[name].length;
  const rows = Array.from({ length: size }, () => Array<string>(size).fill("."));
  for (const [ch, d] of Object.entries(pixelPaths(name))) {
    for (const m of d.matchAll(/M(\d+) (\d+)h(\d+)/g)) {
      const x = Number(m[1]);
      const y = Number(m[2]);
      for (let k = 0; k < Number(m[3]); k++) rows[y][x + k] = ch;
    }
  }
  // 拿掉上下的空列，物件才會站在地面上
  const lines = rows.map((r) => r.join(""));
  let top = 0;
  let bottom = lines.length - 1;
  while (top < bottom && !/[^.]/.test(lines[top])) top++;
  while (bottom > top && !/[^.]/.test(lines[bottom])) bottom--;
  return lines.slice(top, bottom + 1);
}

function iconColors(host: HTMLElement, name: PixelIconName): Record<string, Rgb> {
  const palette = resolvePalette(name, "pigment");
  const tones = tonesFor(pixelPaths(name), palette);
  const bg = getComputedStyle(host).getPropertyValue("--background").trim();
  const paper = bg ? cssToRgb(host, bg, 1, [255, 255, 255]) : ([255, 255, 255] as Rgb);
  const out: Record<string, Rgb> = {};
  for (const t of tones) out[t.char] = cssToRgb(host, t.fill, t.opacity, paper);
  return out;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function PixelStack({
  icon,
  mode = "slab",
  depth,
  scale = 4,
  behavior = "none",
  turn = -0.5,
  squash = 0.55,
  bands = 4,
  outline = false,
  bloomKey,
  speed = 1.2,
  explode,
  className,
  style,
  label,
  active,
}: PixelStackProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grid = useMemo(() => gridFromIcon(icon), [icon]);
  const maxExplode = behavior === "explode" || explode ? Math.max(1.4, explode ?? 0) : 0;

  // 動畫狀態放在 ref，避免每幀 re-render
  const s = useRef({
    turn,
    squash,
    explode: explode ?? 0,
    vel: 0,
    spinFrom: 0,
    spinStart: -1,
    hover: false,
    dragging: false,
    lastX: 0,
    lastY: 0,
    lastMove: 0,
    idleSince: 0,
    tiltX: 0,
    tiltY: 0,
    bloomStart: -1,
    wake: () => {},
  });

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const st = s.current;
    let vol: Volume | null = null;
    let frame: ImageData | null = null;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    const lifts = new Float32Array(64);

    const build = () => {
      vol = shapeFromFront(grid, iconColors(host, icon), { mode, depth });
      const { width, height } = frameSize(vol, maxExplode);
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width * scale}px`;
      canvas.style.height = `${height * scale}px`;
      frame = new ImageData(width, height);
    };
    build();
    const ctx = canvas.getContext("2d")!;

    const draw = (now: number) => {
      if (!vol || !frame) return false;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const calm = reduced();
      let busy = false;

      if (behavior === "auto" && !calm) {
        st.turn += speed * dt;
        busy = true;
      }
      if (behavior === "spin") {
        if (st.spinStart >= 0) {
          const t = Math.min(1, (now - st.spinStart) / 900);
          st.turn = st.spinFrom + easeOut(t) * Math.PI * 2;
          if (t >= 1) {
            st.spinStart = -1;
            st.turn = turn;
          } else busy = true;
        }
        const target = st.hover ? Math.min(1, squash + 0.12) : squash;
        st.squash += (target - st.squash) * Math.min(1, dt * 12);
        if (Math.abs(target - st.squash) > 0.002) busy = true;
      }
      if (behavior === "drag") {
        if (!st.dragging) {
          st.turn += st.vel * dt;
          st.vel *= Math.pow(0.04, dt);
          if (Math.abs(st.vel) < 0.05) {
            st.vel = 0;
            // 放手 1.6 秒後慢慢自轉，提示這個東西可以轉
            if (!calm && now - st.idleSince > 1600) st.turn += speed * 0.35 * dt;
          }
        }
        busy = true;
      }
      if (behavior === "tilt") {
        const tt = turn + st.tiltX * 0.9;
        const tq = Math.max(0.3, Math.min(1, squash + st.tiltY * 0.25));
        st.turn += (tt - st.turn) * Math.min(1, dt * 10);
        st.squash += (tq - st.squash) * Math.min(1, dt * 10);
        busy = Math.abs(tt - st.turn) > 0.001 || Math.abs(tq - st.squash) > 0.001;
      }
      if (behavior === "explode" && explode === undefined) {
        const target = st.hover ? 1.4 : 0;
        st.explode += (target - st.explode) * Math.min(1, dt * 9);
        if (Math.abs(target - st.explode) > 0.003) busy = true;
      }
      if (explode !== undefined) st.explode = explode;

      // 由下往上長出來：前沿推過頂片再多一段，最上面幾片才補得滿，不會最後一幀跳上去
      let useLifts = false;
      if (st.bloomStart >= 0) {
        const t = (now - st.bloomStart) / 1100;
        const width = 3;
        const front = -width + (vol.h + width * 2) * easeOut(Math.min(1, t));
        for (let z = 0; z < vol.h; z++) {
          const k = Math.max(0, Math.min(1, (front - z) / width));
          // 彈一下再落定
          lifts[z] = k <= 0 ? 0 : k >= 1 ? 1 : 1 + Math.sin(k * Math.PI) * 0.35;
        }
        useLifts = true;
        if (t >= 1) st.bloomStart = -1;
        else busy = true;
      }

      renderStack(frame, vol, {
        turn: st.turn,
        squash: st.squash,
        explode: st.explode,
        lifts: useLifts ? lifts : null,
        bands,
        outline: outline ? [24, 22, 30] : null,
      });
      ctx.putImageData(frame, 0, 0);
      return busy;
    };

    const loop = (now: number) => {
      raf = 0;
      const busy = draw(now);
      if (busy && visible) raf = requestAnimationFrame(loop);
    };
    st.wake = () => {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    st.wake();

    // 畫面外不跑；配色改了（暗色模式、--sunui-pigment-*）就重建體素
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) st.wake();
    });
    io.observe(host);
    const mo = new MutationObserver(() => {
      cache.clear();
      build();
      st.wake();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
    };
  }, [grid, icon, mode, depth, scale, behavior, turn, squash, bands, outline, speed, explode, maxExplode]);

  useEffect(() => {
    if (bloomKey === undefined) return;
    s.current.bloomStart = reduced() ? -1 : performance.now();
    s.current.wake();
  }, [bloomKey]);

  const st = s.current;
  useEffect(() => {
    if (active === undefined) return;
    const cur = s.current;
    if (!active) {
      cur.hover = false;
      cur.wake();
      return;
    }
    if (behavior === "explode") {
      cur.hover = true;
      cur.wake();
    } else if (behavior === "spin" && !reduced()) {
      cur.hover = true;
      if (cur.spinStart < 0) {
        cur.spinFrom = cur.turn;
        cur.spinStart = performance.now();
      }
      cur.wake();
    }
  }, [active, behavior]);

  const startSpin = () => {
    if (behavior !== "spin" || reduced()) return;
    st.hover = true;
    if (st.spinStart < 0) {
      st.spinFrom = st.turn;
      st.spinStart = performance.now();
    }
    st.wake();
  };

  return (
    <div
      ref={hostRef}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative inline-grid grid-rows-1 items-end justify-items-center select-none", behavior === "drag" && "cursor-grab touch-none active:cursor-grabbing", className)}
      style={style}
      onPointerEnter={() => {
        if (behavior === "spin") startSpin();
        if (behavior === "explode") {
          st.hover = true;
          st.wake();
        }
      }}
      onPointerLeave={() => {
        st.hover = false;
        st.tiltX = 0;
        st.tiltY = 0;
        st.wake();
      }}
      onPointerDown={(e) => {
        if (behavior !== "drag") return;
        st.dragging = true;
        st.vel = 0;
        st.lastX = e.clientX;
        st.lastY = e.clientY;
        st.lastMove = performance.now();
        e.currentTarget.setPointerCapture(e.pointerId);
        st.wake();
      }}
      onPointerMove={(e) => {
        if (behavior === "tilt") {
          const r = e.currentTarget.getBoundingClientRect();
          st.tiltX = ((e.clientX - r.left) / r.width - 0.5) * 2;
          st.tiltY = ((e.clientY - r.top) / r.height - 0.5) * -2;
          st.wake();
        }
        if (behavior !== "drag" || !st.dragging) return;
        const now = performance.now();
        const dx = e.clientX - st.lastX;
        const dy = e.clientY - st.lastY;
        st.turn += dx * 0.012;
        st.squash = Math.max(0.3, Math.min(1, st.squash + dy * 0.004));
        st.vel = (dx * 0.012) / Math.max(0.008, (now - st.lastMove) / 1000);
        st.lastX = e.clientX;
        st.lastY = e.clientY;
        st.lastMove = now;
      }}
      onPointerUp={() => {
        if (behavior !== "drag") return;
        st.dragging = false;
        if (performance.now() - st.lastMove > 80) st.vel = 0;
        st.vel = Math.max(-14, Math.min(14, st.vel));
        st.idleSince = performance.now();
      }}
    >
      <canvas ref={canvasRef} style={{ imageRendering: "pixelated" }} />
    </div>
  );
}
