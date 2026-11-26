"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  at,
  burst,
  kira,
  later,
  lines,
  onFrame,
  paletteOf,
  puff,
  sfx,
  shards,
  splash,
  Spring,
  ticks,
  useBackLayer,
  useSquash,
  wob,
  type SfxLang,
} from "@/registry/free/anime-fx/anime-fx";

/**
 * A 墨線硬影的四個控制項，跑在正式引擎上（階段 1 驗收用，階段 2 再做成 block）。
 */

export const SHELL = "border-[3px] border-foreground bg-card shadow-[4px_5px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))]";

export function Button({ lang, primary = true, children }: { lang: SfxLang; primary?: boolean; children: React.ReactNode }) {
  const b = useRef<HTMLButtonElement>(null);
  const back = useBackLayer();
  const sq = useSquash(b, primary ? { low: 0.55, wide: 0.26 } : { low: 0.74, wide: 0.3 });
  const [inv, setInv] = useState(false);
  const [done, setDone] = useState(false);
  const seq = useRef(0);

  const press = () => {
    const el = b.current;
    if (!el) return;
    const P = paletteOf(el);
    const c = at(el);
    if (!primary) {
      sq.s.x = Math.min(sq.s.x, 0.8);
      sq.s.v += 4;
      sq.kick();
      const r = at(el, 1, 0);
      ticks(P, r.x - 6, r.y - 2, { dir: -1.05, n: 3, r: 5, len: 15, fan: 0.36, life: 0.45 });
      return;
    }
    const n = ++seq.current;
    setDone(false);
    // 打擊：壓扁、放大、歪一點，整顆反白一格
    sq.s.x = Math.min(sq.s.x, 0.6);
    sq.pop.x = 1.22;
    sq.tilt.x = -5;
    sq.kick();
    setInv(true);
    later(180, () => setInv(false));
    burst(P, c.x, c.y, { r: 92, spikes: 15, life: 0.46, layer: back.layer() });
    // 碎片從按鈕外緣往外飛，不從中心炸出，才不會蓋到標籤
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      shards(P, c.x + Math.cos(a) * (c.w / 2 + 6), c.y + Math.sin(a) * (c.h / 2 + 6), { n: 1, dir: a, arc: 0.5, speed: 250, size: 8, life: 0.9 });
    }
    for (const [dx, dy] of [[-1, -0.5], [1, -1], [-1, 0.9], [1, 1]] as const)
      // 煙往兩側與上方飄，不往下壓到下面的控制項
      puff(P, c.x + dx * (c.w / 2 + 4), c.y + dy * 18, { size: 12 + Math.random() * 4, vx: dx * 46, vy: dy < 0 ? -34 : -8, life: 0.85 });
    sfx(P, "impact", c.x + 8, c.y - 72, { size: 92, lang });
    ticks(P, c.x - 80, c.y - 56, { dir: -2.4, n: 2, r: 4, len: 18 });
    ticks(P, c.x + 92, c.y - 48, { dir: -0.7, n: 2, r: 4, len: 18 });
    // 餘韻：回彈過衝、兩邊晃動弧線
    later(200, () => {
      if (n !== seq.current) return;
      sq.s.x = 1.2;
      sq.kick();
      wob(P, c.x - c.w / 2 - 6, c.y, { dir: -1 });
      wob(P, c.x + c.w / 2 + 6, c.y, { dir: 1 });
    });
    // 落定：勾描出來加一個閃光
    later(650, () => {
      if (n !== seq.current) return;
      setDone(true);
      const r = at(el, 1, 0);
      kira(P, r.x - 14, r.y + 2, { r: 17, life: 0.9 });
      later(1800, () => n === seq.current && setDone(false));
    });
  };

  return (
    <span className="relative inline-block isolate">
      {primary && <canvas {...back.props} />}
      <button
        ref={b}
        type="button"
        onClick={press}
        className={cn(
          "relative inline-flex items-center gap-1.5 rounded-[14px] px-6 py-3 text-[17px] leading-none italic font-extrabold will-change-transform select-none touch-manipulation outline-offset-4",
          SHELL,
          !primary && "shadow-none",
          inv && "!bg-foreground !text-background !shadow-none",
        )}
      >
        {children}
        {primary && (
          <svg viewBox="0 0 24 18" aria-hidden className="h-[15px] overflow-visible transition-[width] duration-200" style={{ width: done ? 18 : 0 }}>
            <path d="M3 9.5l6 6L21 2.5" fill="none" stroke="var(--sunui-like)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={done ? 0 : 1} style={{ transition: "stroke-dashoffset 260ms cubic-bezier(.2,.8,.2,1)" }} />
          </svg>
        )}
      </button>
    </span>
  );
}

