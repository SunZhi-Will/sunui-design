"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import {
  GradientBackdrop,
  gradientPalettes,
  gradientPresets,
  type GradientPalette,
  type GradientPreset,
} from "./gradient-backdrop";

const copy = {
  en: {
    eyebrow: "Spring launch",
    title: "Light you can build on",
    body: "Nine code-drawn gradients. No image files, any palette.",
    cta: "Shop the drop",
    palette: "Palette",
    own: "Preset default",
    names: {
      mesh: "Mesh",
      grain: "Grain",
      silk: "Silk",
      aurora: "Aurora",
      flow: "Color flow",
      floral: "Floral",
      horizon: "Horizon",
      maze: "Line maze",
      plasma: "Plasma shader",
    },
  },
  "zh-TW": {
    eyebrow: "春季上市",
    title: "可以拿來蓋東西的光",
    body: "九種用程式畫的漸層，不用圖檔，任何配色都行。",
    cta: "逛新品",
    palette: "配色",
    own: "預設配色",
    names: {
      mesh: "網格漸層",
      grain: "顆粒漸層",
      silk: "絲綢",
      aurora: "極光",
      flow: "色流",
      floral: "花瓣",
      horizon: "地平線光",
      maze: "線條迷宮",
      plasma: "即時 Shader",
    },
  },
  "zh-CN": {
    eyebrow: "春季上新",
    title: "可以拿来搭东西的光",
    body: "九种用代码画的渐变，不用图片，任何配色都行。",
    cta: "逛新品",
    palette: "配色",
    own: "默认配色",
    names: {
      mesh: "网格渐变",
      grain: "颗粒渐变",
      silk: "丝绸",
      aurora: "极光",
      flow: "色流",
      floral: "花瓣",
      horizon: "地平线光",
      maze: "线条迷宫",
      plasma: "实时 Shader",
    },
  },
  ja: {
    eyebrow: "春の新作",
    title: "その上に組み立てられる光",
    body: "コードで描く 9 種のグラデーション。画像ファイル不要、配色は自由。",
    cta: "新作を見る",
    palette: "パレット",
    own: "プリセット既定",
    names: {
      mesh: "メッシュ",
      grain: "グレイン",
      silk: "シルク",
      aurora: "オーロラ",
      flow: "カラーフロー",
      floral: "フローラル",
      horizon: "ホライズン",
      maze: "ラインメイズ",
      plasma: "プラズマシェーダー",
    },
  },
} satisfies Record<string, { names: Record<GradientPreset, string> } & Record<string, unknown>>;

const paletteNames = Object.keys(gradientPalettes) as GradientPalette[];

export default function GradientBackdropDemo() {
  const t = useDemoText(copy);
  const [palette, setPalette] = useState<GradientPalette | undefined>(undefined);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <GradientBackdrop preset="horizon" palette={palette} interactive className="rounded-xl">
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-6 py-12 text-center text-white">
          <p className="text-xs font-medium tracking-[0.2em] uppercase opacity-80">{t.eyebrow}</p>
          <h3 className="max-w-md text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t.title}</h3>
          <p className="max-w-sm text-sm text-pretty opacity-80">{t.body}</p>
          <button
            type="button"
            className="mt-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-transform duration-150 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none"
          >
            {t.cta}
          </button>
        </div>
      </GradientBackdrop>

      <div role="radiogroup" aria-label={t.palette} className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground">{t.palette}</span>
        {[undefined, ...paletteNames].map((name) => {
          const selected = palette === name;
          return (
            <button
              key={name ?? "default"}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPalette(name)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                selected ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:bg-muted",
              )}
            >
              {name ? (
                <span className="flex -space-x-1" aria-hidden>
                  {gradientPalettes[name].slice(1, 4).map((col) => (
                    <span key={col} className="size-2.5 rounded-full ring-1 ring-background" style={{ background: col }} />
                  ))}
                </span>
              ) : null}
              {name ?? t.own}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {gradientPresets.map((preset) => (
          <GradientBackdrop key={preset} preset={preset} palette={palette} className="aspect-[4/3] rounded-lg border border-border">
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
              <span className="font-medium">{t.names[preset]}</span>
              <code className="opacity-70">{preset}</code>
            </div>
          </GradientBackdrop>
        ))}
      </div>
    </div>
  );
}
