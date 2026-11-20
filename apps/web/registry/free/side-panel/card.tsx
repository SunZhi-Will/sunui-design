"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { SidePanel } from "./side-panel";

const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
const surfaceUnder = "bg-muted dark:bg-foreground/10";
const edge = "border-foreground/10";
const ink = "text-foreground";
const sizes = ["S", "M", "L", "XL"];

const copy = {
  en: { filters: "Filters", linen: "Linen" },
  "zh-TW": { filters: "篩選", linen: "亞麻" },
  "zh-CN": { filters: "筛选", linen: "亚麻" },
  ja: { filters: "絞り込み", linen: "リネン" },
};

/** Catalog card: click Filters, a sheet slides in from the left; tick sizes, close with Esc or the overlay. */
export default function SidePanelCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>(["M"]);
  const toggle = (v: string) => setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  return (
    <div className={cn("relative mx-auto h-[220px] w-72 overflow-hidden rounded-xl border", surface, edge, ink)}>
      <header className={cn("flex items-center justify-between border-b px-3 py-2", edge)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md px-2 py-1 text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]"
        >
          {t.filters} <span className="tabular-nums opacity-60">({picked.length})</span>
        </button>
        <span className="text-sm font-semibold tracking-tight">{t.linen}</span>
      </header>
      <div className="grid grid-cols-2 gap-3 p-3">
        {[0, 1].map((i) => (
          <div key={i} aria-hidden="true" className={cn("aspect-[4/3] rounded-[3px]", surfaceUnder)} />
        ))}
      </div>

      <SidePanel open={open} onOpenChange={setOpen} side="left" size="sm" portal={false} locale={locale} title={t.filters}>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((s) => (
            <label
              key={s}
              className={cn(
                "cursor-pointer rounded-[3px] border px-2.5 py-1 text-sm tabular-nums has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
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
