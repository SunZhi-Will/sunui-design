"use client";

import { useState, type ReactNode } from "react";

import { StoryPlayer, type StorySlide } from "./story-player";

function Stat({ eyebrow, value, caption, children }: { eyebrow: string; value: ReactNode; caption: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-3 px-6 pb-8">
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{eyebrow}</p>
      <p className="text-5xl leading-none font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const week = [
  { day: "Mon", v: 42 },
  { day: "Tue", v: 38 },
  { day: "Wed", v: 51 },
  { day: "Thu", v: 47 },
  { day: "Fri", v: 88 },
  { day: "Sat", v: 64 },
  { day: "Sun", v: 30 },
];

const slides: StorySlide[] = [
  {
    id: "orders",
    content: <Stat eyebrow="Your 2026" value="1,284" caption="orders shipped from your shop this year, up 32% on 2025." />,
  },
  {
    id: "product",
    content: (
      <Stat eyebrow="Top product" value="412" caption="Stoneware Mug in Sand sold more than anything else.">
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-border p-3">
          <span aria-hidden="true" className="size-10 shrink-0 rounded-md bg-muted" />
          <span className="text-sm">
            <span className="block font-medium">Stoneware Mug</span>
            <span className="text-muted-foreground">Sand, 350 ml</span>
          </span>
        </div>
      </Stat>
    ),
  },
  {
    id: "day",
    content: (
      <Stat eyebrow="Busiest day" value="Friday" caption="Most orders landed on Fridays, peaking after 8 PM.">
        <div aria-hidden="true" className="mt-3 flex h-20 items-end gap-1.5">
          {week.map((d) => (
            <span key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <span className={d.day === "Fri" ? "w-full rounded-sm bg-primary" : "w-full rounded-sm bg-foreground/15"} style={{ height: `${d.v * 0.7}px` }} />
              <span className="text-[10px] text-muted-foreground">{d.day}</span>
            </span>
          ))}
        </div>
      </Stat>
    ),
  },
  {
    id: "repeat",
    duration: 7000,
    content: <Stat eyebrow="Came back" value="38%" caption="of customers ordered again within 90 days." />,
  },
  {
    id: "thanks",
    duration: 8000,
    content: (
      <Stat
        eyebrow="Thank you"
        value="2027"
        caption="Thanks for a great year. Your recap is saved in Reports, so you can share it any time."
      />
    ),
  },
];

export default function StoryPlayerDemo() {
  const [note, setNote] = useState("");

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <StoryPlayer
        slides={slides}
        labels={{ region: "Your 2026 shop recap", endTitle: "That's your 2026" }}
        endActions={[
          { label: "Save image", onClick: () => setNote("Recap image saved to Reports.") },
          { label: "Share", onClick: () => setNote("Share link copied.") },
        ]}
      />
      <p className="h-5 text-sm text-muted-foreground" aria-live="polite">
        {note}
      </p>
    </div>
  );
}
