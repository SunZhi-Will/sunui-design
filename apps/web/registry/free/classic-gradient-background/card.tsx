"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { GradientBackground, gradientBackgroundPresets } from "./classic-gradient-background";

type PresetName = keyof typeof gradientBackgroundPresets;
const names = Object.keys(gradientBackgroundPresets) as PresetName[];

/** 型錄卡片：一塊呼吸光暈背景，點下方色票即時換成內建配色。 */
export default function ClassicGradientBackgroundCard() {
  const [preset, setPreset] = useState<PresetName>("blue");

  return (
    <div className="relative isolate mx-auto flex h-52 w-72 flex-col items-center justify-center overflow-hidden rounded-xl text-center text-white">
      {/* key 讓切換配色時動畫從頭開始 */}
      <GradientBackground key={preset} {...gradientBackgroundPresets[preset]} />
      <div className="relative">
        <p className="text-xl font-bold tracking-tight">Build interfaces that glow</p>
        <div className="mt-5 flex justify-center gap-1.5">
          {names.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={preset === name}
              onClick={() => setPreset(name)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs capitalize transition-colors",
                preset === name ? "border-white bg-white/20" : "border-white/20 hover:bg-white/10",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
