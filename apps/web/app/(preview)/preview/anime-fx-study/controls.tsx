"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { at, lines, onFrame, paletteOf, puff, sfx, splash, Spring, ticks, wob, type SfxLang } from "@/registry/free/anime-fx/anime-fx";

/**
 * A 墨線硬影的開關樣張，跑在正式引擎上（按鈕、勾選框、進度條已是 block；開關在階段 4 做成 block）。
 */

export const SHELL = "border-[3px] border-foreground bg-card shadow-[4px_5px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))]";

export function Toggle({ lang, label }: { lang: SfxLang; label: string }) {
  const btn = useRef<HTMLButtonElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  const sp = useRef(new Spring(0, 380, 22));
  const off = useRef<(() => void) | null>(null);
  useEffect(() => () => off.current?.(), []);
  const flip = () => {
    const v = !on;
    setOn(v);
    const el = btn.current;
    if (!el || !knob.current) return;
    const P = paletteOf(el);
    const s = sp.current;
    s.to = v ? 1 : 0;
    let landed = false;
    const k0 = at(knob.current);
    lines(P, k0.x + (v ? -10 : 10), k0.y, { n: 4, dir: v ? Math.PI : 0, len: 26, spread: 7, life: 0.25 });
    off.current?.();
    off.current = onFrame((dt) => {
      const x = s.step(dt);
      // 拖影：速度越快拉得越長，同時變細（保持體積）
      const stretch = 1 + Math.min(0.7, Math.abs(s.v) * 0.09);
      if (knob.current) knob.current.style.transform = `translateX(${(x * 26).toFixed(2)}px) scale(${stretch.toFixed(3)}, ${(1 / Math.sqrt(stretch)).toFixed(3)})`;
      if (!landed && Math.abs(x - s.to) < 0.06) {
        landed = true;
        const t = at(el, v ? 1 : 0, 0.5);
        const dir = v ? 1 : -1;
        wob(P, t.x + dir * 4, t.y, { dir, r: 10, life: 0.35 });
        // 水花從軌道上緣冒出來，不蓋在旋鈕上
        if (v) splash(P, t.x - 14, at(el, 1, 0).y, { w: 22, h: 16, life: 0.5 });
        else puff(P, t.x + dir * 2, t.y + 10, { size: 7, vx: dir * 20, vy: -10, life: 0.55 });
        ticks(P, t.x, t.y - 14, { dir: v ? -0.7 : -2.4, n: 3, r: 5, len: 11 });
        const lb = at(el.parentElement ?? el, 1, 0);
        if (v) sfx(P, "click", lb.x + 48, lb.y - 12, { size: 42, lang, rot: 0.1, life: 0.8 });
      }
      if (s.still) {
        off.current?.();
        off.current = null;
      }
    });
  };
  return (
    <div className="inline-flex items-center gap-3">
      <button ref={btn} type="button" role="switch" aria-checked={on} aria-label={label} onClick={flip} className={cn("relative h-8 w-[60px] rounded-full p-[3px] outline-offset-4 transition-colors duration-200", SHELL, on && "!bg-[var(--sunui-spot)]")}>
        <span ref={knob} className="block size-[22px] rounded-full border-[2.5px] border-foreground bg-card will-change-transform" />
      </button>
      <span className="text-[15px] font-bold">{label}</span>
    </div>
  );
}
