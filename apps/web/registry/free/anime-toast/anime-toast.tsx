"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { at, calm, lines, onFrame, paletteOf, puff, sfx, Spring, type SfxLang } from "@/components/ui/anime-fx";
import { cn } from "@/lib/utils";

export type AnimeToastProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
  /** Dismiss label for the close button */
  closeLabel?: string;
  /** Milliseconds before it leaves by itself; paused while hovered, focused or the tab is hidden. 0 keeps it open. */
  duration?: number;
  /** Lettering language; defaults to <html lang> */
  lang?: SfxLang;
  /** Show the sound-effect word when it lands */
  lettering?: boolean;
  className?: string;
};

const SHELL = "border-[3px] border-foreground bg-card shadow-[4px_5px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))]";

/**
 * A notification that streaks in from the side as a smear, skids to a stop in a puff of dust with a skid word, and leaves by
 * shrinking away. Its live region is always on the page, so the message is announced; the timer pauses on hover, focus and
 * when the tab is hidden, and Escape closes it.
 */
export function AnimeToast({ open, onOpenChange, title, description, action, closeLabel = "Dismiss", duration = 4200, lang, lettering = true, className }: AnimeToastProps) {
  const card = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(open);
  const x = useRef(new Spring(1, 260, 22));
  const s = useRef(new Spring(1, 320, 24));
  const stop = useRef<(() => void) | null>(null);
  const held = useRef(false);

  const paint = () => {
    const el = card.current;
    if (!el) return;
    const v = x.current.v;
    // Smear while it travels: stretched along the move and leaning into it
    const smear = 1 + Math.min(0.5, Math.abs(v) * 0.08);
    el.style.transform = `translateX(${(x.current.x * 120).toFixed(2)}%) skewX(${Math.max(-16, Math.min(0, v * 3)).toFixed(1)}deg) scale(${(smear * s.current.x).toFixed(3)}, ${((1 / Math.sqrt(smear)) * s.current.x).toFixed(3)})`;
  };

  // Enter: slide in from the right and land; leave: shrink away, then unmount
  useEffect(() => {
    if (open) setShown(true);
  }, [open]);
  useEffect(() => {
    if (!shown) return;
    const el = card.current;
    stop.current?.();
    if (open) {
      if (calm()) {
        x.current.x = x.current.to = 0;
        s.current.x = s.current.to = 1;
        paint();
        return;
      }
      x.current.x = 1;
      x.current.to = 0;
      s.current.x = s.current.to = 1;
      let landed = false;
      stop.current = onFrame((dt) => {
        x.current.step(dt);
        paint();
        if (!landed && el && x.current.x < 0.03) {
          landed = true;
          const P = paletteOf(el);
          const c = at(el, 0, 1);
          // Dust off the trailing corner, outside the card, so it never covers the text
          puff(P, c.x - 8, c.y - 8, { size: 9, n: 5, vx: -26, vy: -10, life: 0.6 });
          lines(P, at(el, 1, 0.5).x + 8, at(el, 1, 0.5).y, { n: 4, dir: 0, len: 30, spread: 14, life: 0.28 });
          const top = at(el, 0, 0);
          if (lettering) sfx(P, "skid", top.x + 46, top.y - 30, { size: 46, lang, rot: -0.1, life: 0.85 });
        }
        if (x.current.still) {
          stop.current?.();
          stop.current = null;
        }
      });
    } else {
      s.current.to = 0;
      stop.current = onFrame((dt) => {
        s.current.step(dt);
        paint();
        if (s.current.x < 0.04) {
          stop.current?.();
          stop.current = null;
          setShown(false);
        }
      });
      if (calm()) setShown(false);
    }
    return () => {
      stop.current?.();
      stop.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shown]);

  // Escape closes it from anywhere while it is open
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onOpenChange]);

  // Auto-dismiss, paused while held (hover, focus) or while the tab is hidden
  useEffect(() => {
    if (!open || !duration) return;
    let left = duration;
    let last = performance.now();
    const t = window.setInterval(() => {
      const now = performance.now();
      if (!held.current && document.visibilityState === "visible") left -= now - last;
      last = now;
      if (left <= 0) onOpenChange(false);
    }, 100);
    return () => window.clearInterval(t);
  }, [open, duration, onOpenChange]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 sm:justify-end sm:p-6">
      {shown && (
        <div
          ref={card}
          onPointerEnter={() => (held.current = true)}
          onPointerLeave={() => (held.current = false)}
          onFocus={() => (held.current = true)}
          onBlur={() => (held.current = false)}
          className={cn("pointer-events-auto flex w-full max-w-sm origin-bottom-left items-start gap-3 rounded-[14px] px-4 py-3.5 will-change-transform", SHELL, className)}
          style={{ transform: "translateX(120%)" }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold italic">{title}</p>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick();
                onOpenChange(false);
              }}
              className="shrink-0 rounded-[10px] border-[2.5px] border-foreground px-3 py-1.5 text-sm font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--sunui-spot,var(--primary))]"
            >
              {action.label}
            </button>
          )}
          <button type="button" aria-label={closeLabel} onClick={() => onOpenChange(false)} className="-mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-[var(--sunui-spot,var(--primary))]">
            <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
