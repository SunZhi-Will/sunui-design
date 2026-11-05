"use client";

import { useDemoText } from "@/lib/demo-locale";

import { TextEffect } from "./text-effects";

const copy = {
  en: { a: "Make it move", b: "Summer sale", c: "Ship", words: ["faster", "simpler", "together"] },
  "zh-TW": { a: "讓文字動起來", b: "夏季特賣", c: "做得", words: ["更快", "更簡單", "更一致"] },
  "zh-CN": { a: "让文字动起来", b: "夏季特卖", c: "做得", words: ["更快", "更简单", "更一致"] },
  ja: { a: "文字を動かそう", b: "サマーセール", c: "もっと", words: ["速く", "シンプルに", "一緒に"] },
};

/** 型錄卡片：四個最搶眼的文字效果疊在一起。 */
export default function TextEffectsCard() {
  const t = useDemoText(copy);
  return (
    <div className="mx-auto flex w-64 flex-col items-center gap-3 rounded-md border border-border bg-card p-5 text-center text-card-foreground">
      <TextEffect effect="gradient-flow" text={t.a} className="text-2xl font-bold tracking-tight" />
      <TextEffect effect="wave" text={t.a} className="text-lg font-semibold" />
      <TextEffect effect="highlighter" text={t.b} trigger="loop" className="text-lg font-semibold" />
      <TextEffect effect="word-rotate" text={t.c} words={t.words} className="text-base font-medium" />
    </div>
  );
}
