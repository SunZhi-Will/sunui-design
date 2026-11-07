"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { HeroBillboardCarousel, type HeroBillboardSlide } from "./hero-billboard-carousel";

type PosterKind = "kiln" | "type" | "run";

// 示範照片（AI 生成），放在 public/blocks/hero-billboard-carousel，16:9，主體在右半邊，左下留給疊字
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

/** 型錄卡片：手機寬的主視覺輪播，自動換張，左右滑或點側邊那張切換，點中間那張進入活動。 */
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
        // 卡片裡拿掉 CTA 鈕（整張卡本來就能點）並壓低文字區與上下留白，讓主視覺放得大一點。
        // 元件樣式寫在未分層的 <style>，會蓋過 Tailwind 的 utilities 層，所以這裡要加 !
        className="[&_.hbc-inner]:py-4! [&_.hbc-inner]:[--panel-h:96px]! [&_.hbc-cta]:hidden!"
      />
    </div>
  );
}
