"use client";

import { useState } from "react";

import { HonestCountdown } from "./honest-countdown";

const fmt = (ms: number) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(ms);

/** 型錄卡片：一個直播開場倒數，照真實場次時間走，不會重新整理就重來。 */
export default function HonestCountdownCard() {
  // 場次時間在初始化時算一次
  const [next] = useState(() => Date.now() + 2 * 86_400_000 + 5 * 3_600_000 + 17 * 60_000);

  return (
    <div className="mx-auto grid w-72 justify-items-center gap-4 rounded-[16px] border border-white/10 bg-black px-4 py-6 text-center text-white/90">
      <p className="inline-flex items-center rounded-full border border-[#F5C045]/45 px-3 py-1 text-[13px] font-extrabold text-[#F5C045]">
        Free live stream
      </p>
      <HonestCountdown startAt={next} dateLabel={fmt(next)} />
    </div>
  );
}
