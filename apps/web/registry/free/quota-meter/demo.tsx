"use client";

import { useState } from "react";

import { QuotaMeter } from "./quota-meter";

export default function QuotaMeterDemo() {
  // 重置日在初始化時算一次
  const [resetsAt] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 1);
  });

  return (
    <section aria-labelledby="studio-heading" className="w-full max-w-2xl space-y-5">
      <header className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-2.5 text-card-foreground">
        <span className="text-sm font-semibold tracking-tight">Product Photo Studio</span>
        <QuotaMeter used={316} total={500} perUnit={2} unitLabel="photos" variant="compact" />
      </header>

      <div>
        <h2 id="studio-heading" className="text-xl font-semibold tracking-tight">
          Your plan
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Background removal costs 2 credits, lifestyle scenes cost 4.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <QuotaMeter labels={{ title: "Background removal" }} used={158} total={500} perUnit={2} unitLabel="photos" resetsAt={resetsAt} />
        <QuotaMeter
          labels={{ title: "Lifestyle scenes" }}
          used={472}
          total={500}
          perUnit={4}
          unitLabel="scenes"
          resetsAt={resetsAt}
          nudge={{ label: "Check in today for 5 more scenes", href: "#rewards" }}
        />
      </div>
    </section>
  );
}
