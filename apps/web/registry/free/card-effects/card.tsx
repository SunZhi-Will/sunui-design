"use client";

import { useDemoText } from "@/lib/demo-locale";

import { EffectCard, ExpandingPanels } from "./card-effects";
import { demoArt } from "./demo";

const copy = {
  en: ["Coastal", "Dunes", "Harbor", "Valley"],
  "zh-TW": ["海岸", "沙丘", "港口", "山谷"],
  "zh-CN": ["海岸", "沙丘", "港口", "山谷"],
  ja: ["海岸", "砂丘", "港", "谷"],
};

/** 型錄卡片：tilt-3d、glare、spotlight 三張卡，加一排 expanding-panels。 */
export default function CardEffectsCard() {
  const names = useDemoText(copy);
  return (
    <div className="mx-auto flex w-80 flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {(["tilt-3d", "glare", "spotlight"] as const).map((effect, i) => (
          <EffectCard key={effect} effect={effect} media={<img src={demoArt(i)} alt="" />} title={<span className="text-xs">{names[i]}</span>} />
        ))}
      </div>
      <ExpandingPanels
        className="h-24"
        items={names.map((n, i) => ({ id: n, title: n, media: <img src={demoArt(i + 2)} alt="" /> }))}
      />
    </div>
  );
}
