"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

export interface ScrollTiltStageProps {
  children: ReactNode;
  /** 倒影光的顏色，預設金色 */
  accent?: string;
  /** 在可捲動容器裡使用時傳入；預設跟著整個視窗捲動 */
  scrollContainer?: RefObject<HTMLElement | null>;
  className?: string;
}

const clamp = (x: number) => Math.min(1, Math.max(0, x));

/**
 * 3D 進場舞台：還在畫面下方時往後倒著放，捲上來的過程中慢慢立起來，到畫面中間時正對著看。
 * 下面有一圈倒影光。偏好減少動態時直接正對著。
 */
export function ScrollTiltStage({ children, accent = "#f5b324", scrollContainer, className }: ScrollTiltStageProps) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const o = outer.current;
    const el = inner.current;
    if (!o || !el) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = scrollContainer?.current ?? null;
    const target: HTMLElement | Window = root ?? window;
    let raf = 0;

    const apply = () => {
      raf = 0;
      if (mq.matches) {
        el.style.transform = "";
        el.style.opacity = "";
        return;
      }
      const r = o.getBoundingClientRect();
      const box = root?.getBoundingClientRect();
      const top = box ? r.top - box.top : r.top;
      const vh = box ? box.height : window.innerHeight;
      // 上緣從畫面底部到畫面 15% 的位置之間，0 → 1（ease-out 二次方）
      const p = 1 - Math.pow(1 - clamp((vh - top) / (vh * 0.85)), 2);
      el.style.transform = `rotateX(${(1 - p) * 28}deg) scale(${0.88 + 0.12 * p}) translateY(${(1 - p) * 30}px)`;
      el.style.opacity = String(0.6 + 0.4 * p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mq.addEventListener("change", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onScroll);
    };
  }, [scrollContainer]);

  return (
    <div ref={outer} className={cn("relative overflow-x-clip [perspective:1600px]", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[8%] -bottom-16 h-32 rounded-[50%] blur-3xl"
        style={{ background: `color-mix(in srgb, ${accent} 25%, transparent)` }}
      />
      <div ref={inner} className="relative origin-[50%_85%] will-change-transform">
        {children}
      </div>
    </div>
  );
}
