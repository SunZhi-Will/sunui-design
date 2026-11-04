"use client";

import { useState } from "react";

import { HonestCountdown } from "./honest-countdown";

const fmt = (ms: number) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(ms);

export default function HonestCountdownDemo() {
  // 場次時間來自後台；這裡在初始化時算一次
  const [s] = useState(() => {
    const now = Date.now();
    return {
      next: now + 2 * 86_400_000 + 5 * 3_600_000 + 17 * 60_000,
      live: now - 25 * 60_000,
      past: now - 9 * 86_400_000,
    };
  });

  return (
    <div className="w-full max-w-3xl min-w-0 overflow-hidden rounded-[16px] border border-white/10 bg-black text-white/90">
      <section className="grid justify-items-center gap-5 bg-[radial-gradient(70%_55%_at_50%_0%,color-mix(in_srgb,#F5C045_14%,transparent),transparent_70%),linear-gradient(180deg,#0e0e0e_0%,#000_100%)] px-5 pt-12 pb-10 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#F5C045]/45 px-3 py-1 text-[13px] font-extrabold text-[#F5C045]">
          Free live stream
        </p>
        <h2 className="max-w-[18em] text-[clamp(28px,4.6vw,44px)] leading-[1.2] font-black tracking-[-0.01em]">
          One hour: watch AI build a small tool
        </h2>
        <p className="max-w-[32em] text-[15px] leading-[1.8] text-white/60">
          A teacher builds a bill-splitting page live while you play along. Mostly demonstration; you will not necessarily finish your own tool that night.
        </p>
        <a href="#register" className="inline-flex h-12 items-center rounded-[10px] bg-[#F5C045] px-6 text-[15px] font-bold text-black">
          Save my seat
        </a>
        <HonestCountdown startAt={s.next} dateLabel={fmt(s.next)} />
      </section>

      <section aria-label="Other sessions" className="grid grid-cols-1 gap-3 border-t border-white/5 p-5 sm:grid-cols-2">
        <div className="grid min-w-0 gap-2 rounded-[12px] border border-white/5 bg-white/5 p-4">
          <p className="text-[13px] text-white/50">Office hours, session 4</p>
          <HonestCountdown startAt={s.live} dateLabel={fmt(s.live)} />
        </div>
        <div className="grid min-w-0 gap-2 rounded-[12px] border border-white/5 bg-white/5 p-4">
          <p className="text-[13px] text-white/50">Office hours, session 3</p>
          <HonestCountdown startAt={s.past} dateLabel={fmt(s.past)} />
        </div>
      </section>
    </div>
  );
}
