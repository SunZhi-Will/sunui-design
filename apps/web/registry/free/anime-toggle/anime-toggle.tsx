"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";

import { at, lines, onFrame, paletteOf, puff, sfx, splash, Spring, ticks, wob, type SfxLang } from "@/components/ui/anime-fx";
import { cn } from "@/lib/utils";

export type AnimeToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value" | "children"> & {
  /** Visible label beside the switch */
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Submitted with a form while on */
  name?: string;
  value?: string;
  /** Lettering language; defaults to <html lang> */
  lang?: SfxLang;
  /** Show the sound-effect word when it turns on */
  lettering?: boolean;
};

const SHELL = "border-[3px] border-foreground bg-card shadow-[4px_5px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))]";
const TRAVEL = 26;

/**
 * A switch that flips like a drawn cut: the knob smears across on a spring (the faster it moves, the longer and thinner it gets),
 * slams into the end and throws a splash, and the track floods with the brand colour. A button with role="switch",
 * so Space and Enter work, and an optional hidden input carries the value in a form.
 */
export function AnimeToggle({ label, checked, defaultChecked = false, onCheckedChange, name, value = "on", lang, lettering = true, className, disabled, onClick, ...rest }: AnimeToggleProps) {
  const btn = useRef<HTMLButtonElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  const [own, setOwn] = useState(defaultChecked);
  const on = checked ?? own;
  const spring = useRef(new Spring(on ? 1 : 0, 380, 22));
  const stop = useRef<(() => void) | null>(null);
  // The spring owns the knob after the first paint; React only sets where it starts
  const [start] = useState(on);
  useEffect(() => () => stop.current?.(), []);

  // A controlled value that changes from outside moves the knob without effects
  useEffect(() => {
    const s = spring.current;
    if (s.to === (on ? 1 : 0)) return;
    s.to = s.x = on ? 1 : 0;
    if (knob.current) knob.current.style.transform = `translateX(${s.x * TRAVEL}px)`;
  }, [on]);

  const flip = () => {
    const next = !on;
    if (checked === undefined) setOwn(next);
    onCheckedChange?.(next);
    const el = btn.current;
    if (!el || !knob.current) return;
    const P = paletteOf(el);
    const s = spring.current;
    s.to = next ? 1 : 0;
    let landed = false;
    const k = at(knob.current);
    lines(P, k.x + (next ? -10 : 10), k.y, { n: 4, dir: next ? Math.PI : 0, len: 26, spread: 7, life: 0.25 });
    stop.current?.();
    stop.current = onFrame((dt) => {
      const x = s.step(dt);
      // Smear: stretch along the move with speed, thinner across it so the knob keeps its volume
      const stretch = 1 + Math.min(0.7, Math.abs(s.v) * 0.09);
      if (knob.current) knob.current.style.transform = `translateX(${(x * TRAVEL).toFixed(2)}px) scale(${stretch.toFixed(3)}, ${(1 / Math.sqrt(stretch)).toFixed(3)})`;
      if (!landed && Math.abs(x - s.to) < 0.06) {
        landed = true;
        const end = at(el, next ? 1 : 0, 0.5);
        const dir = next ? 1 : -1;
        wob(P, end.x + dir * 4, end.y, { dir, r: 10, life: 0.35 });
        ticks(P, end.x, end.y - 14, { dir: next ? -0.7 : -2.4, n: 3, r: 5, len: 11 });
        if (next) {
          // The splash rises from the top edge of the track, not over the knob
          splash(P, end.x - 14, at(el, 1, 0).y, { w: 22, h: 16, life: 0.5 });
          const tail = at(el.parentElement ?? el, 1, 0);
          if (lettering) sfx(P, "click", tail.x + 40, tail.y - 10, { size: 42, lang, rot: 0.1, life: 0.8 });
        } else puff(P, end.x - 2, end.y + 10, { size: 7, vx: -20, vy: -10, life: 0.55 });
      }
      if (s.still) {
        stop.current?.();
        stop.current = null;
      }
    });
  };

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <button
        ref={btn}
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) flip();
        }}
        className={cn(
          "relative h-8 w-[60px] shrink-0 rounded-full p-[3px] transition-colors duration-200 outline-none",
          "focus-visible:ring-[3px] focus-visible:ring-[var(--sunui-spot,var(--primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45",
          SHELL,
          on && "bg-[var(--sunui-spot,var(--primary))]",
        )}
        {...rest}
      >
        <span ref={knob} aria-hidden className="block size-[22px] rounded-full border-[2.5px] border-foreground bg-card will-change-transform" style={{ transform: `translateX(${start ? TRAVEL : 0}px)` }} />
      </button>
      <span aria-hidden className="text-[15px] font-bold">
        {label}
      </span>
      {name && on && <input type="hidden" name={name} value={value} />}
    </span>
  );
}
