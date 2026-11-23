"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

export interface ScrollTiltStageProps {
  children: ReactNode;
  /** Color of the plinth's lit top edge (the only accent color); defaults to the brand spot colour, var(--sunui-spot, var(--primary)) */
  accent?: string;
  /** Pass it when used inside a scrollable container; by default it follows the whole window scroll */
  scrollContainer?: RefObject<HTMLElement | null>;
  className?: string;
}

const clamp = (x: number) => Math.min(1, Math.max(0, x));

/**
 * 3D entrance stage: while still below the viewport it leans back, slowly stands up as it scrolls in, and faces straight on at the middle of the screen.
 * Below it sit a soft black drop shadow and a brushed-metal plinth whose top edge catches the light in the accent colour.
 * The plinth mixes currentColor, so it reads on dark and light sections alike. With reduced motion preferred it simply faces front.
 */
export function ScrollTiltStage({ children, accent = "var(--sunui-spot, var(--primary))", scrollContainer, className }: ScrollTiltStageProps) {
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
      // From the top edge at the bottom of the viewport to 15% of the viewport, 0 → 1 (ease-out quadratic)
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
      {/* Drop shadow: solid black, no glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[6%] -bottom-12 h-20"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.55), transparent 100%)" }}
      />
      {/* Plinth: a lit top edge in the accent colour, a pale top face, then a brushed-metal front face that darkens downward; faded at both ends */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[4%] -bottom-9 flex h-[18px] flex-col"
        style={{
          maskImage: "linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)",
        }}
      >
        <div className="h-px shrink-0" style={{ background: `color-mix(in srgb, ${accent} 80%, transparent)` }} />
        <div className="h-[3px] shrink-0" style={{ background: "color-mix(in srgb, currentColor 34%, transparent)" }} />
        <div
          className="flex-1"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, color-mix(in srgb, currentColor 8%, transparent) 0 1px, transparent 1px 3px), linear-gradient(180deg, color-mix(in srgb, currentColor 24%, transparent), color-mix(in srgb, currentColor 6%, transparent))",
            boxShadow: "inset 0 1px 0 rgb(0 0 0 / 0.25)",
          }}
        />
      </div>
      <div ref={inner} className="relative origin-[50%_85%] will-change-transform">
        {children}
      </div>
    </div>
  );
}
