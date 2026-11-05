"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { GradientBackground, gradientBackgroundPresets } from "./classic-gradient-background";

type PresetName = keyof typeof gradientBackgroundPresets;
const names = Object.keys(gradientBackgroundPresets) as PresetName[];

const copy = {
  en: { title: "A quiet backdrop", presets: { stone: "stone", vermilion: "vermilion", slate: "slate", forest: "forest", sand: "sand" } as Record<PresetName, string> },
  "zh-TW": { title: "安靜的底", presets: { stone: "石", vermilion: "朱", slate: "板岩", forest: "森林", sand: "沙" } },
  "zh-CN": { title: "安静的底", presets: { stone: "石", vermilion: "朱", slate: "板岩", forest: "森林", sand: "沙" } },
  ja: { title: "静かな背景", presets: { stone: "石", vermilion: "朱", slate: "スレート", forest: "森", sand: "砂" } },
};

/** 型錄卡片：細網格加一層淡色調，點下方色票即時換成內建色調。 */
export default function ClassicGradientBackgroundCard() {
  const t = useDemoText(copy);
  const [preset, setPreset] = useState<PresetName>("stone");

  return (
    <div className="relative isolate mx-auto flex h-52 w-72 flex-col items-center justify-center overflow-hidden rounded-xl border border-border text-center text-foreground">
      <GradientBackground {...gradientBackgroundPresets[preset]} />
      <div className="relative">
        <p className="text-xl font-semibold tracking-tight">{t.title}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-1.5 px-3">
          {names.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={preset === name}
              onClick={() => setPreset(name)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs capitalize transition-colors",
                preset === name
                  ? "border-foreground/30 bg-card text-foreground shadow-sm"
                  : "border-border bg-card/60 text-muted-foreground hover:text-foreground",
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
