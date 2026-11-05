"use client";

import { useDemoText } from "@/lib/demo-locale";

import { EffectButton } from "./button-effects";

const copy = {
  en: { shine: "Upgrade", border: "New release", press: "Push", neon: "Go live" },
  "zh-TW": { shine: "升級方案", border: "新版上線", press: "按下去", neon: "開始直播" },
  "zh-CN": { shine: "升级方案", border: "新版上线", press: "按下去", neon: "开始直播" },
  ja: { shine: "アップグレード", border: "新リリース", press: "押す", neon: "配信開始" },
};

/** 型錄卡片：四種最醒目的按鈕效果 */
export default function ButtonEffectsCard() {
  const t = useDemoText(copy);
  return (
    <div className="mx-auto grid w-72 grid-cols-2 place-items-center gap-4 rounded-md border border-border bg-card p-5">
      <EffectButton effect="shine-sweep">{t.shine}</EffectButton>
      <EffectButton effect="rotating-border">{t.border}</EffectButton>
      <EffectButton effect="press-3d">{t.press}</EffectButton>
      <EffectButton effect="neon-glow">{t.neon}</EffectButton>
    </div>
  );
}
