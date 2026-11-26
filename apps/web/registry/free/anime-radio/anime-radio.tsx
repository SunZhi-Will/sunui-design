"use client";

import { useId, useRef, useState } from "react";

import { at, paletteOf, puff, sfx, Spring, ticks, onFrame, type SfxLang } from "@/components/ui/anime-fx";
import { cn } from "@/lib/utils";

export type AnimeRadioOption = { value: string; label: string; disabled?: boolean };

export type AnimeRadioGroupProps = {
  /** Group label */
  legend: string;
  options: AnimeRadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Form field name; defaults to a generated one */
  name?: string;
  required?: boolean;
  /** Lettering language; defaults to <html lang> */
  lang?: SfxLang;
  /** Show the sound-effect word on a pick */
  lettering?: boolean;
  className?: string;
};

const SHELL = "border-[3px] border-foreground bg-card shadow-[3px_4px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))]";

/**
 * Native radio buttons (arrow keys and forms work as usual) where a pick lands like a pop: the dot springs in past full size,
 * a fan of accent wedges flies off, two small puffs roll away and a hollow word pops beside the label.
 */
export function AnimeRadioGroup({ legend, options, value, defaultValue, onValueChange, name, required, lang, lettering = true, className }: AnimeRadioGroupProps) {
  const auto = useId();
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-3 text-[13px] font-bold">{legend}</legend>
      <div className="flex flex-col items-start gap-3.5">
        {options.map((o) => (
          <Radio
            key={o.value}
            option={o}
            name={name ?? auto}
            required={required}
            checked={current === o.value}
            lang={lang}
            lettering={lettering}
            onPick={() => {
              if (value === undefined) setOwn(o.value);
              onValueChange?.(o.value);
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}

function Radio({ option, name, required, checked, lang, lettering, onPick }: { option: AnimeRadioOption; name: string; required?: boolean; checked: boolean; lang?: SfxLang; lettering: boolean; onPick: () => void }) {
  const ring = useRef<HTMLSpanElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLLabelElement>(null);

  const pick = () => {
    onPick();
    const el = ring.current;
    if (!el) return;
    // The dot overshoots on a spring before it settles; start it at zero now, before React shows it at full size
    if (dot.current) dot.current.style.transform = "scale(0)";
    const s = new Spring(0, 520, 14);
    s.to = 1;
    const stop = onFrame((dt) => {
      const x = s.step(dt);
      if (dot.current) dot.current.style.transform = `scale(${Math.max(0, x).toFixed(3)})`;
      if (s.still) {
        stop();
        if (dot.current) dot.current.style.transform = "";
      }
    });
    const P = paletteOf(el);
    const c = at(el);
    ticks(P, c.x, c.y, { n: 4, r: c.w / 2 + 3, len: 10, dir: -Math.PI / 2 - 0.5, fan: 0.42 });
    puff(P, c.x - c.w / 2 - 2, c.y + 6, { size: 6, vx: -22, vy: -6, life: 0.5 });
    puff(P, c.x + c.w / 2 + 2, c.y - 8, { size: 5, vx: 18, vy: -14, life: 0.5 });
    const end = at(label.current ?? el, 1, 0);
    if (lettering) sfx(P, "pop", end.x + 34, end.y - 6, { size: 40, lang, rot: 0.08, life: 0.75 });
  };

  return (
    <label ref={label} className="inline-flex cursor-pointer items-center gap-3 select-none has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45">
      <input type="radio" className="peer sr-only" name={name} value={option.value} checked={checked} required={required} disabled={option.disabled} onChange={pick} />
      <span
        ref={ring}
        aria-hidden
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full",
          "peer-focus-visible:ring-[3px] peer-focus-visible:ring-[var(--sunui-spot,var(--primary))] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
          SHELL,
        )}
      >
        <span ref={dot} className={cn("size-3 rounded-full bg-[var(--sunui-spot,var(--primary))] will-change-transform", !checked && "scale-0")} />
      </span>
      <span className="text-[15px] font-bold">{option.label}</span>
    </label>
  );
}
