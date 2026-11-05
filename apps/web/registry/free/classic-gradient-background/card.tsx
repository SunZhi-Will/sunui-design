"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { GradientBackground, gradientBackgroundPresets } from "./classic-gradient-background";

type PresetName = keyof typeof gradientBackgroundPresets;
const names = Object.keys(gradientBackgroundPresets) as PresetName[];

const copy = {
  en: { title: "Build interfaces that glow", presets: { blue: "blue", ocean: "ocean", sunset: "sunset", forest: "forest", purple: "purple" } as Record<PresetName, string> },
  "zh-TW": { title: "打造會發光的介面", presets: { blue: "藍", ocean: "海洋", sunset: "夕陽", forest: "森林", purple: "紫" } },
  "zh-CN": { title: "打造会发光的界面", presets: { blue: "蓝", ocean: "海洋", sunset: "夕阳", forest: "森林", purple: "紫" } },
  ja: { title: "光をまとうインターフェースを", presets: { blue: "青", ocean: "海", sunset: "夕焼け", forest: "森", purple: "紫" } },
};

/** 型錄卡片：一塊呼吸光暈背景，點下方色票即時換成內建配色。 */
export default function ClassicGradientBackgroundCard() {
  const t = useDemoText(copy);
  const [preset, setPreset] = useState<PresetName>("blue");

  return (
    <div className="relative isolate mx-auto flex h-52 w-72 flex-col items-center justify-center overflow-hidden rounded-xl text-center text-white">
      {/* key 讓切換配色時動畫從頭開始 */}
      <GradientBackground key={preset} {...gradientBackgroundPresets[preset]} />
      <div className="relative">
        <p className="text-xl font-bold tracking-tight">{t.title}</p>
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
              {t.presets[name]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
