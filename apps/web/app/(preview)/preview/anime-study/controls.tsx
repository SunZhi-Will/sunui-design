"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { cn } from "@/lib/utils";

import { at, backLayer, burst, kira, layerFor, later, lines, onFrame, puff, sfx, shards, Spring, ticks, wob, type Palette, type WordStyle } from "./fx";

/**
 * 三個樣式方向的控制項（只給樣張用）：
 * A 墨線硬影：3px 墨線加品牌色淡色硬投影，斜體粗字（報告第 5 節的建議）
 * B 質感外殼：craft 的表面與陰影，只有用的時候才有作畫特效，份量較輕
 * C 網點墨稿：黑白墨線，陰影是網點，品牌色只在選中與點綴
 */

export type Dir = "ink" | "craft" | "tone";
export type Lang = "ja" | "zh-TW" | "zh-CN";
export type Families = Record<Lang | "jaAlt", string>;

export const WORDS: Record<Lang, Record<"impact" | "click" | "swish" | "pop" | "skid" | "rumble", string>> = {
  ja: { impact: "ドン!", click: "カチッ", swish: "シュッ", pop: "ポン", skid: "ズザッ", rumble: "ゴゴゴ" },
  "zh-TW": { impact: "砰!", click: "喀!", swish: "咻!", pop: "啵!", skid: "唰!", rumble: "轟轟" },
  "zh-CN": { impact: "砰!", click: "咔!", swish: "咻!", pop: "啵!", skid: "唰!", rumble: "轰轰" },
};

type Look = { power: number; word: WordStyle; wordScale: number };
const LOOK: Record<Dir, Look> = {
  ink: { power: 1, word: "solid", wordScale: 1 },
  craft: { power: 0.62, word: "hollow", wordScale: 0.7 },
  tone: { power: 1, word: "dotted", wordScale: 1 },
};

export type Ctx = { dir: Dir; lang: Lang; fam: Families };

/** 把 CSS 顏色（變數、color-mix）換成畫布認得的字串 */
function resolve(el: Element, css: string) {
  const probe = document.createElement("span");
  probe.style.color = css;
  probe.style.display = "none";
  el.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
}

const SPOT = "var(--sunui-spot, var(--primary))";
export const INK = "#141414";

export function paletteFor(dir: Dir, el: Element): Palette {
  const card = resolve(el, "var(--card)");
  if (dir === "tone")
    return { fill: card, shade: resolve(el, "color-mix(in oklch, var(--foreground) 22%, var(--card))"), line: resolve(el, "var(--foreground)"), accent: resolve(el, SPOT), ink: INK, tone: true };
  return { fill: card, shade: resolve(el, `color-mix(in oklch, ${SPOT} 24%, var(--card))`), line: resolve(el, SPOT), accent: resolve(el, "var(--sunui-like)"), ink: INK, tone: false };
}

function fontOf(ctx: Ctx) {
  return ctx.lang === "ja" ? ctx.fam.ja : ctx.fam[ctx.lang];
}

/** 外殼：三個方向的靜止樣子就差在這裡 */
export function shell(dir: Dir) {
  if (dir === "ink") return "border-[3px] border-foreground bg-card shadow-[4px_5px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))]";
  if (dir === "craft") return "border border-border bg-card shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_1px_2px_rgb(0_0_0/0.06),0_3px_8px_rgb(0_0_0/0.05)]";
  return "border-[2.5px] border-foreground bg-card anime-tone-shadow";
}

const labelFont: Record<Dir, string> = { ink: "italic font-extrabold", craft: "font-semibold", tone: "italic font-black" };

// ───────── 壓扁：按住變扁（保持體積所以變寬），放開過衝 ─────────

