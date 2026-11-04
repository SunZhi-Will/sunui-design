"use client";

import { useState } from "react";

import { ContentGate } from "./content-gate";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const lessons = [
  { title: "What your price is really saying", length: "8:12" },
  { title: "Costing a product down to the cent", length: "11:40" },
  { title: "Three anchors that make a price feel fair", length: "14:05" },
  { title: "Bundles, tiers and the middle option", length: "12:31" },
  { title: "Running a discount without training buyers to wait", length: "16:48" },
  { title: "Raising prices on existing customers", length: "9:57" },
];

export default function ContentGateDemo() {
  const [bought, setBought] = useState(false);
  const [buying, setBuying] = useState(false);

  async function buy() {
    if (buying) return;
    setBuying(true);
    await wait(800);
    setBought(true);
    setBuying(false);
  }

  return (
    <div className="grid w-full max-w-[52rem] grid-cols-1 gap-6 md:grid-cols-[1.4fr_1fr]">
      <section aria-labelledby="course-heading" className="rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-5">
        <p className="text-xs text-muted-foreground">Course · 6 lessons · 1 h 13 min</p>
        <h2 id="course-heading" className="mt-1 text-lg font-semibold tracking-tight">
          Pricing your products
        </h2>
        <div className="mt-3">
          <ContentGate
            freeCount={2}
            unlocked={bought}
            price="$49"
            priceNote="one-time, lifetime access"
            primaryAction={{ label: buying ? "Processing" : "Buy the course", onClick: buy }}
            secondaryAction={{ label: "Contact the instructor", href: "#" }}
          >
            {lessons.map((l, i) => (
              <div key={l.title} className="flex items-center gap-3 border-b border-border py-3 text-sm last:border-b-0">
                <span className="w-5 shrink-0 text-muted-foreground tabular-nums">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{l.title}</span>
                {i < 2 && <span className="text-xs text-muted-foreground">Free</span>}
                <span className="shrink-0 text-muted-foreground tabular-nums">{l.length}</span>
              </div>
            ))}
          </ContentGate>
        </div>
      </section>

      <article aria-labelledby="guide-heading" className="rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-5">
        <p className="text-xs text-muted-foreground">Members guide</p>
        <h2 id="guide-heading" className="mt-1 text-lg font-semibold tracking-tight">
          Packaging that ships safely
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Most breakage happens in the last mile, not the warehouse. Here is how to pack for it.
        </p>
        <ContentGate
          className="mt-3"
          state="no-access"
          previewHeight={64}
          primaryAction={{ label: "Join membership", href: "#" }}
          labels={{ body: () => "Members get every guide and template. Your plan doesn't include guides yet." }}
        >
          <div className="space-y-3 text-sm">
            <p>Start with the box: double wall for anything over 2 kg, and leave 5 cm on every side for fill.</p>
            <p>Wrap the item, not the gaps. Paper fill moves; molded inserts and air pillows hold their place.</p>
            <p>Finish with the shake test. If you hear anything move, add fill until it stops.</p>
          </div>
        </ContentGate>
      </article>
    </div>
  );
}
