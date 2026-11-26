"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react";

import { at, burst, kira, later, paletteOf, puff, sfx, shards, ticks, useBackLayer, useSquash, wob, type SfxLang } from "@/components/ui/anime-fx";
import { cn } from "@/lib/utils";

export type AnimeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  /** primary lands a full hit; secondary is a small squash and three wedges */
  variant?: "primary" | "secondary";
  /** Set to "done" when the action succeeds: a check draws on the button with a glint. Back to "idle" hides it. */
  status?: "idle" | "done";
  /** Lettering language; defaults to <html lang> (Chinese pages get Chinese, others Japanese) */
  lang?: SfxLang;
  /** Show the sound-effect word on the hit */
  lettering?: boolean;
  /** Land the full hit on click. Pass false when the click will not go through (a form that fails validation): it gets only the small press. */
  hit?: boolean;
};

/** The resting look of the anime series: ink outline and a hard shadow in a pale tint of the brand spot. */
const SHELL = "border-[3px] border-foreground bg-card text-foreground shadow-[4px_5px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))]";

/**
 * A real button that is plain at rest and lands like an anime hit: it squashes while held, inverts for one frame on release,
 * an impact star goes off behind it, smoke rolls off the corners, chips fly from its edge and a word lands above it.
 * Effects decorate the click; the click itself, focus, keys, type="submit" and disabled behave like any button.
 */
export function AnimeButton({ children, variant = "primary", status = "idle", lang, lettering = true, hit: full = true, className, onClick, disabled, type = "button", ...rest }: AnimeButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const back = useBackLayer();
  const primary = variant === "primary";
  const sq = useSquash(ref, primary ? { low: 0.55, wide: 0.26 } : { low: 0.74, wide: 0.3 });
  const [inverted, setInverted] = useState(false);
  const seq = useRef(0);

  const hit = () => {
    const el = ref.current;
    if (!el) return;
    const P = paletteOf(el);
    const c = at(el);
    if (!primary || !full) {
      sq.s.x = Math.min(sq.s.x, 0.8);
      sq.s.v += 4;
      sq.kick();
      const corner = at(el, 1, 0);
      ticks(P, corner.x - 6, corner.y - 2, { dir: -1.05, n: 3, r: 5, len: 15, fan: 0.36, life: 0.45 });
      return;
    }
    const n = ++seq.current;
    // The hit: flatten, pop, tilt, and invert for about one frame
    sq.s.x = Math.min(sq.s.x, 0.6);
    sq.pop.x = 1.22;
    sq.tilt.x = -5;
    sq.kick();
    setInverted(true);
    later(180, () => n === seq.current && setInverted(false));
    burst(P, c.x, c.y, { r: Math.max(70, c.w * 0.75), spikes: 15, life: 0.46, layer: back.layer() });
    // Chips leave from the edge, never from the centre, so they do not cover the label
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      shards(P, c.x + Math.cos(a) * (c.w / 2 + 6), c.y + Math.sin(a) * (c.h / 2 + 6), { n: 1, dir: a, arc: 0.5, speed: 250, size: 8, life: 0.9 });
    }
    // Smoke rolls sideways and up, not down onto whatever sits below
    for (const [dx, dy] of [[-1, -0.5], [1, -1], [-1, 0.9], [1, 1]] as const)
      puff(P, c.x + dx * (c.w / 2 + 4), c.y + dy * 18, { size: 12 + Math.random() * 4, vx: dx * 46, vy: dy < 0 ? -34 : -8, life: 0.85 });
    if (lettering) sfx(P, "impact", c.x + 8, c.y - c.h / 2 - 48, { size: 92, lang });
    ticks(P, c.x - c.w / 2 - 30, c.y - 56, { dir: -2.4, n: 2, r: 4, len: 18 });
    ticks(P, c.x + c.w / 2 + 30, c.y - 48, { dir: -0.7, n: 2, r: 4, len: 18 });
    // Follow-through: spring past full height, wobble marks either side
    later(200, () => {
      if (n !== seq.current || !el.isConnected) return;
      sq.s.x = 1.2;
      sq.kick();
      wob(P, c.x - c.w / 2 - 6, c.y, { dir: -1 });
      wob(P, c.x + c.w / 2 + 6, c.y, { dir: 1 });
    });
  };

  // Settle: when the action reports done, the check draws itself and a glint opens beside it
  useEffect(() => {
    const el = ref.current;
    if (status !== "done" || !el || !primary) return;
    const corner = at(el, 1, 0);
    const P = paletteOf(el);
    kira(P, corner.x - 14, corner.y + 2, { r: 17, life: 0.9 });
    ticks(P, corner.x - 2, corner.y - 10, { dir: -0.8, n: 2, r: 6, len: 12 });
  }, [status, primary]);

  const click = (e: MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) hit();
  };

  return (
    <span className="relative inline-block isolate">
      {primary && <canvas {...back.props} />}
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={click}
        className={cn(
          "relative inline-flex items-center justify-center gap-1.5 rounded-[14px] px-6 py-3 text-[17px] leading-none font-extrabold italic will-change-transform select-none touch-manipulation",
          "outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--sunui-spot,var(--primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-45",
          SHELL,
          !primary && "shadow-none",
          inverted && "bg-foreground text-background shadow-none",
          className,
        )}
        {...rest}
      >
        {children}
        {primary && (
          <svg viewBox="0 0 24 18" aria-hidden className="h-[15px] overflow-visible transition-[width] duration-200" style={{ width: status === "done" ? 18 : 0 }}>
            <path
              d="M3 9.5l6 6L21 2.5"
              fill="none"
              stroke="var(--sunui-success, currentColor)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={status === "done" ? 0 : 1}
              style={{ transition: "stroke-dashoffset 260ms cubic-bezier(.2,.8,.2,1)" }}
            />
          </svg>
        )}
      </button>
    </span>
  );
}
