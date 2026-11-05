"use client";

import { chartEffects } from "./chart-effects";
import { DemoChart } from "./demo";

export const variants = chartEffects;

// 首頁預設只放這一種當代表，挑會自己動的，卡片不用先懸停才看得出效果
export const featured = "bar-race";

/** 首頁型錄：一種圖表效果一張卡，用 loop 在畫面內定期重播。 */
export default function ChartEffectsVariant({ variant }: { variant: string }) {
  return (
    <div className="w-72 text-card-foreground">
      <DemoChart variant={variant as (typeof chartEffects)[number]} trigger="loop" />
    </div>
  );
}
