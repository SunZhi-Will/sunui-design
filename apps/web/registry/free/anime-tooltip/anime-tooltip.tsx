"use client";

import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type MouseEvent, type ReactElement, type ReactNode } from "react";

import { at, calm, onFrame, paletteOf, puff, sfx, Spring, type SfxLang } from "@/components/ui/anime-fx";
import { cn } from "@/lib/utils";

export type AnimeTooltipProps = {
  /** The hint */
  content: ReactNode;
  /** One focusable element, such as a button; it gets aria-describedby */
  children: ReactElement<{ "aria-describedby"?: string; onClick?: (e: MouseEvent<HTMLElement>) => void }>;
  /** Lettering language; defaults to <html lang> */
  lang?: SfxLang;
  /** Show the click word when the hint pops out */
  lettering?: boolean;
  className?: string;
};

/**
 * A hint that springs out of its trigger like a speech bubble: it grows past full size from the tail, two puffs roll off its
 * sides and a small click word lands. Opens on hover, focus or tap, closes on leave, blur, a second tap or Escape.
 */
export function AnimeTooltip({ content, children, lang, lettering = true, className }: AnimeTooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const bubble = useRef<HTMLSpanElement>(null);
  const spring = useRef(new Spring(0, 520, 16));
  const closeTimer = useRef(0);
  const openedAt = useRef(0);

  useEffect(() => {
    if (!open) return;
    const el = bubble.current;
    const s = spring.current;
    s.x = calm() ? 1 : 0.3;
    s.to = 1;
    const stop = onFrame((dt) => {
      const v = s.step(dt);
      if (el) el.style.transform = `translateX(-50%) scale(${v.toFixed(3)})`;
      if (s.still) stop();
    });
    if (el) {
      // Measure the bubble at full size: it starts scaled down, so its live rect is still small here
      const P = paletteOf(el);
      const mid = at(el, 0.5, 1);
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      puff(P, mid.x - w / 2 - 2, mid.y - h * 0.4, { size: 6, n: 4, vx: -20, vy: -8, life: 0.5 });
      puff(P, mid.x + w / 2 + 2, mid.y - h * 0.6, { size: 5, n: 4, vx: 18, vy: -12, life: 0.5 });
      // The word lands past the bubble's top corner, never on the hint text
      if (lettering) sfx(P, "click", mid.x + w / 2 + 34, mid.y - h - 14, { size: 34, lang, rot: 0.12, life: 0.7 });
    }
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => {
      stop();
      window.removeEventListener("keydown", esc);
    };
  }, [open, lang, lettering]);

  const show = () => {
    window.clearTimeout(closeTimer.current);
    if (!open) openedAt.current = performance.now();
    setOpen(true);
  };
  const hide = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 80);
  };

  // Taps toggle the hint on the trigger itself; mouse users get it on hover
  const trigger = isValidElement(children)
    ? cloneElement(children, {
        "aria-describedby": open ? `${id}-tip` : undefined,
        onClick: (e: MouseEvent<HTMLElement>) => {
          children.props.onClick?.(e);
          // A tap focuses the trigger first (which opens it), so only a later tap closes it
          if ((e.nativeEvent as PointerEvent).pointerType === "mouse") return;
          if (open && performance.now() - openedAt.current > 400) setOpen(false);
          else show();
        },
      })
    : children;

  return (
    <span
      className={cn("relative inline-flex", className)}
      onPointerEnter={(e) => e.pointerType === "mouse" && show()}
      onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
      onFocus={show}
      onBlur={hide}
    >
      {trigger}
      {open && (
        <span
          ref={bubble}
          id={`${id}-tip`}
          role="tooltip"
          className="absolute bottom-[calc(100%+12px)] left-1/2 z-40 w-max max-w-[16rem] origin-bottom rounded-[12px] border-[3px] border-foreground bg-card px-3 py-2 text-[13px] leading-snug font-semibold text-foreground shadow-[3px_4px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))] will-change-transform"
          style={{ transform: "translateX(-50%) scale(0.3)" }}
        >
          {content}
          {/* The tail: an ink triangle with a card-coloured one inside it */}
          <span aria-hidden className="absolute top-full left-1/2 -translate-x-1/2 border-x-[9px] border-t-[10px] border-x-transparent border-t-foreground" />
          <span aria-hidden className="absolute top-full left-1/2 -mt-[4px] -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-card" />
        </span>
      )}
    </span>
  );
}
