"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { HeroBillboardCarousel, type HeroBillboardSlide } from "./hero-billboard-carousel";

type PosterKind = "kiln" | "type" | "run";

// Demo photos (AI generated), stored in public/blocks/hero-billboard-carousel, 16:9, subject on the right half, lower left clear for overlaid text
const poster = (kind: PosterKind) => `/blocks/hero-billboard-carousel/${kind}.webp`;

type SlideText = Pick<HeroBillboardSlide, "title" | "badge" | "eyebrow" | "cta">;

const base: { key: string; kind: PosterKind }[] = [
  { key: "open-studio", kind: "kiln" },
  { key: "serif-release", kind: "type" },
  { key: "river-10k", kind: "run" },
];

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", { slides: SlideText[] }> = {
  en: {
    slides: [
      { title: "Open wheel night at Hollow Kiln", badge: "Open", eyebrow: "Open studio", cta: "Save a seat" },
      { title: "Fieldnotes Serif in six weights", eyebrow: "New release", cta: "See the specimen" },
      { title: "Riverside 10K autumn plan", eyebrow: "Training plan", cta: "Start the plan" },
    ],
  },
  "zh-TW": {
    slides: [
      { title: "空窯陶藝：拉坯開放夜", badge: "報名中", eyebrow: "開放工作室", cta: "預留座位" },
      { title: "Fieldnotes Serif 六種字重", eyebrow: "新字體發表", cta: "看字體樣張" },
      { title: "河濱 10K 秋季訓練", eyebrow: "訓練計畫", cta: "開始計畫" },
    ],
  },
  "zh-CN": {
    slides: [
      { title: "空窑陶艺：拉坯开放夜", badge: "报名中", eyebrow: "开放工作室", cta: "预留座位" },
      { title: "Fieldnotes Serif 六种字重", eyebrow: "新字体发布", cta: "查看字体样张" },
      { title: "河滨 10K 秋季训练", eyebrow: "训练计划", cta: "开始计划" },
    ],
  },
  ja: {
    slides: [
      { title: "ホロウキルン：ろくろ開放ナイト", badge: "受付中", eyebrow: "オープンスタジオ", cta: "席を予約" },
      { title: "Fieldnotes Serif 6ウェイト", eyebrow: "新書体リリース", cta: "見本帳を見る" },
      { title: "リバーサイド 10K 秋季プラン", eyebrow: "トレーニング", cta: "プランを始める" },
    ],
  },
};

/** Catalog card: a phone-width hero carousel that advances on its own; swipe or tap a side slide to switch, tap the center slide to open the event. */
export default function HeroBillboardCarouselCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const slides: HeroBillboardSlide[] = base.map((b, i) => ({
    key: b.key,
    ...t.slides[i],
    overlayTitle: false,
    image: poster(b.kind),
    imageAlt: "",
    href: `#${b.key}`,
  }));

  return (
    <div className="w-[320px] overflow-hidden rounded-2xl">
      <HeroBillboardCarousel
        items={slides}
        locale={locale}
        // The card drops the CTA button (the whole card is already clickable) and tightens the text area and vertical padding, so the hero image can be larger.
        // Component styles live in an unlayered <style>, which beats Tailwind's utilities layer, so the ! is needed here.
        className="[&_.hbc-inner]:py-4! [&_.hbc-inner]:[--panel-h:96px]! [&_.hbc-cta]:hidden!"
      />
    </div>
  );
}
