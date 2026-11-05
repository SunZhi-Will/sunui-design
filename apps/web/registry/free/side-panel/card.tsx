"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { SidePanel } from "./side-panel";

const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const paperUnder = "bg-[#f1ebdd] dark:bg-[#29251f]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const sizes = ["S", "M", "L", "XL"];

/** 型錄卡片：點 Filters，一張紙從左側滑進來，可勾尺寸、按 Esc 或遮罩關閉。 */
export default function SidePanelCard() {
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
          Filters <span className="tabular-nums opacity-60">({picked.length})</span>
        </button>
        <span className="text-sm font-semibold tracking-tight">Linen</span>
      </header>
      <div className="grid grid-cols-2 gap-3 p-3">
        {[0, 1].map((i) => (
          <div key={i} aria-hidden="true" className={cn("aspect-[4/3] rounded-[3px]", paperUnder)} />
        ))}
      </div>

      <SidePanel open={open} onOpenChange={setOpen} side="left" size="sm" portal={false} title="Filters">
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((s) => (
            <label
              key={s}
              className={cn(
                "cursor-pointer rounded-[3px] border px-2.5 py-1 text-sm tabular-nums has-[:checked]:border-[#1c1917] has-[:checked]:bg-[#1c1917] has-[:checked]:text-[#faf7f0] dark:has-[:checked]:border-[#ece7dc] dark:has-[:checked]:bg-[#ece7dc] dark:has-[:checked]:text-[#1f1c18] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
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
