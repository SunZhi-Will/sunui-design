"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

import { ScrollProgress } from "./scroll-progress";

const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/65 dark:text-[#ece7dc]/65";

const chapters = [
  { id: "card-care-wash", label: "Wash", body: "Machine wash at 30°C on a gentle cycle. Linen softens with every wash, so skip the fabric softener. Turn shirts inside out and fasten the buttons." },
  { id: "card-care-dry", label: "Dry", body: "Line dry in the shade. Give each piece a firm shake before hanging; most creases fall out on their own. Expect up to 3% shrinkage after the first wash." },
  { id: "card-care-store", label: "Store", body: "Store clean and completely dry, folded loosely. Avoid plastic covers; linen needs air to stay fresh between seasons." },
];

/** 型錄卡片：框內捲動一篇短文，上方墨線跟著前進，點刻度跳到該章。 */
export default function ScrollProgressCard() {
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <article className={cn("mx-auto w-72 overflow-hidden rounded-md border", paper, edge, ink)}>
      <header className={cn("border-b px-4 pt-6 pb-2", edge)}>
        <ScrollProgress container={scroller} sections={chapters} position="static" showPercent />
      </header>
      <div ref={scroller} className="relative h-[160px] overflow-y-auto px-4 py-4">
        <div className="space-y-6">
          {chapters.map((c, i) => (
            <section key={c.id} id={c.id} className="scroll-mt-4">
              <h3 className="flex items-baseline gap-2 text-sm font-semibold">
                <span className={cn("font-mono text-xs tabular-nums", inkMuted)}>{String(i + 1).padStart(2, "0")}</span>
                {c.label}
              </h3>
              <p className={cn("mt-2 text-sm leading-6", inkMuted)}>{c.body}</p>
            </section>
          ))}
          <div className="h-24" />
        </div>
      </div>
    </article>
  );
}
