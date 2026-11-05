"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { isLoopingTextEffect, TextEffect, textEffects, type TextEffectName } from "./text-effects";

export const copy = {
  en: {
    replay: "Replay",
    headline: "Make it move",
    lines: "Every line\nslides into place",
    scramble: "ACCESS GRANTED",
    flap: "GATE 12",
    prefix: "Ship",
    words: ["faster", "simpler", "together"],
    stack: "Bold ideas stack up",
    ring: "SUNUI MOTION LIBRARY",
    sale: "Summer sale",
  },
  "zh-TW": {
    replay: "重播",
    headline: "讓文字動起來",
    lines: "每一行字\n從線後滑上來",
    scramble: "存取已核准",
    flap: "登機門 12",
    prefix: "做得",
    words: ["更快", "更簡單", "更一致"],
    stack: "大膽 想法 層層 堆疊",
    ring: "SUNUI 動效庫",
    sale: "夏季特賣",
  },
  "zh-CN": {
    replay: "重播",
    headline: "让文字动起来",
    lines: "每一行字\n从线后滑上来",
    scramble: "访问已授权",
    flap: "登机口 12",
    prefix: "做得",
    words: ["更快", "更简单", "更一致"],
    stack: "大胆 想法 层层 堆叠",
    ring: "SUNUI 动效库",
    sale: "夏季特卖",
  },
  ja: {
    replay: "もう一度",
    headline: "文字を動かそう",
    lines: "一行ずつ\nラインの奥から",
    scramble: "アクセス許可",
    flap: "ゲート 12",
    prefix: "もっと",
    words: ["速く", "シンプルに", "一緒に"],
    stack: "大胆な 発想を 積み上げる",
    ring: "SUNUI モーション",
    sale: "サマーセール",
  },
};

type Copy = (typeof copy)["en"];

export function sampleFor(effect: TextEffectName, t: Copy) {
  switch (effect) {
    case "mask-reveal":
      return t.lines;
    case "scramble":
      return t.scramble;
    case "split-flap":
      return t.flap;
    case "word-rotate":
      return t.prefix;
    case "kinetic-stack":
      return t.stack;
    case "circle-text":
      return t.ring;
    case "highlighter":
    case "underline-draw":
    case "neon-flicker":
      return t.sale;
    default:
      return t.headline;
  }
}

function Tile({ effect, t }: { effect: TextEffectName; t: Copy }) {
  const [key, setKey] = useState(0);
  const looping = isLoopingTextEffect(effect);
  return (
    <div className="relative flex min-h-40 flex-col rounded-md border border-border bg-card p-4 text-card-foreground">
      {!looping && (
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="absolute right-2 top-2 inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M2.5 8a5.5 5.5 0 1 0 1.7-4M2.5 2.5V5h2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.replay}
        </button>
      )}
      <div className="grid flex-1 place-items-center overflow-hidden px-2 py-6 text-center">
        <TextEffect
          key={key}
          effect={effect}
          text={sampleFor(effect, t)}
          words={t.words}
          trigger={looping ? "mount" : "inView"}
          className={cn(
            "font-semibold tracking-tight",
            effect === "circle-text" ? "text-base" : effect === "kinetic-stack" ? "text-3xl uppercase" : "text-2xl sm:text-3xl",
          )}
        />
      </div>
      <p className="font-mono text-xs text-muted-foreground">{effect}</p>
    </div>
  );
}

export default function TextEffectsDemo() {
  const t = useDemoText(copy);
  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {textEffects.map((effect) => (
        <Tile key={effect} effect={effect} t={t} />
      ))}
    </div>
  );
}
