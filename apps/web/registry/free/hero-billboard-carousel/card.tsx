"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { HeroBillboardCarousel, type HeroBillboardSlide } from "./hero-billboard-carousel";

type PosterKind = "kiln" | "type" | "run";

// 示意封面：和完整 demo 同樣的中性色塊海報，卡片只留三張
function PosterArt({ kind }: { kind: PosterKind }) {
  const ink = "#e5e5e5";
  return (
    <svg viewBox="0 0 160 90" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="160" height="90" fill={kind === "type" ? "#1a1a1a" : kind === "run" ? "#23211e" : "#262320"} />
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
    </svg>
  );
}

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
    cover: <PosterArt kind={b.kind} />,
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
