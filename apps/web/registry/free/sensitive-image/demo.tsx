"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { SensitiveImage } from "./sensitive-image";

// 示意的生成結果：色塊與簡單形狀，代替真實圖片
const src = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 640"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6c28b"/><stop offset="1" stop-color="#d9735b"/></linearGradient></defs><rect width="512" height="640" fill="url(#g)"/><circle cx="256" cy="230" r="70" fill="#7a4a3a"/><rect x="176" y="310" width="160" height="240" rx="70" fill="#8a5240"/></svg>',
)}`;

const prompts = {
  en: "Portrait in swimwear, beach, golden hour",
  "zh-TW": "泳裝人像，海灘，黃金時刻",
  "zh-CN": "泳装人像，海滩，黄金时刻",
  ja: "水着のポートレート、ビーチ、ゴールデンアワー",
};

export default function SensitiveImageDemo() {
  const locale = useDemoLocale();
  const prompt = useDemoText(prompts);
  return (
    <figure className="w-full max-w-xs min-w-0 rounded-xl border border-border bg-card p-3 text-card-foreground">
      <SensitiveImage
        src={src}
        alt={prompt}
        width={512}
        height={640}
        rating="sensitive"
        locale={locale}
        revealKey="g-102"
        className="aspect-[4/5] rounded-lg"
      />
      <figcaption className="mt-2 flex min-w-0 items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="truncate">{prompt}</span>
        <span className="shrink-0 tabular-nums">512 x 640</span>
      </figcaption>
    </figure>
  );
}
