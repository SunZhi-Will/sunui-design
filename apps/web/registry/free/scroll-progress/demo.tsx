"use client";

import { useRef } from "react";

import { ScrollProgress } from "./scroll-progress";

const chapters = [
  { id: "sp-intro", label: "Intro", title: "Why reading progress matters" },
  { id: "sp-setup", label: "Setup", title: "Point it at any scroll container" },
  { id: "sp-markers", label: "Markers", title: "Section markers you can jump to" },
  { id: "sp-a11y", label: "Access", title: "Accessible by default" },
];

const filler =
  "Long-form pages lose readers when there is no sense of distance. A quiet bar at the top answers the question how much is left without stealing attention from the content itself. ";

export default function ScrollProgressDemo() {
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="border-b border-border px-5 pt-3 pb-5">
        <p className="mb-3 text-xs font-medium text-muted-foreground">Field notes, 6 min read</p>
        <ScrollProgress
          container={scroller}
          sections={chapters}
          position="static"
          thickness={4}
          showPercent
        />
      </div>
      <div ref={scroller} className="h-[380px] overflow-y-auto px-6 py-6">
        <div className="space-y-10">
          {chapters.map((c, i) => (
            <section key={c.id} id={c.id} className="scroll-mt-4">
              <h3 className="text-lg font-semibold">
                {i + 1}. {c.title}
              </h3>
              {Array.from({ length: 3 }, (_, p) => (
                <p key={p} className="mt-3 text-sm leading-7 text-muted-foreground">
                  {filler.repeat(2)}
                </p>
              ))}
            </section>
          ))}
          <p className="pb-4 text-center text-sm text-muted-foreground">End of article</p>
        </div>
      </div>
    </div>
  );
}
