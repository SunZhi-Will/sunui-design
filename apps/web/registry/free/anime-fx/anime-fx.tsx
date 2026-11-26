"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";

import { add, addLayer, clamp, inn, onFrame, Spring, tone, type Layer, type Palette } from "./anime-fx-core";
import { glyphs, UNITS } from "./anime-fx-glyphs";

/**
 * anime-fx: an engine for anime-style drawn effects. A control is plain at rest; use it and it throws drawn effects:
 * impact stars, smoke, crystal chips, speed lines, accent wedges, splashes, and manga sound-effect lettering in Japanese or Chinese.
 * Everything is drawn on one canvas over the page that ignores the pointer.
 *
 *   const back = useBackLayer();                    // canvas behind the control (for the impact star)
 *   const P = paletteOf(button);                    // colours from the theme, following --sunui-spot
 *   burst(P, c.x, c.y, { layer: back.layer() });
 *   sfx(P, "impact", c.x, c.y - 70, { size: 92 }); // Japanese or Chinese from <html lang>
 *
 * With reduced motion on, no effect is drawn and state changes as usual.
 */

export * from "./anime-fx-core";

// ───────── lettering ─────────

export type SfxSlot = "impact" | "click" | "swish" | "pop" | "skid" | "rumble";
export type SfxLang = "ja" | "zh-TW" | "zh-CN";
export type SfxStyle = "solid" | "hollow" | "dotted";

export const sfxWords: Record<SfxLang, Record<SfxSlot, string>> = {
  ja: { impact: "ドン!", click: "カチッ", swish: "シュッ", pop: "ポン", skid: "ズザッ", rumble: "ゴゴゴ" },
  "zh-TW": { impact: "砰!", click: "喀!", swish: "咻!", pop: "啵!", skid: "唰!", rumble: "轟轟" },
  "zh-CN": { impact: "砰!", click: "咔!", swish: "咻!", pop: "啵!", skid: "唰!", rumble: "轰轰" },
};

/** Default style per slot: hits are solid, the click is hollow, skid and rumble are screentone. */
export const sfxStyles: Record<SfxSlot, SfxStyle> = { impact: "solid", click: "hollow", swish: "solid", pop: "solid", skid: "dotted", rumble: "dotted" };

/** Chinese pages get Chinese words (traditional or simplified); every other language gets Japanese. */
export function sfxLang(lang = typeof document !== "undefined" ? document.documentElement.lang : ""): SfxLang {
  const l = lang.toLowerCase();
  if (!l.startsWith("zh")) return "ja";
  return /hant|tw|hk|mo/.test(l) ? "zh-TW" : "zh-CN";
}

const fontOf = (lang: SfxLang) => (lang === "ja" ? glyphs.ja : lang === "zh-TW" ? glyphs.tc : glyphs.sc);
const paths = new Map<string, Path2D>();
const pathOf = (d: string) => {
  let p = paths.get(d);
  if (!p) paths.set(d, (p = new Path2D(d)));
  return p;
};

/** Seeded random, so the same seed lays a word out the same way. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/**
 * Draw a sound-effect word centred on (x, y). Each glyph turns a little, varies in size and steps up as the word goes on.
 * The edge is 5% of the size: Chinese glyphs have many strokes and a thicker edge fills the gaps inside them.
 */
export function drawWord(g: CanvasRenderingContext2D, P: Palette, text: string, lang: SfxLang, x: number, y: number, size: number, style: SfxStyle, seed = 7) {
  // Chinese glyphs are dense: below 48px screentone stops reading, so fall back to solid
  if (style === "dotted" && lang !== "ja" && size < 48) style = "solid";
  const set = fontOf(lang);
  const r = seeded(seed);
  const em = size / UNITS;
  const items = [...text].flatMap((ch, i) => {
    const gl = set[ch];
    if (!gl) return [];
    const big = ch === "!" ? 0.95 : i === 0 ? 1.12 : 0.92 + r() * 0.12;
    return [{ adv: gl[0] * 0.86 * big, d: gl[1], big, rot: (r() - 0.5) * 0.32, dy: -i * size * 0.06 + (r() - 0.5) * size * 0.08 }];
  });
  const total = items.reduce((s, m) => s + m.adv, 0) * em;
  const edge = Math.max(2, size * 0.05);
  const outer = style === "hollow" ? "#ffffff" : P.ink;
  const inner = style === "hollow" ? P.ink : "#ffffff";
  const pass = (paint: (p: Path2D, k: number) => void) => {
    let px = x - total / 2;
    for (const m of items) {
      const k = em * m.big;
      const w = m.adv * em;
      g.save();
      g.translate(px + w / 2, y + m.dy);
      g.rotate(m.rot);
      g.scale(k, k);
      // Glyph origin is the baseline at the left; move to the centre (a CJK body centres about 0.38 em above the baseline)
      g.translate(-m.adv / (0.86 * m.big) / 2, UNITS * 0.38);
      paint(pathOf(m.d), k);
      g.restore();
      px += w;
    }
  };
  g.lineJoin = "round";
  pass((p, k) => {
    g.strokeStyle = outer;
    g.lineWidth = (edge * 2.2) / k;
    g.stroke(p);
  });
  pass((p, k) => {
    g.strokeStyle = inner;
    g.lineWidth = (edge * (style === "hollow" ? 1.1 : 1.2)) / k;
    g.stroke(p);
  });
  pass((p, k) => {
    if (style === "solid") g.fillStyle = P.ink;
    else if (style === "hollow") g.fillStyle = "#ffffff";
    else {
      const gap = Math.max(2.6, size * 0.05) / k;
      g.fillStyle = tone(g, P.ink, "#ffffff", gap * 0.36, gap) ?? P.ink;
    }
    g.fill(p);
    if (style === "dotted") {
      g.strokeStyle = P.ink;
      g.lineWidth = Math.max(1, edge * 0.4) / k;
      g.stroke(p);
    }
  });
}

