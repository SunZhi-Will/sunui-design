"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import {
  AnimatedBeam,
  BlobMorph,
  FlowingConnectors,
  Gooey,
  IconMorph,
  LineDraw,
  LiquidFill,
  MotionPath,
  OrbitingCircles,
  RadarSweep,
  svgEffects,
  type SvgEffectName,
} from "./svg-effects";
import { copy } from "./demo";

// iconMorphs 與 liquidShapes 是 icon-morph、liquid-fill 的子選項，demo 也放在同一格，所以不拆卡
export const variants = svgEffects;

// 首頁預設只放這一種當代表，挑會自己動的，卡片不用先懸停才看得出效果
export const featured = "animated-beam";

/**
 * 首頁型錄：一種 SVG 效果一張卡，內容與 demo 的同名格子一致。
 * 根元素若是 <svg>，FitStage 量不到它的寬度、只依高度放大，寬圖會超出卡片邊緣，所以一律包一層定寬的 div。
 */
export default function SvgEffectsVariant({ variant }: { variant: string }) {
  const t = useDemoText(copy);
  const [drawKey, setDrawKey] = useState(0);
  const [level, setLevel] = useState(62);

  switch (variant as SvgEffectName) {
    case "line-draw":
      return (
        <div className="flex w-56 flex-col items-center gap-3">
          <LineDraw key={drawKey} className="max-w-56 text-foreground" colors={["currentColor"]} />
          <button
            type="button"
            onClick={() => setDrawKey((k) => k + 1)}
            className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {t.replay}
          </button>
        </div>
      );
    case "blob-morph":
      return (
        <div className="w-40">
          <BlobMorph className="w-full" />
        </div>
      );
    case "gooey":
      return (
        <div className="w-40">
          <Gooey className="w-full" />
        </div>
      );
    case "orbiting-circles":
      return (
        <div className="w-48">
          <OrbitingCircles className="w-full" />
        </div>
      );
    case "motion-path":
      return (
        <div className="w-64">
          <MotionPath className="w-full" />
        </div>
      );
    case "icon-morph":
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <IconMorph icon="menu-close" labels={t.icons.menu} />
            <IconMorph icon="play-pause" labels={t.icons.play} />
            <IconMorph icon="plus-minus" labels={t.icons.plus} />
          </div>
          <p className="text-xs text-muted-foreground">{t.tap}</p>
        </div>
      );
    case "animated-beam":
      return (
        <div className="w-72">
          <AnimatedBeam className="w-full" />
        </div>
      );
    case "flowing-connectors":
      return (
        <div className="w-72">
          <FlowingConnectors className="w-full" />
        </div>
      );
    case "radar-sweep":
      return (
        <div className="w-48">
          <RadarSweep className="w-full" />
        </div>
      );
    case "liquid-fill":
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-end gap-3">
            <LiquidFill value={level} label={t.level} className="w-24" />
            <LiquidFill value={level} shape="drop" label={t.level} showValue={false} className="w-16" />
            <LiquidFill value={level} shape="heart" label={t.level} showValue={false} className="w-16" />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={level}
            aria-label={t.level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-40 accent-foreground"
          />
        </div>
      );
    default:
      return null;
  }
}
