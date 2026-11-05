"use client";

import { useDemoText } from "@/lib/demo-locale";

import { Animate, type AnimatePreset } from "./animate-presets";

const copy = {
  en: "Motion",
  "zh-TW": "動效",
  "zh-CN": "动效",
  ja: "モーション",
};

const picks: AnimatePreset[] = ["bounceIn", "flipInX", "clipRevealCircle", "tada"];

/** 型錄卡片：四個代表性的預設持續循環。 */
export default function AnimatePresetsCard() {
  const label = useDemoText(copy);
  return (
    <div className="mx-auto grid w-72 grid-cols-2 gap-2">
      {picks.map((p) => (
        <div key={p} className="flex flex-col items-center gap-2 rounded-md border border-border bg-card p-3">
          <div className="grid h-14 place-items-center">
            <Animate preset={p} trigger="loop" repeatDelay={0.8}>
              <span className="inline-block rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">{label}</span>
            </Animate>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">{p}</span>
        </div>
      ))}
    </div>
  );
}
