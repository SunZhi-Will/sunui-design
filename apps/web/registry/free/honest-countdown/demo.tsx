"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { HonestCountdown } from "./honest-countdown";

const fmt = (ms: number, locale: string) =>
  new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(ms);

const copy = {
  en: {
    badge: "Free live stream",
    title: "One hour: watch AI build a small tool",
    body: "A teacher builds a bill-splitting page live while you play along. Mostly demonstration; you will not necessarily finish your own tool that night.",
    cta: "Save my seat",
  },
  "zh-TW": {
    badge: "免費直播",
    title: "一小時，看 AI 做出一個小工具",
    body: "老師現場做一個分帳網頁，你可以邊看邊跟著玩。以示範為主，當晚不一定能完成你自己的工具。",
    cta: "幫我保留座位",
  },
  "zh-CN": {
    badge: "免费直播",
    title: "一小时，看 AI 做出一个小工具",
    body: "老师现场做一个分账网页，你可以边看边跟着玩。以演示为主，当晚不一定能完成你自己的工具。",
    cta: "帮我预留座位",
  },
  ja: {
    badge: "無料ライブ配信",
    title: "1 時間で、AI が小さなツールを作るところを見る",
    body: "講師が割り勘ページをライブで作り、あなたも一緒に試せます。デモが中心なので、当日中に自分のツールが完成するとは限りません。",
    cta: "席を予約する",
  },
};

export default function HonestCountdownDemo() {
  // 場次時間來自後台；這裡在初始化時算一次
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [next] = useState(() => Date.now() + 2 * 86_400_000 + 5 * 3_600_000 + 17 * 60_000);

  return (
    <div className="w-full max-w-3xl min-w-0 overflow-hidden rounded-[16px] border border-white/10 bg-black text-white/90">
      <section className="grid justify-items-center gap-5 bg-[radial-gradient(70%_55%_at_50%_0%,color-mix(in_srgb,#F5C045_14%,transparent),transparent_70%),linear-gradient(180deg,#0e0e0e_0%,#000_100%)] px-5 pt-12 pb-10 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#F5C045]/45 px-3 py-1 text-[13px] font-extrabold text-[#F5C045]">
          {t.badge}
        </p>
        <h2 className="max-w-[18em] text-[clamp(28px,4.6vw,44px)] leading-[1.2] font-black tracking-[-0.01em]">
          {t.title}
        </h2>
        <p className="max-w-[32em] text-[15px] leading-[1.8] text-white/60">
          {t.body}
        </p>
        <a href="#register" className="inline-flex h-12 items-center rounded-[10px] bg-[#F5C045] px-6 text-[15px] font-bold text-black">
          {t.cta}
        </a>
        <HonestCountdown startAt={next} dateLabel={fmt(next, locale)} locale={locale} />
      </section>
    </div>
  );
}
