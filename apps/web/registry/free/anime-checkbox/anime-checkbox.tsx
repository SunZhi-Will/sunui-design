"use client";

import { useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";

import { at, paletteOf, puff, sfx, shards, ticks, useSquash, wob, type SfxLang } from "@/components/ui/anime-fx";
import { cn } from "@/lib/utils";

export type AnimeCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children" | "onChange"> & {
  /** The label */
  children: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Lettering language; defaults to <html lang> (Chinese pages get Chinese, others Japanese) */
  lang?: SfxLang;
  /** Show the sound-effect word when it is ticked */
  lettering?: boolean;
};

const SHELL = "border-[3px] border-foreground bg-card shadow-[3px_4px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))]";

/**
 * A real checkbox (it works in forms and with Space) that ticks like an anime cut: the box pops, crystal chips fly,
 * the tick draws itself, a wisp of smoke rolls off and a screentone word lands beside the label. Unticking only wobbles.
 */
export function AnimeCheckbox({ children, checked, defaultChecked = false, onCheckedChange, lang, lettering = true, className, disabled, ...rest }: AnimeCheckboxProps) {
  const box = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLLabelElement>(null);
  const [own, setOwn] = useState(defaultChecked);
  const on = checked ?? own;
  const sq = useSquash(box, { low: 0.7, wide: 0.3 });

  const change = (next: boolean) => {
    if (checked === undefined) setOwn(next);
    onCheckedChange?.(next);
    const el = box.current;
    if (!el) return;
    const P = paletteOf(el);
    const c = at(el);
    if (!next) {
      wob(P, c.x + c.w / 2 + 4, c.y, { dir: 1, r: 8, life: 0.3 });
      return;
    }
    sq.pop.x = 1.25;
    sq.kick();
    shards(P, c.x, c.y - c.h / 2, { n: 7, speed: 170, size: 6, life: 0.7 });
    ticks(P, c.x + c.w / 2, c.y - c.h / 2, { dir: -0.8, n: 3, r: 6, len: 12 });
    puff(P, c.x - c.w / 2 - 2, c.y + c.h / 2, { size: 8, vx: -24, vy: -6, life: 0.6 });
    // The word lands past the end of the label, never on it
    const end = at(label.current ?? el, 1, 0);
    if (lettering) sfx(P, "skid", end.x + 52, end.y - 14, { size: 50, lang, rot: -0.08, life: 0.9 });
  };

  return (
    <label ref={label} className={cn("inline-flex cursor-pointer items-center gap-3 select-none has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45", className)}>
      <input type="checkbox" className="peer sr-only" checked={on} disabled={disabled} onChange={(e) => change(e.target.checked)} {...rest} />
      <span
        ref={box}
        aria-hidden
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-[8px] will-change-transform",
          "peer-focus-visible:ring-[3px] peer-focus-visible:ring-[var(--sunui-spot,var(--primary))] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
          SHELL,
        )}
      >
        <svg viewBox="0 0 24 24" className="size-5 overflow-visible">
          <path
            d="M4 12.5l5.5 5.5L20 6"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={on ? 0 : 1}
            style={{ transition: "stroke-dashoffset 240ms cubic-bezier(.2,.8,.2,1)" }}
          />
        </svg>
      </span>
      <span className="text-[15px] font-bold">{children}</span>
    </label>
  );
}
