"use client";

import { useDemoLocale, type Locale } from "@/lib/demo-locale";

import { HeroBillboardCarousel, type HeroBillboardSlide } from "./hero-billboard-carousel";

type PosterKind = "kiln" | "type" | "run" | "books";

// 示範照片（AI 生成），放在 public/blocks/hero-billboard-carousel，16:9，主體在右半邊，左下留給疊字
const poster = (kind: PosterKind) => `/blocks/hero-billboard-carousel/${kind}.webp`;

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
    image: poster(b.kind),
    imageAlt: "",
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
            <a href="#calendar" className="text-[14px] font-medium text-[#a3a3a3] no-underline underline-offset-4 hover:underline">
              {t.browse}
            </a>
          </>
        }
      />
    </div>
  );
}
