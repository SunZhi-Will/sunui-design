"use client";

import { useDemoLocale, type Locale } from "@/lib/demo-locale";

import { HeroBillboardCarousel, type HeroBillboardSlide } from "./hero-billboard-carousel";

// 示意封面：中性色塊與線條組成的海報，代替真實主視覺；每張一種構圖
type PosterKind = "kiln" | "type" | "run" | "books";

function PosterArt({ kind }: { kind: PosterKind }) {
  const ink = "#e7e5e4";
  return (
    <svg viewBox="0 0 160 90" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="160" height="90" fill={kind === "type" ? "#1c1a17" : kind === "run" ? "#23211e" : kind === "books" ? "#201d1a" : "#262320"} />
      {kind === "kiln" && (
        <g fill="none" stroke={ink} strokeWidth="0.6" opacity="0.55">
          <path d="M104 18 C96 30 92 44 98 60 C102 70 126 70 130 60 C136 44 132 30 124 18 Z" />
          <path d="M108 18 H120" />
          <ellipse cx="114" cy="70" rx="26" ry="3" opacity="0.5" />
          <path d="M60 64 C58 54 62 46 70 44 C78 46 82 54 80 64 Z" />
        </g>
      )}
      {kind === "type" && (
        <text x="92" y="66" fontFamily="Georgia, 'Times New Roman', serif" fontSize="58" fill={ink} opacity="0.55">
          Aa
        </text>
      )}
      {kind === "run" && (
        <g stroke={ink} strokeWidth="0.5" opacity="0.4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M0 ${30 + i * 8} C50 ${20 + i * 8} 110 ${44 + i * 8} 160 ${28 + i * 8}`} fill="none" />
          ))}
        </g>
      )}
      {kind === "books" && (
        <g fill={ink}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x={96 + i * 7} y={22 + (i % 3) * 4} width="5" height={48 - (i % 3) * 4} opacity={0.18 + (i % 4) * 0.08} />
          ))}
          <rect x="90" y="70" width="60" height="0.6" opacity="0.5" />
        </g>
      )}
    </svg>
  );
}

type SlideText = Pick<HeroBillboardSlide, "title" | "subtitle" | "badge" | "eyebrow" | "meta" | "price" | "cta">;

const base: { key: string; kind: PosterKind }[] = [
  { key: "open-studio", kind: "kiln" },
  { key: "serif-release", kind: "type" },
  { key: "river-10k", kind: "run" },
  { key: "reading-night", kind: "books" },
];

const copy: Record<Locale, { heading: string; browse: string; slides: SlideText[] }> = {
  en: {
    heading: "Coming up this month",
    browse: "See the full calendar →",
    slides: [
      { title: "Open wheel night at Hollow Kiln Studio", subtitle: "Open studio", badge: "Open", eyebrow: "Open studio", meta: "Sat, Nov 14, 6:00 to 9:00 PM", price: "Free", cta: "Save a seat" },
      { title: "Fieldnotes Serif: a text face in six weights", subtitle: "New release", eyebrow: "New release", meta: "6 weights, variable font", price: "$120", cta: "See the specimen" },
      { title: "Riverside 10K: an eight week autumn plan", subtitle: "Training plan", eyebrow: "Training plan", meta: "8 weeks, 4 runs a week", price: "Free", cta: "Start the plan" },
      { title: "Late reading night at Paperlane Books", subtitle: "Author talk", eyebrow: "Author talk", meta: "Thu, Nov 19, 7:30 PM", price: "$12", cta: "Get tickets" },
    ],
  },
  "zh-TW": {
    heading: "這個月的活動",
    browse: "查看完整行事曆 →",
    slides: [
      { title: "空窯陶藝工作室：拉坯開放夜", subtitle: "開放工作室", badge: "報名中", eyebrow: "開放工作室", meta: "11 月 14 日（六）晚上 6:00 至 9:00", price: "免費", cta: "預留座位" },
      { title: "Fieldnotes Serif：六種字重的內文字體", subtitle: "新字體發表", eyebrow: "新字體發表", meta: "6 種字重，可變字體", price: "$120", cta: "看字體樣張" },
      { title: "河濱 10K：八週秋季訓練計畫", subtitle: "訓練計畫", eyebrow: "訓練計畫", meta: "8 週，每週 4 次", price: "免費", cta: "開始計畫" },
      { title: "紙巷書店的深夜朗讀會", subtitle: "作者座談", eyebrow: "作者座談", meta: "11 月 19 日（四）晚上 7:30", price: "$12", cta: "購票" },
    ],
  },
  "zh-CN": {
    heading: "本月活动",
    browse: "查看完整日程 →",
    slides: [
      { title: "空窑陶艺工作室：拉坯开放夜", subtitle: "开放工作室", badge: "报名中", eyebrow: "开放工作室", meta: "11 月 14 日（周六）晚上 6:00 至 9:00", price: "免费", cta: "预留座位" },
      { title: "Fieldnotes Serif：六种字重的正文字体", subtitle: "新字体发布", eyebrow: "新字体发布", meta: "6 种字重，可变字体", price: "$120", cta: "查看字体样张" },
      { title: "河滨 10K：八周秋季训练计划", subtitle: "训练计划", eyebrow: "训练计划", meta: "8 周，每周 4 次", price: "免费", cta: "开始计划" },
      { title: "纸巷书店的深夜朗读会", subtitle: "作者分享", eyebrow: "作者分享", meta: "11 月 19 日（周四）晚上 7:30", price: "$12", cta: "购票" },
    ],
  },
  ja: {
    heading: "今月のイベント",
    browse: "カレンダーをすべて見る →",
    slides: [
      { title: "ホロウキルン陶芸工房：ろくろ開放ナイト", subtitle: "オープンスタジオ", badge: "受付中", eyebrow: "オープンスタジオ", meta: "11月14日（土）18:00〜21:00", price: "無料", cta: "席を予約" },
      { title: "Fieldnotes Serif：6ウェイトの本文用書体", subtitle: "新書体リリース", eyebrow: "新書体リリース", meta: "6ウェイト、バリアブル", price: "$120", cta: "見本帳を見る" },
      { title: "リバーサイド 10K：8週間の秋季プラン", subtitle: "トレーニング", eyebrow: "トレーニング", meta: "8週間、週4回", price: "無料", cta: "プランを始める" },
      { title: "ペーパーレーン書店の夜の朗読会", subtitle: "著者トーク", eyebrow: "著者トーク", meta: "11月19日（木）19:30", price: "$12", cta: "チケットを買う" },
    ],
  },
};

export default function HeroBillboardCarouselDemo() {
  const locale = useDemoLocale();
  const t = copy[locale] ?? copy.en;
  const slides: HeroBillboardSlide[] = base.map((b, i) => ({
    key: b.key,
    ...t.slides[i],
    overlayTitle: true,
    cover: <PosterArt kind={b.kind} />,
    href: `#${b.key}`,
  }));
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl">
      <HeroBillboardCarousel
        items={slides}
        locale={locale}
        intro={
          <>
            <h1 className="font-serif text-xl font-normal tracking-[-0.01em] md:text-2xl">{t.heading}</h1>
            <a href="#calendar" className="text-[14px] font-medium text-[#a8a29e] no-underline underline-offset-4 hover:underline">
              {t.browse}
            </a>
          </>
        }
      />
    </div>
  );
}
