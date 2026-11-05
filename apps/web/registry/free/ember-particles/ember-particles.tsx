"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

// 移植自 山河待我 landing/components/Embers.tsx 與 globals.css 的 .embers：
// 燈火餘燼，緩慢上升、忽明忽暗的小光點，以 lighter 疊加出暖光。
// 離開可視範圍或分頁隱藏時停止繪製；偏好減少動態時整個不啟動。

type Ember = { x: number; y: number; r: number; vy: number; drift: number; phase: number; life: number };

export interface EmberParticlesProps {
  /** 寬 1200px 時的光點數，窄的時候按比例減少，再加 8 顆，預設 42 */
  density?: number;
  /** 光點中心、中段、外緣的 RGB（"r, g, b"），預設原本的燈火色 */
  colors?: readonly [core: string, mid: string, edge: string];
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_COLORS = ["255, 214, 150", "237, 170, 90", "217, 120, 60"] as const;

export function EmberParticles({ density = 42, colors = DEFAULT_COLORS, className, style }: EmberParticlesProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [core, mid, edge] = colors;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = false;
    let last = 0;
    const embers: Ember[] = [];

    const spawn = (anywhere: boolean): Ember => ({
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : height + 10,
      r: 0.6 + Math.random() * 1.8,
      vy: 8 + Math.random() * 22,
      drift: (Math.random() - 0.5) * 14,
      phase: Math.random() * Math.PI * 2,
      life: 0,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(density * Math.min(1, width / 1200) + 8);
      embers.length = 0;
      for (let i = 0; i < target; i++) embers.push(spawn(true));
    };

    const draw = (time: number) => {
      const dt = Math.min(0.05, (time - (last || time)) / 1000);
      last = time;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.life += dt;
        e.y -= e.vy * dt;
        e.x += Math.sin(e.phase + e.life * 0.9) * e.drift * dt;
        if (e.y < -12) embers[i] = spawn(false);
        const fadeIn = Math.min(1, e.life / 1.5);
        const fadeTop = Math.min(1, e.y / (height * 0.35));
        const flicker = 0.55 + 0.45 * Math.sin(e.phase + e.life * 3.1);
        const alpha = Math.max(0, fadeIn * fadeTop * flicker * 0.85);
        const glow = e.r * 5;
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, glow);
        g.addColorStop(0, `rgba(${core}, ${alpha})`);
        g.addColorStop(0.25, `rgba(${mid}, ${alpha * 0.55})`);
        g.addColorStop(1, `rgba(${edge}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(e.x, e.y, glow, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density, core, mid, edge]);

  return (
    <canvas
      ref={ref}
      className={cn("pointer-events-none absolute inset-0 z-[1] h-full w-full", className)}
      style={style}
      aria-hidden="true"
    />
  );
}