/** A word lands a size too big, springs to size, wobbles while it stays, and shrinks away. */
export function sfx(
  P: Palette,
  slot: SfxSlot,
  x: number,
  y: number,
  o: { size?: number; rot?: number; life?: number; style?: SfxStyle; lang?: SfxLang; layer?: Layer | null } = {},
) {
  const lang = o.lang ?? sfxLang();
  const { size = 64, rot = -0.12, life = 1, style = sfxStyles[slot], layer } = o;
  const text = sfxWords[lang][slot];
  const s = new Spring(0.2, 520, 17);
  s.to = 1;
  let lastT = 0;
  const seed = Math.floor(Math.random() * 1e6);
  add(
    life,
    (g, k, t) => {
      const sc = s.step(t - lastT) * (1 - inn(clamp((k - 0.86) / 0.14)));
      lastT = t;
      if (sc < 0.02) return;
      g.translate(x, y);
      g.rotate(rot + Math.sin(t * 14) * 0.015);
      g.scale(sc, sc);
      drawWord(g, P, text, lang, 0, 0, size, style, seed);
    },
    layer,
  );
}

// ───────── React ─────────

/**
 * A press: squash while held (keeping volume, so it widens), overshoot on release. Also returns pop (scale up, spring back)
 * and tilt (degrees); for a hit, set their x and call kick(). Uses the animation loop only while something moves.
 */
export function useSquash(ref: RefObject<HTMLElement | null>, { low = 0.6, wide = 0.25 } = {}) {
  const st = useMemo(() => ({ s: new Spring(1, 520, 15), pop: new Spring(1, 300, 12), tilt: new Spring(0, 260, 10), off: null as null | (() => void) }), []);
  const kick = useMemo(
    () => () => {
      if (st.off) return;
      st.off = onFrame((dt) => {
        const el = ref.current;
        const y = st.s.step(dt);
        const p = st.pop.step(dt);
        const t = st.tilt.step(dt);
        if (el) el.style.transform = `rotate(${t.toFixed(2)}deg) scale(${((1 + (1 - y) * wide) * p).toFixed(4)}, ${(y * p).toFixed(4)})`;
        if (st.s.to === 1 && st.s.still && st.pop.still && st.tilt.still) {
          st.off?.();
          st.off = null;
          if (el) el.style.transform = "";
        }
      });
    },
    [ref, st, wide],
  );
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (el as HTMLButtonElement).disabled) return;
      st.s.to = low;
      kick();
    };
    const up = () => {
      st.s.to = 1;
      kick();
    };
    const ends = ["pointerup", "pointerleave", "pointercancel", "blur"] as const;
    el.addEventListener("pointerdown", down);
    for (const e of ends) el.addEventListener(e, up);
    return () => {
      el.removeEventListener("pointerdown", down);
      for (const e of ends) el.removeEventListener(e, up);
      st.off?.();
      st.off = null;
    };
  }, [ref, st, low, kick]);
  return { s: st.s, pop: st.pop, tilt: st.tilt, kick };
}

/**
 * A canvas behind a control, for effects that belong behind it such as the impact star.
 * Spread props onto a <canvas> inside the control's wrapper (the wrapper needs relative and isolate), and keep overflow: hidden off its ancestors.
 */
export function useBackLayer(spread = 110) {
  const ref = useRef<HTMLCanvasElement>(null);
  const layer = useRef<Layer | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const { layer: L, remove } = addLayer(ref.current);
    layer.current = L;
    return () => {
      remove();
      layer.current = null;
    };
  }, []);
  return {
    layer: () => layer.current,
    props: {
      ref,
      "aria-hidden": true,
      className: "pointer-events-none absolute -z-10",
      style: { inset: -spread, width: `calc(100% + ${spread * 2}px)`, height: `calc(100% + ${spread * 2}px)` },
    },
  };
}
