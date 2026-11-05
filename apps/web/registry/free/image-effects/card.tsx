"use client";

import { useDemoText } from "@/lib/demo-locale";

import { ImageEffect } from "./image-effects";
import { demoArt } from "./demo";

const copy = {
  en: ["Teal lagoon", "Amber desert", "Blue fjord", "Green valley"],
  "zh-TW": ["青綠潟湖", "琥珀沙漠", "藍色峽灣", "翠綠山谷"],
  "zh-CN": ["青绿潟湖", "琥珀沙漠", "蓝色峡湾", "翠绿山谷"],
  ja: ["ティールの潟湖", "琥珀色の砂漠", "青いフィヨルド", "緑の谷"],
};

/** 型錄卡片：ken-burns、clip-reveal、saturate、zoom-lens 四格。 */
export default function ImageEffectsCard() {
  const alts = useDemoText(copy);
  return (
    <div className="mx-auto grid w-80 grid-cols-2 gap-2">
      <ImageEffect effect="ken-burns" src={demoArt(0)} alt={alts[0]} />
      <ImageEffect effect="clip-reveal" direction="circle" src={demoArt(1)} alt={alts[1]} />
      <ImageEffect effect="saturate" src={demoArt(2)} alt={alts[2]} />
      <ImageEffect effect="zoom-lens" lensSize={70} src={demoArt(3)} alt={alts[3]} />
    </div>
  );
}
