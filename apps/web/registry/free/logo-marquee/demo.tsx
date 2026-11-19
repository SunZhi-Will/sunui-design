"use client";

import { useDemoText } from "@/lib/demo-locale";

import { LogoMarquee, type MarqueeItem } from "./logo-marquee";

/*
 * 虛構的中性字標，全部自己畫：不使用任何真實公司的標誌或名稱。
 * 一律單色 currentColor、線寬 1.5，顏色交給 LogoMarquee 控制。
 */
const icon = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const marks: MarqueeItem[] = [
  {
    id: "halvard",
    label: "Halvard",
    content: (
      <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <svg {...icon}>
          <path d="M5 4v16M19 4v16M5 12h14" />
        </svg>
        Halvard
      </span>
    ),
  },
  {
    id: "kestrel",
    label: "Kestrel Supply",
    content: (
      <span className="flex items-center gap-2 text-lg font-medium">
        <svg {...icon}>
          <path d="M3 14l9-8 9 8M7 18l5-4 5 4" />
        </svg>
        Kestrel Supply
      </span>
    ),
  },
  {
    id: "tessel",
    label: "Tessel",
    content: <span className="text-lg font-bold tracking-[0.24em] uppercase">Tessel</span>,
  },
  {
    id: "nordale",
    label: "Nordale",
    content: (
      <span className="flex items-center gap-2 font-serif text-xl italic">
        <svg {...icon}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v16" />
        </svg>
        Nordale
      </span>
    ),
  },
  {
    id: "ferro",
    label: "Ferro Studio",
    content: <span className="font-mono text-lg font-semibold">ferro/studio</span>,
  },
  {
    id: "linden",
    label: "Linden Row",
    content: (
      <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <svg {...icon}>
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="M9 8v8h6" />
        </svg>
        Linden Row
      </span>
    ),
  },
  {
    id: "quillmark",
    label: "Quillmark",
    content: (
      <span className="flex items-center gap-2 text-lg font-medium tracking-tight">
        <svg {...icon}>
          <path d="M5 19c6 0 12-6 14-14C11 7 5 13 5 19zM5 19l7-7" />
        </svg>
        Quillmark
      </span>
    ),
  },
  {
    id: "sable",
    label: "Sable & Ash",
    content: <span className="text-lg font-light tracking-[0.08em]">SABLE &amp; ASH</span>,
  },
];

const copy = {
  en: {
    heading: "Trusted by 2,400 independent shops and studios",
    body: "From two-person ceramics studios to regional grocers.",
    region: "Customers",
    pause: "Pause scrolling logos",
    play: "Play scrolling logos",
  },
  "zh-TW": {
    heading: "2,400 家獨立商店與工作室都在用",
    body: "從兩個人的陶藝工作室，到跨縣市的連鎖超市。",
    region: "客戶",
    pause: "暫停捲動的標誌",
    play: "繼續捲動標誌",
  },
  "zh-CN": {
    heading: "2,400 家独立商店与工作室都在用",
    body: "从两个人的陶艺工作室，到跨城市的连锁超市。",
    region: "客户",
    pause: "暂停滚动的标志",
    play: "继续滚动标志",
  },
  ja: {
    heading: "2,400 の個人店とスタジオが利用中",
    body: "二人で営む陶芸スタジオから、地域のスーパーまで。",
    region: "導入企業",
    pause: "ロゴのスクロールを一時停止",
    play: "ロゴのスクロールを再開",
  },
};

export default function LogoMarqueeDemo() {
  const t = useDemoText(copy);

  return (
    <section className="w-full max-w-4xl border-y border-foreground/10 bg-background px-4 py-12 text-foreground sm:px-8">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-lg font-semibold tracking-tight tabular-nums sm:text-xl">{t.heading}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{t.body}</p>
      </div>
      <LogoMarquee
        items={marks}
        rows={2}
        className="mt-10"
        labels={{ region: t.region, pause: t.pause, play: t.play }}
      />
    </section>
  );
}
