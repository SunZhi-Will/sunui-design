"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

import { ScrollProgress } from "./scroll-progress";

const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/65 dark:text-[#ece7dc]/65";

const chapters = [
  {
    id: "care-wash",
    label: "Washing",
    title: "Washing",
    body: [
      "Machine wash at 30°C on a gentle cycle with similar colors. Linen softens with every wash, so there is no need for fabric softener; it coats the fibers and slows that process down.",
      "Use a mild liquid detergent without bleach or optical brighteners. Undyed and natural colors can yellow slightly if brighteners build up over time.",
      "Turn shirts inside out and fasten the buttons. It keeps the placket flat and stops buttons from catching on other pieces in the drum.",
    ],
  },
  {
    id: "care-dry",
    label: "Drying",
    title: "Drying",
    body: [
      "Line dry in the shade whenever you can. Give each piece a firm shake before hanging it; most of the creases fall out on their own as it dries.",
      "If you need the dryer, use low heat and take everything out while it is still slightly damp. Over-drying is what makes linen feel stiff and brittle.",
      "Expect up to 3% shrinkage after the first wash. Our sizes already allow for it.",
    ],
  },
  {
    id: "care-press",
    label: "Pressing",
    title: "Pressing",
    body: [
      "Linen is meant to look lived in, but if you prefer a crisp collar, iron on the linen setting while the fabric is damp.",
      "Press dark colors on the reverse side to avoid a shine on the surface. A pressing cloth works too.",
    ],
  },
  {
    id: "care-store",
    label: "Storing",
    title: "Storing",
    body: [
      "Store clean and completely dry, folded loosely or on wide wooden hangers. Avoid plastic covers; linen needs air to stay fresh between seasons.",
      "Refold along different lines now and then so the same crease does not set in.",
      "Keep linen away from direct sunlight in storage. Natural dyes and undyed fibers fade unevenly where light falls on a fold.",
    ],
  },
];

export default function ScrollProgressDemo() {
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <article className={cn("w-full max-w-2xl overflow-hidden rounded-md border", paper, edge, ink)}>
      <header className={cn("border-b px-6 pt-5 pb-3 sm:px-8", edge)}>
        <p className={cn("text-xs font-medium tracking-[0.14em] uppercase", inkMuted)}>Care guide</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">Looking after your linen</h2>
        <ScrollProgress container={scroller} sections={chapters} position="static" showPercent className="mt-5" />
      </header>
      <div ref={scroller} className="relative h-[380px] overflow-y-auto px-6 py-6 sm:px-8">
        <div className="space-y-10">
          {chapters.map((c, i) => (
            <section key={c.id} id={c.id} className="scroll-mt-6">
              <h3 className="flex items-baseline gap-3 text-base font-semibold">
                <span className={cn("font-mono text-xs tabular-nums", inkMuted)}>{String(i + 1).padStart(2, "0")}</span>
                {c.title}
              </h3>
              {c.body.map((p) => (
                <p key={p} className={cn("mt-3 max-w-prose text-sm leading-7", inkMuted)}>
                  {p}
                </p>
              ))}
            </section>
          ))}
          <p className={cn("pb-32 text-sm", inkMuted)}>Questions about a specific piece? Reply to your order email and we will help.</p>
        </div>
      </div>
    </article>
  );
}
