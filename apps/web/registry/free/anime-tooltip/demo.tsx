"use client";

import { useDemoText } from "@/lib/demo-locale";

import { AnimeTooltip } from "./anime-tooltip";

const copy = {
  en: { label: "Stamina", tip: "Refills one point every 6 minutes, up to 120." },
  "zh-TW": { label: "體力", tip: "每 6 分鐘回復 1 點，上限 120。" },
  "zh-CN": { label: "体力", tip: "每 6 分钟恢复 1 点，上限 120。" },
  ja: { label: "スタミナ", tip: "6 分ごとに 1 回復、最大 120。" },
};

export default function AnimeTooltipDemo() {
  const t = useDemoText(copy);
  return (
    <div className="flex w-full max-w-xs items-center justify-center px-2 pt-28 pb-16">
      <span className="text-[15px] font-bold">{t.label}</span>
      <span className="ml-2 tabular-nums text-muted-foreground">84 / 120</span>
      <AnimeTooltip content={t.tip} className="ml-2">
        <button type="button" aria-label={t.label} className="grid size-7 place-items-center rounded-full border-[2.5px] border-foreground text-sm font-extrabold outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--sunui-spot,var(--primary))]">
          ?
        </button>
      </AnimeTooltip>
    </div>
  );
}
