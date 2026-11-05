"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { SidePanel } from "./side-panel";

const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const paperUnder = "bg-[#efefef] dark:bg-[#262626]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const sizes = ["S", "M", "L", "XL"];

const copy = {
  en: { filters: "Filters", linen: "Linen" },
  "zh-TW": { filters: "篩選", linen: "亞麻" },
  "zh-CN": { filters: "筛选", linen: "亚麻" },
  ja: { filters: "絞り込み", linen: "リネン" },
};

/** 型錄卡片：點 Filters，一張紙從左側滑進來，可勾尺寸、按 Esc 或遮罩關閉。 */
export default function SidePanelCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>(["M"]);
  const toggle = (v: string) => setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  return (
    <div className={cn("relative mx-auto h-[220px] w-72 overflow-hidden rounded-md border", paper, edge, ink)}>
      <header className={cn("flex items-center justify-between border-b px-3 py-2", edge)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md px-2 py-1 text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t.filters} <span className="tabular-nums opacity-60">({picked.length})</span>
        </button>
        <span className="text-sm font-semibold tracking-tight">{t.linen}</span>
      </header>
      <div className="grid grid-cols-2 gap-3 p-3">
        {[0, 1].map((i) => (
          <div key={i} aria-hidden="true" className={cn("aspect-[4/3] rounded-[3px]", paperUnder)} />
        ))}
      </div>

      <SidePanel open={open} onOpenChange={setOpen} side="left" size="sm" portal={false} locale={locale} title={t.filters}>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((s) => (
            <label
              key={s}
              className={cn(
                "cursor-pointer rounded-[3px] border px-2.5 py-1 text-sm tabular-nums has-[:checked]:border-[#171717] has-[:checked]:bg-[#171717] has-[:checked]:text-[#f7f7f7] dark:has-[:checked]:border-[#ededed] dark:has-[:checked]:bg-[#ededed] dark:has-[:checked]:text-[#1c1c1c] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                edge,
              )}
            >
              <input type="checkbox" checked={picked.includes(s)} onChange={() => toggle(s)} className="sr-only" />
              {s}
            </label>
          ))}
        </div>
      </SidePanel>
    </div>
  );
}
