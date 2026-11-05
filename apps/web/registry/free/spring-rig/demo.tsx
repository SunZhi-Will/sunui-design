"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { SpringRig, springRigPresets, type SpringRigPreset } from "./spring-rig";

const copy = {
  en: {
    hint: "Point at a drawing, or tap it. Press and hold to squash, pull or open it.",
    autoplay: "Autoplay",
    names: { bag: "Shopping bag", tag: "Price tag", box: "Gift box", lamp: "Desk lamp", cards: "Card stack" },
  },
  "zh-TW": {
    hint: "把游標移到圖上，或用手指點一下。按住不放可以壓扁、拉下或打開。",
    autoplay: "自動播放",
    names: { bag: "購物袋", tag: "吊牌", box: "禮物盒", lamp: "檯燈", cards: "卡片堆" },
  },
  "zh-CN": {
    hint: "把光标移到图上，或用手指点一下。按住不放可以压扁、拉下或打开。",
    autoplay: "自动播放",
    names: { bag: "购物袋", tag: "吊牌", box: "礼物盒", lamp: "台灯", cards: "卡片堆" },
  },
  ja: {
    hint: "ポインターを絵に乗せるか、タップしてください。長押しでつぶす、引く、開くができます。",
    autoplay: "自動再生",
    names: { bag: "ショッピングバッグ", tag: "値札", box: "ギフトボックス", lamp: "デスクランプ", cards: "カードの束" },
  },
} satisfies Record<string, { names: Record<SpringRigPreset, string> } & Record<string, unknown>>;

export default function SpringRigDemo() {
  const t = useDemoText(copy);
  const [autoplay, setAutoplay] = useState(false);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-sm text-pretty text-muted-foreground">{t.hint}</p>
        <button
          type="button"
          role="switch"
          aria-checked={autoplay}
          onClick={() => setAutoplay((v) => !v)}
          className="flex items-center gap-2 rounded-full text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span
            className={cn(
              "relative h-5 w-9 rounded-full border transition-colors",
              autoplay ? "border-foreground bg-foreground" : "border-border bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-3.5 rounded-full transition-transform",
                autoplay ? "translate-x-4 bg-background" : "bg-muted-foreground",
              )}
            />
          </span>
          {t.autoplay}
        </button>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {springRigPresets.map((preset) => (
          <li
            key={preset}
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-3 pt-4 pb-3"
          >
            <SpringRig preset={preset} autoplay={autoplay} label={t.names[preset]} className="max-w-40" />
            <span className="text-xs text-muted-foreground">
              {t.names[preset]} <code className="font-mono opacity-70">{preset}</code>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
