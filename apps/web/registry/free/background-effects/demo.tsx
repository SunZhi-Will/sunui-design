"use client";

import { useDemoText } from "@/lib/demo-locale";

import { backgroundEffects, EffectBackground, type BackgroundEffect } from "./background-effects";

type Names = Record<BackgroundEffect, string>;

export const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", { names: Names; pointer: string }> = {
  en: {
    pointer: "Move your pointer here",
    names: {
      aurora: "Aurora",
      "mesh-gradient": "Mesh gradient",
      "grid-pattern": "Grid pattern",
      "dot-glow": "Dot glow",
      "retro-grid": "Retro grid",
      beams: "Beams",
      meteors: "Meteors",
      particles: "Particles",
      starfield: "Starfield",
      waves: "Waves",
      "ripple-rings": "Ripple rings",
      "noise-grain": "Noise grain",
      spotlight: "Spotlight",
    },
  },
  "zh-TW": {
    pointer: "把游標移到這裡",
    names: {
      aurora: "極光",
      "mesh-gradient": "網格漸層",
      "grid-pattern": "格線亮格",
      "dot-glow": "點陣光波",
      "retro-grid": "復古網格地板",
      beams: "斜向光束",
      meteors: "流星雨",
      particles: "連線粒子",
      starfield: "星空穿梭",
      waves: "層疊波浪",
      "ripple-rings": "擴散漣漪",
      "noise-grain": "底片顆粒",
      spotlight: "跟隨聚光燈",
    },
  },
  "zh-CN": {
    pointer: "把光标移到这里",
    names: {
      aurora: "极光",
      "mesh-gradient": "网格渐变",
      "grid-pattern": "格线亮格",
      "dot-glow": "点阵光波",
      "retro-grid": "复古网格地板",
      beams: "斜向光束",
      meteors: "流星雨",
      particles: "连线粒子",
      starfield: "星空穿梭",
      waves: "层叠波浪",
      "ripple-rings": "扩散涟漪",
      "noise-grain": "胶片颗粒",
      spotlight: "跟随聚光灯",
    },
  },
  ja: {
    pointer: "ここにポインターを動かす",
    names: {
      aurora: "オーロラ",
      "mesh-gradient": "メッシュグラデーション",
      "grid-pattern": "グリッドパターン",
      "dot-glow": "ドットグロー",
      "retro-grid": "レトログリッド",
      beams: "ビーム",
      meteors: "流星",
      particles: "パーティクル",
      starfield: "スターフィールド",
      waves: "ウェーブ",
      "ripple-rings": "波紋リング",
      "noise-grain": "フィルムグレイン",
      spotlight: "スポットライト",
    },
  },
};

export const interactive: BackgroundEffect[] = ["particles", "spotlight"];

export default function BackgroundEffectsDemo() {
  const t = useDemoText(copy);
  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {backgroundEffects.map((effect) => (
        <div key={effect} className="relative h-44 overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
          <EffectBackground effect={effect}>
            <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
              <p className="text-base font-semibold tracking-tight">{t.names[effect]}</p>
              <code className="text-xs text-muted-foreground">{effect}</code>
              {interactive.includes(effect) && <p className="mt-1 text-xs text-muted-foreground">{t.pointer}</p>}
            </div>
          </EffectBackground>
        </div>
      ))}
    </div>
  );
}