function useSquash(ref: RefObject<HTMLElement | null>, { low = 0.6, wide = 0.25 } = {}) {
  const st = useRef<{ s: Spring; pop: Spring; tilt: Spring; off: (() => void) | null } | null>(null);
  if (!st.current) st.current = { s: new Spring(1, 520, 15), pop: new Spring(1, 300, 12), tilt: new Spring(0, 260, 10), off: null };
  const kick = () => {
    const q = st.current!;
    if (q.off) return;
    const off = onFrame((dt) => {
      const el = ref.current;
      const y = q.s.step(dt);
      const p = q.pop.step(dt);
      const t = q.tilt.step(dt);
      if (el) el.style.transform = `rotate(${t.toFixed(2)}deg) scale(${((1 + (1 - y) * wide) * p).toFixed(4)}, ${(y * p).toFixed(4)})`;
      const still = [q.s, q.pop, q.tilt].every((sp) => Math.abs(sp.x - sp.to) < 0.001 && Math.abs(sp.v) < 0.01);
      if (still && q.s.to === 1) {
        off();
        q.off = null;
        if (el) el.style.transform = "";
      }
    });
    q.off = () => off();
  };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const down = () => {
      st.current!.s.to = low;
      kick();
    };
    const up = () => {
      st.current!.s.to = 1;
      kick();
    };
    el.addEventListener("pointerdown", down);
    for (const e of ["pointerup", "pointerleave", "pointercancel", "blur"]) el.addEventListener(e, up);
    return () => {
      el.removeEventListener("pointerdown", down);
      for (const e of ["pointerup", "pointerleave", "pointercancel", "blur"]) el.removeEventListener(e, up);
      st.current?.off?.();
    };
  }, [ref, low]);
  return { q: st.current, kick };
}

function useBack() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => (ref.current ? backLayer(ref.current) : undefined), []);
  return ref;
}

// ───────── 按鈕 ─────────

