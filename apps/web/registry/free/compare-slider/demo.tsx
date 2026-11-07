"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CompareSlider } from "./compare-slider";

const copy = {
  en: { sketch: "Uploaded pencil sketch of a lighthouse", render: "Rendered painting of a lighthouse at dusk", before: "Original", after: "Result", caption: "Lighthouse at dusk" },
  "zh-TW": { sketch: "上傳的燈塔鉛筆草稿", render: "黃昏燈塔的上色成品", before: "原圖", after: "成品", caption: "黃昏的燈塔" },
  "zh-CN": { sketch: "上传的灯塔铅笔草稿", render: "黄昏灯塔的上色成品", before: "原图", after: "成品", caption: "黄昏的灯塔" },
  ja: { sketch: "アップロードされた灯台の鉛筆スケッチ", render: "夕暮れの灯台を彩色した完成画", before: "元画像", after: "完成", caption: "夕暮れの灯台" },
};

// 示範照片（AI 生成），放在 public/blocks/compare-slider
// 原圖：使用者上傳的方形鉛筆草稿（比例和成品不同，以 contain 置中）
function Sketch({ label }: { label: string }) {
  return (
    <img
      src="/blocks/compare-slider/lighthouse-sketch.webp"
      alt={label}
      draggable={false}
      className="size-full bg-[#efece6] object-contain select-none"
    />
  );
}

// 成品：16:9 的上色結果
function Render({ label }: { label: string }) {
  return (
    <img
      src="/blocks/compare-slider/lighthouse-render.webp"
      alt={label}
      draggable={false}
      className="size-full object-cover select-none"
    />
  );
}

export default function CompareSliderDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <figure className="w-full max-w-2xl min-w-0 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <CompareSlider
        before={<Sketch label={t.sketch} />}
        after={<Render label={t.render} />}
        width={16}
        height={9}
        beforeLabel={t.before}
        afterLabel={t.after}
        locale={locale}
        demoSweep
      />
      <figcaption className="mt-3 flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="truncate font-medium text-foreground">{t.caption}</span>
        <span className="tabular-nums">1920 x 1080</span>
      </figcaption>
    </figure>
  );
}
