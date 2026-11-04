"use client";

import { useState } from "react";

import { HonestCountdown } from "./honest-countdown";

export default function HonestCountdownDemo() {
  // 結束時間在初始化時算一次
  const [dates] = useState(() => ({
    sale: Date.now() + 3 * 86_400_000 + 5 * 3_600_000,
    flash: Date.now() + 40 * 60_000,
    past: Date.now() - 2 * 86_400_000,
  }));

  return (
    <section aria-labelledby="countdown-heading" className="w-full max-w-[52rem] space-y-5">
      <div>
        <h2 id="countdown-heading" className="text-xl font-semibold tracking-tight">
          Winter sale
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Prices go back up when each offer ends. No extensions.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <HonestCountdown label="Sitewide 20% off" target={dates.sale} />
        <HonestCountdown label="Flash deal, wool coats" target={dates.flash} />
        <HonestCountdown label="Early bird bundle" target={dates.past} endedLabel="This offer has ended" />
      </div>
    </section>
  );
}