export function AnimeButton({ ctx, primary = true, children }: { ctx: Ctx; primary?: boolean; children: React.ReactNode }) {
  const b = useRef<HTMLButtonElement>(null);
  const back = useBack();
  const { q, kick } = useSquash(b, primary ? { low: 0.55, wide: 0.26 } : { low: 0.74, wide: 0.3 });
  const [inv, setInv] = useState(false);
  const [done, setDone] = useState(false);
  const seq = useRef(0);
  const L = LOOK[ctx.dir];

  const press = () => {
    const el = b.current;
    if (!el) return;
    const P = paletteFor(ctx.dir, el);
    const c = at(el);
    const w = L.power;
    if (!primary) {
      q.s.x = Math.min(q.s.x, 0.8);
      q.s.v += 4;
      kick();
      const r = at(el, 1, 0);
      ticks(P, r.x - 6, r.y - 2, { dir: -1.05, n: 3, r: 5, len: 15, fan: 0.36, life: 0.45 });
      return;
    }
    const n = ++seq.current;
    setDone(false);
    q.s.x = Math.min(q.s.x, 0.6);
    q.pop.x = 1 + 0.22 * w;
    q.tilt.x = -5 * w;
    kick();
    if (ctx.dir !== "craft") {
      setInv(true);
      later(180, () => setInv(false));
    }
    burst(P, c.x, c.y, { r: 92 * w, spikes: 15, life: 0.46, layer: layerFor(back.current) });
    shards(P, c.x, c.y, { n: Math.round(10 * w), speed: 250 * w, size: 8 * w, life: 0.9, arc: Math.PI * 2 });
    for (const [dx, dy] of [[-1, -0.5], [1, -1], [-1, 0.9], [1, 1]] as const)
      puff(P, c.x + dx * (c.w / 2 + 4), c.y + dy * 22, { size: (12 + Math.random() * 4) * w, vx: dx * 44, vy: dy * 28 - 6, life: 0.85 });
    sfx(P, WORDS[ctx.lang].impact, c.x + 8, c.y - 70 * Math.max(0.8, w), { size: 92 * L.wordScale, style: L.word, family: fontOf(ctx), life: 1 });
    ticks(P, c.x - 80 * w, c.y - 56 * w, { dir: -2.4, n: 2, r: 4, len: 18 });
    ticks(P, c.x + 92 * w, c.y - 48 * w, { dir: -0.7, n: 2, r: 4, len: 18 });
    later(200, () => {
      if (n !== seq.current) return;
      q.s.x = 1 + 0.2 * w;
      kick();
      wob(P, c.x - c.w / 2 - 6, c.y, { dir: -1 });
      wob(P, c.x + c.w / 2 + 6, c.y, { dir: 1 });
    });
    later(650, () => {
      if (n !== seq.current) return;
      setDone(true);
      const r = at(el, 1, 0);
      kira(P, r.x - 14, r.y + 2, { r: 13 * w + 4, life: 0.9 });
      later(1800, () => n === seq.current && setDone(false));
    });
  };

  return (
    <span className="relative inline-block isolate">
      {primary && <canvas ref={back} aria-hidden className="pointer-events-none absolute -inset-[110px] -z-10 size-[calc(100%+220px)]" />}
      <button
        ref={b}
        type="button"
        onClick={press}
        className={cn(
          "relative inline-flex items-center gap-1.5 rounded-[14px] px-6 py-3 text-[17px] leading-none will-change-transform select-none touch-manipulation outline-offset-4",
          shell(ctx.dir),
          labelFont[ctx.dir],
          !primary && ctx.dir !== "craft" && "shadow-none",
          inv && "!bg-foreground !text-background !shadow-none [--tone-bg:var(--foreground)]",
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

// ───────── 勾選框 ─────────

export function AnimeCheckbox({ ctx, children }: { ctx: Ctx; children: React.ReactNode }) {
  const box = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  const { q, kick } = useSquash(box, { low: 0.7, wide: 0.3 });
  const L = LOOK[ctx.dir];
  const change = (v: boolean) => {
    setOn(v);
    const el = box.current;
    if (!el) return;
    const P = paletteFor(ctx.dir, el);
    const c = at(el);
    if (!v) {
      wob(P, c.x + c.w / 2 + 4, c.y, { dir: 1, r: 8, life: 0.3 });
      return;
    }
    q.pop.x = 1.25;
    kick();
    shards(P, c.x, c.y, { n: Math.round(7 * L.power), speed: 170, size: 6 * L.power, life: 0.7 });
    ticks(P, c.x + c.w / 2, c.y - c.h / 2, { dir: -0.8, n: 3, r: 6, len: 12 });
    puff(P, c.x - c.w / 2 - 2, c.y + c.h / 2, { size: 8 * L.power, vx: -24, vy: -6, life: 0.6 });
    const lb = at(el.parentElement ?? el, 1, 0);
    sfx(P, WORDS[ctx.lang].skid, lb.x + 52, lb.y - 14, { size: 50 * L.wordScale, style: ctx.dir === "ink" ? "dotted" : L.word, family: fontOf(ctx), rot: -0.08, life: 0.9 });
  };
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 select-none">
      <input type="checkbox" className="peer sr-only" checked={on} onChange={(e) => change(e.target.checked)} />
      <span ref={box} className={cn("grid size-7 place-items-center rounded-[8px] will-change-transform peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[var(--sunui-spot)]", shell(ctx.dir), ctx.dir === "craft" && on && "border-[var(--sunui-spot)]")}>
        <svg viewBox="0 0 24 24" aria-hidden className="size-5 overflow-visible">
          <path d="M4 12.5l5.5 5.5L20 6" fill="none" stroke={ctx.dir === "tone" ? "var(--sunui-spot)" : "var(--foreground)"} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={on ? 0 : 1} style={{ transition: "stroke-dashoffset 240ms cubic-bezier(.2,.8,.2,1)" }} />
        </svg>
      </span>
      <span className={cn("text-[15px]", ctx.dir === "craft" ? "font-medium" : "font-bold")}>{children}</span>
    </label>
  );
}

// ───────── 開關：旋鈕跟彈簧走，速度越快拉得越長，撞到底才有特效 ─────────

export function AnimeToggle({ ctx, label }: { ctx: Ctx; label: string }) {
  const btn = useRef<HTMLButtonElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  const sp = useRef(new Spring(0, 380, 22));
  const off = useRef<(() => void) | null>(null);
  const L = LOOK[ctx.dir];
  useEffect(() => () => off.current?.(), []);
  const flip = () => {
    const v = !on;
    setOn(v);
    const el = btn.current;
    if (!el) return;
    const P = paletteFor(ctx.dir, el);
    const s = sp.current;
    s.to = v ? 1 : 0;
    let landed = false;
    const k0 = at(knob.current!);
    lines(P, k0.x + (v ? -10 : 10), k0.y, { n: 4, dir: v ? Math.PI : 0, len: 26, spread: 7, life: 0.25 });
    off.current?.();
    off.current = onFrame((dt) => {
      const x = s.step(dt);
      const stretch = 1 + Math.min(0.7, Math.abs(s.v) * 0.09);
      if (knob.current) knob.current.style.transform = `translateX(${(x * 26).toFixed(2)}px) scale(${stretch.toFixed(3)}, ${(1 / Math.sqrt(stretch)).toFixed(3)})`;
      if (!landed && Math.abs(x - s.to) < 0.06) {
        landed = true;
        const t = at(el, v ? 1 : 0, 0.5);
        const dir = v ? 1 : -1;
        wob(P, t.x + dir * 4, t.y, { dir, r: 10, life: 0.35 });
        puff(P, t.x + dir * 2, t.y + 10, { size: 7 * L.power, vx: dir * 20, vy: -10, life: 0.55 });
        ticks(P, t.x, t.y - 14, { dir: v ? -0.7 : -2.4, n: 3, r: 5, len: 11 });
        const lb = at(el.parentElement ?? el, 1, 0);
        if (v) sfx(P, WORDS[ctx.lang].click, lb.x + 48, lb.y - 12, { size: 42 * L.wordScale, style: L.word === "solid" ? "hollow" : L.word, family: fontOf(ctx), rot: 0.1, life: 0.8 });
      }
      if (Math.abs(x - s.to) < 0.0008 && Math.abs(s.v) < 0.01) {
        off.current?.();
        off.current = null;
      }
    });
  };
  return (
    <div className="inline-flex items-center gap-3">
      <button
        ref={btn}
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={flip}
        className={cn("relative h-8 w-[60px] rounded-full p-[3px] outline-offset-4 transition-colors duration-200", shell(ctx.dir), on && (ctx.dir === "tone" ? "anime-tone-fill" : "!bg-[var(--sunui-spot)]"))}
      >
        <span ref={knob} className={cn("block size-[22px] rounded-full will-change-transform", ctx.dir === "craft" ? "bg-white shadow-[0_1px_2px_rgb(0_0_0/0.25)]" : "border-[2.5px] border-foreground bg-card")} />
      </button>
      <span className={cn("text-[15px]", ctx.dir === "craft" ? "font-medium" : "font-bold")}>{label}</span>
    </div>
  );
}

// ───────── 進度條：分段湧進，前緣揚塵，到底一記打擊再落定成勾 ─────────

export function AnimeProgress({ ctx }: { ctx: Ctx }) {
  const bar = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(0);
  const [state, setState] = useState<"idle" | "run" | "done">("idle");
  const sp = useRef(new Spring(0, 140, 18));
  const run = useRef(0);
  const off = useRef<(() => void) | null>(null);
  const L = LOOK[ctx.dir];
  useEffect(() => () => off.current?.(), []);

  const go = () => {
    const el = bar.current;
    if (!el) return;
    const id = ++run.current;
    const P = paletteFor(ctx.dir, el);
    const s = sp.current;
    s.x = 0;
    s.v = 0;
    s.to = 0;
    setState("run");
    off.current?.();
    off.current = onFrame((dt) => {
      const x = s.step(dt);
      if (fill.current) fill.current.style.width = `${Math.max(0, Math.min(1, x)) * 100}%`;
      setPct(Math.round(Math.max(0, Math.min(1, x)) * 100));
    });
    const c0 = at(el, 0.5, 0);
    sfx(P, WORDS[ctx.lang].rumble, c0.x, c0.y - 30, { size: 40 * L.wordScale, style: L.word === "solid" ? "dotted" : L.word, family: fontOf(ctx), rot: -0.06, life: 1.1 });
    const steps = [0.18, 0.34, 0.52, 0.71, 0.86, 1];
    steps.forEach((v, i) =>
      later(380 + i * 420, () => {
        if (id !== run.current) return;
        s.to = v;
        const e = at(el, v, 0.5);
        later(140, () => {
          if (id !== run.current) return;
          puff(P, e.x, e.y + e.h / 2, { size: 6 * L.power, n: 4, vx: 10, vy: -16, life: 0.55 });
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
            burst(P, end.x, end.y, { r: 46 * L.power, spikes: 11, life: 0.4 });
            shards(P, end.x, end.y, { n: Math.round(6 * L.power), speed: 160, size: 5, life: 0.6 });
            sfx(P, WORDS[ctx.lang].impact, end.x - 20, end.y - 44, { size: 60 * L.wordScale, style: L.word, family: fontOf(ctx), life: 0.95 });
          });
      }),
    );
  };

  return (
    <div className="w-full max-w-[260px]">
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className={ctx.dir === "craft" ? "font-medium" : "font-bold"}>上傳</span>
        <span className="inline-flex items-center gap-1 tabular-nums text-muted-foreground">
          {state === "done" && (
            <svg viewBox="0 0 24 24" aria-hidden className="size-4">
              <path d="M4 12.5l5.5 5.5L20 6" fill="none" stroke="var(--sunui-success)" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {state === "done" ? "完成" : `${pct}%`}
        </span>
      </div>
      <div ref={bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="上傳" className={cn("relative h-4 overflow-hidden rounded-full p-[2px]", shell(ctx.dir))}>
        <div ref={fill} className={cn("h-full w-0 rounded-full", ctx.dir === "tone" ? "anime-tone-fill" : "bg-[var(--sunui-spot)]")} />
      </div>
      <button type="button" onClick={go} className="mt-3 text-[13px] font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">
        {state === "idle" ? "開始上傳" : "再跑一次"}
      </button>
    </div>
  );
}
