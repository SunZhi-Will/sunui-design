"use client";

import { useRef } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { at, burst, kira, lines, paletteOf, puff, sfx, shards, splash, ticks, useBackLayer, wob, type Layer, type Palette } from "./anime-fx";

type Fire = (P: Palette, c: ReturnType<typeof at>, back: Layer | null) => void;

const effects: { id: string; fire: Fire }[] = [
  { id: "burst", fire: (P, c, back) => burst(P, c.x, c.y, { r: 52, layer: back }) },
  { id: "puff", fire: (P, c) => puff(P, c.x, c.y, { size: 15, vy: -22 }) },
  { id: "shards", fire: (P, c) => shards(P, c.x, c.y, { n: 9, speed: 190, size: 7 }) },
  { id: "ticks", fire: (P, c) => ticks(P, c.x, c.y, { n: 5, r: 10, len: 16, fan: 0.6 }) },
  { id: "lines", fire: (P, c) => lines(P, c.x + 36, c.y, { n: 6, len: 56 }) },
  { id: "wob", fire: (P, c) => (wob(P, c.x - 16, c.y, { dir: -1 }), wob(P, c.x + 16, c.y, { dir: 1 })) },
  { id: "kira", fire: (P, c) => kira(P, c.x, c.y, { r: 18, life: 0.8 }) },
  { id: "splash", fire: (P, c) => splash(P, c.x, c.y + 12, { w: 36, h: 26 }) },
  { id: "sfx", fire: (P, c) => sfx(P, "impact", c.x, c.y, { size: 64 }) },
];

const copy = {
  en: { title: "Tap a tile to fire one effect", sfx: "word" },
  "zh-TW": { title: "點一格放一個特效", sfx: "擬聲字" },
  "zh-CN": { title: "点一格放一个特效", sfx: "拟声字" },
  ja: { title: "タイルを押してエフェクトを出す", sfx: "擬音" },
};

/** 引擎本身沒有介面：用九格示範每一種特效與擬聲字，點一格放一次。 */
export default function AnimeFxDemo() {
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-md px-2 py-10">
      <p className="mb-4 text-sm text-muted-foreground">{t.title}</p>
      <div className="grid grid-cols-3 gap-3">
        {effects.map((e) => (
          <Tile key={e.id} label={e.id === "sfx" ? t.sfx : e.id} fire={e.fire} />
        ))}
      </div>
    </div>
  );
}

function Tile({ label, fire }: { label: string; fire: Fire }) {
  const pad = useRef<HTMLButtonElement>(null);
  const back = useBackLayer(50);
  return (
    <span className="relative isolate block">
      <canvas {...back.props} />
      <button
        ref={pad}
        type="button"
        onClick={() => pad.current && fire(paletteOf(pad.current), at(pad.current), back.layer())}
        className="flex h-24 w-full items-end rounded-[12px] border-[3px] border-foreground bg-card p-2.5 text-left font-mono text-xs shadow-[3px_4px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))] outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--sunui-spot,var(--primary))]"
      >
        {label}
      </button>
    </span>
  );
}
