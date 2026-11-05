"use client";

import { useMemo } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { TiltedMarqueeBackground } from "./tilted-marquee-background";

// 字體名稱是產品名，各語言都用原文；分類跟著語言
const FACES: { name: string; family: string }[] = [
  { name: "Fieldnotes Serif", family: "Georgia, 'Times New Roman', serif" },
  { name: "Harbor Grotesk", family: "'Helvetica Neue', Arial, sans-serif" },
  { name: "Kiln Mono", family: "ui-monospace, 'SFMono-Regular', Menlo, monospace" },
  { name: "Paperlane Display", family: "Didot, 'Bodoni 72', Georgia, serif" },
  { name: "Riverside Slab", family: "Rockwell, 'Courier New', serif" },
  { name: "Ledger Italic", family: "Georgia, 'Times New Roman', serif" },
];

const copy = {
  en: {
    styles: ["Text", "Sans", "Monospace", "Display", "Slab", "Italic"],
    heading: "Every typeface, one studio license",
    body: "Use the whole library across print, web and apps, including every family we release next.",
    cta: "Get the studio license",
  },
  "zh-TW": {
    styles: ["內文", "無襯線", "等寬", "標題", "粗襯線", "義大利體"],
    heading: "所有字體，一張工作室授權",
    body: "整套字庫可用於印刷、網站與 App，之後發表的新字族也都包含在內。",
    cta: "取得工作室授權",
  },
  "zh-CN": {
    styles: ["正文", "无衬线", "等宽", "标题", "粗衬线", "意大利体"],
    heading: "所有字体，一份工作室授权",
    body: "整套字库可用于印刷、网站和 App，之后发布的新字族也都包含在内。",
    cta: "获取工作室授权",
  },
  ja: {
    styles: ["本文用", "サンセリフ", "等幅", "ディスプレイ", "スラブ", "イタリック"],
    heading: "すべての書体を、ひとつのスタジオライセンスで",
    body: "ライブラリ全体を印刷、Web、アプリで使えます。これから公開する書体ファミリーも含まれます。",
    cta: "スタジオライセンスを購入",
  },
};

// 沒有圖片時的封面磚：中性底，字體名稱用該字體的樣式寫出來，左上角一行分類
function cover(face: (typeof FACES)[number], style: string, italic: boolean) {
  return {
    key: face.name,
    content: (
      <div className="absolute inset-0 flex flex-col justify-between p-5">
        <div className="flex items-center justify-between text-[11px] font-medium tracking-[0.14em] text-[#a8a29e] uppercase">
          <span>{style}</span>
          <span className="tabular-nums">Aa 123</span>
        </div>
        <div className="text-[30px] leading-[1.05] text-[#e7e5e4]" style={{ fontFamily: face.family, fontStyle: italic ? "italic" : undefined }}>
          {face.name}
        </div>
      </div>
    ),
  };
}

export default function TiltedMarqueeBackgroundDemo() {
  const t = useDemoText(copy);
  const covers = useMemo(() => FACES.map((face, i) => cover(face, t.styles[i], i === 5)), [t]);
  return (
    <section className="relative flex min-h-[30rem] w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0c0a09] px-5 py-16">
      <TiltedMarqueeBackground covers={covers} opacity={0.7} />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]" style={{ background: "radial-gradient(ellipse 70% 56% at 50% 42%, rgba(12,10,9,0.88) 0%, transparent 72%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]" style={{ background: "linear-gradient(to bottom, #0c0a09, transparent 12%, transparent 88%, #0c0a09)" }} />
      <div className="relative z-10 mx-auto max-w-md min-w-0 text-center">
        <h1 className="mb-3 font-serif text-[30px] leading-tight font-normal tracking-[-0.01em] text-[#f5f5f4] sm:text-[34px]">
          {t.heading}
        </h1>
        <p className="mb-6 text-[15px] leading-relaxed text-[#a8a29e]">
          {t.body}
        </p>
        <a href="#license" className="inline-flex rounded-xl bg-[#d4a24c] px-6 py-3 text-sm font-semibold text-[#0c0a09] transition-opacity hover:opacity-90">
          {t.cta}
        </a>
      </div>
    </section>
  );
}
