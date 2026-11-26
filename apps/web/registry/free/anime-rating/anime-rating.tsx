"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

import { at, burst, later, onFrame, paletteOf, sfx, shards, Spring, ticks, useBackLayer, type SfxLang } from "@/components/ui/anime-fx";
import { cn } from "@/lib/utils";

export type AnimeRatingProps = {
  /** Group label, e.g. "Rate this episode" */
  label: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  max?: number;
  /** Form field name */
  name?: string;
  /** Accessible name of each star, e.g. (n) => `${n} stars` */
  starLabel?: (n: number) => string;
  /** Lettering language; defaults to <html lang> */
  lang?: SfxLang;
  /** Show the sound-effect word on a full score */
  lettering?: boolean;
  className?: string;
};

const AMBER = "var(--sunui-rating, #e8a020)";
const STAR = "M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5L2.6 9.4l6.5-.8z";

/**
 * Star rating in the semantic rating amber where the stars pop in one after another up to the chosen score, each on its
 * own spring; a full score ends with an impact star behind the row and a hit word. A radio group: arrow keys move and pick.
 */
export function AnimeRating({ label, value, defaultValue = 0, onValueChange, max = 5, name, starLabel = (n) => `${n} / ${max}`, lang, lettering = true, className }: AnimeRatingProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  const stars = useRef<(SVGSVGElement | null)[]>([]);
  const row = useRef<HTMLDivElement>(null);
  const back = useBackLayer(70);
  const seq = useRef(0);

  const choose = (n: number) => {
    if (value === undefined) setOwn(n);
    onValueChange?.(n);
    const n0 = ++seq.current;
    // Pop each star up to the score, a beat apart
    for (let i = 0; i < n; i++)
      later(i * 70, () => {
        const el = stars.current[i];
        if (n0 !== seq.current || !el) return;
        const s = new Spring(0.4, 560, 14);
        s.to = 1;
        const stop = onFrame((dt) => {
          const x = s.step(dt);
          el.style.transform = `scale(${x.toFixed(3)})`;
          if (s.still) {
            stop();
            el.style.transform = "";
          }
        });
        const P = paletteOf(el, AMBER);
        const c = at(el);
        ticks(P, c.x, c.y, { n: 3, r: c.w / 2 + 2, len: 8, fan: 0.6 });
      });
    if (n === max)
      later(n * 70 + 60, () => {
        const el = row.current;
        if (n0 !== seq.current || !el) return;
        const P = paletteOf(el, AMBER);
        const c = at(el);
        burst(P, c.x, c.y, { r: c.w * 0.62, spikes: 14, life: 0.45, layer: back.layer() });
        shards(P, c.x, c.y - c.h / 2, { n: 8, speed: 200, size: 6, life: 0.75 });
        if (lettering) sfx(P, "impact", c.x + c.w * 0.3, c.y - c.h / 2 - 36, { size: 64, lang, life: 0.95 });
      });
  };

  const key = (e: KeyboardEvent, n: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? Math.min(max, n + 1) : e.key === "ArrowLeft" || e.key === "ArrowDown" ? Math.max(1, n - 1) : e.key === "Home" ? 1 : e.key === "End" ? max : null;
    if (next === null) return;
    e.preventDefault();
    choose(next);
    document.getElementById(`${id}-${next}`)?.focus();
  };

  return (
    <div className={cn("inline-block", className)}>
      <p id={`${id}-l`} className="mb-2 text-[13px] font-bold">
        {label}
      </p>
      <div className="relative isolate inline-block">
        <canvas {...back.props} />
        <div ref={row} role="radiogroup" aria-labelledby={`${id}-l`} className="flex gap-1.5">
          {Array.from({ length: max }, (_, i) => {
            const n = i + 1;
            const on = n <= current;
            return (
              <button
                key={n}
                id={`${id}-${n}`}
                type="button"
                role="radio"
                aria-checked={current === n}
                aria-label={starLabel(n)}
                tabIndex={current === n || (current === 0 && n === 1) ? 0 : -1}
                onClick={() => choose(n)}
                onKeyDown={(e) => key(e, n)}
                className="grid size-10 place-items-center rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--sunui-spot,var(--primary))]"
              >
                <svg ref={(el) => void (stars.current[i] = el)} viewBox="0 0 24 24" aria-hidden className="size-8 overflow-visible will-change-transform">
                  {/* Hard offset shadow first, then the star with an ink outline */}
                  <path d={STAR} transform="translate(1.6 2)" fill={on ? `color-mix(in oklch, ${AMBER} 40%, var(--card))` : "none"} />
                  <path d={STAR} fill={on ? AMBER : "var(--card)"} stroke="var(--foreground)" strokeWidth={2.2} strokeLinejoin="round" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
      {name && <input type="hidden" name={name} value={current || ""} />}
    </div>
  );
}