export function Checkbox({ lang, children }: { lang: SfxLang; children: React.ReactNode }) {
  const box = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  const sq = useSquash(box, { low: 0.7, wide: 0.3 });
  const change = (v: boolean) => {
    setOn(v);
    const el = box.current;
    if (!el) return;
    const P = paletteOf(el);
    const c = at(el);
    if (!v) {
      wob(P, c.x + c.w / 2 + 4, c.y, { dir: 1, r: 8, life: 0.3 });
      return;
    }
    sq.pop.x = 1.25;
    sq.kick();
    shards(P, c.x, c.y, { n: 7, speed: 170, size: 6, life: 0.7 });
    ticks(P, c.x + c.w / 2, c.y - c.h / 2, { dir: -0.8, n: 3, r: 6, len: 12 });
    puff(P, c.x - c.w / 2 - 2, c.y + c.h / 2, { size: 8, vx: -24, vy: -6, life: 0.6 });
    const lb = at(el.parentElement ?? el, 1, 0);
    sfx(P, "skid", lb.x + 52, lb.y - 14, { size: 50, lang, rot: -0.08, life: 0.9 });
  };
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 select-none">
      <input type="checkbox" className="peer sr-only" checked={on} onChange={(e) => change(e.target.checked)} />
      <span ref={box} className={cn("grid size-7 place-items-center rounded-[8px] will-change-transform peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[var(--sunui-spot)]", SHELL)}>
        <svg viewBox="0 0 24 24" aria-hidden className="size-5 overflow-visible">
          <path d="M4 12.5l5.5 5.5L20 6" fill="none" stroke="var(--foreground)" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={on ? 0 : 1} style={{ transition: "stroke-dashoffset 240ms cubic-bezier(.2,.8,.2,1)" }} />
        </svg>
      </span>
      <span className="text-[15px] font-bold">{children}</span>
    </label>
  );
}

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

export function Progress({ lang }: { lang: SfxLang }) {
  const bar = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(0);
  const [state, setState] = useState<"idle" | "run" | "done">("idle");
  const sp = useRef(new Spring(0, 140, 18));
  const run = useRef(0);
  const off = useRef<(() => void) | null>(null);
  useEffect(() => () => off.current?.(), []);

  const go = () => {
    const el = bar.current;
    if (!el) return;
    const id = ++run.current;
    const P = paletteOf(el);
    const s = sp.current;
    s.x = 0;
    s.v = 0;
    s.to = 0;
    setState("run");
    off.current?.();
    off.current = onFrame((dt) => {
      const x = clampUnit(s.step(dt));
      if (fill.current) fill.current.style.width = `${x * 100}%`;
      setPct(Math.round(x * 100));
    });
    const top = at(el, 0.5, 0);
    sfx(P, "rumble", top.x, top.y - 30, { size: 40, lang, rot: -0.06, life: 1.1 });
    [0.18, 0.34, 0.52, 0.71, 0.86, 1].forEach((v, i) =>
      later(380 + i * 420, () => {
        if (id !== run.current) return;
        s.to = v;
        const e = at(el, v, 0.5);
        later(140, () => {
          if (id !== run.current) return;
          puff(P, e.x, e.y + e.h / 2, { size: 6, n: 4, vx: 10, vy: -16, life: 0.55 });
          lines(P, e.x - 6, e.y, { n: 3, dir: Math.PI, len: 22, spread: 6, life: 0.22 });
        });
        if (v === 1)
          later(420, () => {
            if (id !== run.current) return;
            off.current?.();
            off.current = null;
            if (fill.current) fill.current.style.width = "100%";
            setPct(100);
            setState("done");
            const end = at(el, 1, 0.5);
            burst(P, end.x, end.y, { r: 46, spikes: 11, life: 0.4 });
            shards(P, end.x, end.y, { n: 6, speed: 160, size: 5, life: 0.6 });
            sfx(P, "impact", end.x - 20, end.y - 44, { size: 60, lang, life: 0.95 });
          });
      }),
    );
  };

  return (
    <div className="w-full max-w-[260px]">
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className="font-bold">上傳</span>
        <span className="inline-flex items-center gap-1 tabular-nums text-muted-foreground">
          {state === "done" && (
            <svg viewBox="0 0 24 24" aria-hidden className="size-4">
              <path d="M4 12.5l5.5 5.5L20 6" fill="none" stroke="var(--sunui-success)" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {state === "done" ? "完成" : `${pct}%`}
        </span>
      </div>
      <div ref={bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="上傳" className={cn("relative h-4 overflow-hidden rounded-full p-[2px]", SHELL)}>
        <div ref={fill} className="h-full w-0 rounded-full bg-[var(--sunui-spot)]" />
      </div>
      <button type="button" onClick={go} className="mt-3 text-[13px] font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">
        {state === "idle" ? "開始上傳" : "再跑一次"}
      </button>
    </div>
  );
}

const clampUnit = (v: number) => Math.max(0, Math.min(1, v));
