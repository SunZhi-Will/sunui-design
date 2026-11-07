"use client";

import { useRef, useState } from "react";

import { useDemoAutoplay } from "@/lib/demo-autoplay";
import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames } from "@/registry/_demo/product-art";

import { StarRating } from "./star-rating";

const breakdown = [
  { stars: 5, count: 812 },
  { stars: 4, count: 291 },
  { stars: 3, count: 104 },
  { stars: 2, count: 46 },
  { stars: 1, count: 31 },
];
const total = breakdown.reduce((sum, b) => sum + b.count, 0);
// StarRating 的 distribution 從 1 星排到 5 星
const distribution = [...breakdown].reverse().map((b) => b.count);

const copy = {
  en: {
    heading: "Reviews",
    reviews: (n: string) => `${n} reviews`,
    breakdown: "Rating breakdown",
    star: (n: number) => `${n} star`,
    prompt: "Bought this pair? Leave a rating",
    yours: "Your rating",
    reasons: { low: ["Runs small", "Sole quality", "Shipping was slow", "Colour differs from photo"], high: ["Comfortable", "True to size", "Colour matches photo", "Good value"] },
  },
  "zh-TW": {
    heading: "評價",
    reviews: (n: string) => `${n} 則評價`,
    breakdown: "評分分布",
    star: (n: number) => `${n} 星`,
    prompt: "買過這雙嗎？給個評分",
    yours: "你的評分",
    reasons: { low: ["尺寸偏小", "鞋底做工", "物流太慢", "顏色跟照片不同"], high: ["好穿", "尺寸剛好", "顏色跟照片一樣", "CP 值高"] },
  },
  "zh-CN": {
    heading: "评价",
    reviews: (n: string) => `${n} 条评价`,
    breakdown: "评分分布",
    star: (n: number) => `${n} 星`,
    prompt: "买过这双吗？打个分吧",
    yours: "你的评分",
    reasons: { low: ["尺码偏小", "鞋底做工", "物流太慢", "颜色和图片不一样"], high: ["穿着舒服", "尺码标准", "颜色和图片一致", "性价比高"] },
  },
  ja: {
    heading: "レビュー",
    reviews: (n: string) => `${n} 件のレビュー`,
    breakdown: "評価の内訳",
    star: (n: number) => `星 ${n}`,
    prompt: "購入済みですか？評価してください",
    yours: "あなたの評価",
    reasons: { low: ["サイズが小さめ", "ソールの作り", "配送が遅い", "写真と色が違う"], high: ["履き心地が良い", "サイズ感がぴったり", "写真どおりの色", "コスパが良い"] },
  },
};

export default function StarRatingDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const productNames = useProductNames();
  const [mine, setMine] = useState(0);
  const ref = useRef<HTMLElement>(null);

  // 預覽自己演：游標從 1 星慢慢滑到 5 星（標籤一路往上滾），停在 2 星點下去長出「哪裡不好」，
  // 再改點 5 星，理由組就地換成「喜歡哪裡」，點兩個理由
  const cursor = useDemoAutoplay(ref, async (d) => {
    // precision 0.5 時每顆星有兩個 radio，整顆星是第 2n 個
    const star = (n: number) => () => ref.current?.querySelectorAll<HTMLElement>("[role=radio]")[n * 2 - 1];
    const chip = (text: string) => () => d.find("button[aria-pressed]", text);
    for (const n of [1, 2, 3, 4, 5]) {
      await d.hover(star(n));
      await d.wait(350);
    }
    await d.hover(star(2));
    await d.wait(400);
    await d.click(star(2));
    await d.wait(1100);
    await d.click(chip(t.reasons.low[0]));
    await d.wait(900);
    await d.hover(star(5));
    await d.click(star(5));
    await d.unhover(star(5));
    await d.wait(1100);
    await d.click(chip(t.reasons.high[0]));
    await d.wait(500);
    await d.click(chip(t.reasons.high[3]));
  });

  return (
    <section ref={ref} aria-labelledby="reviews-heading" className="relative w-full max-w-2xl rounded-md border border-border bg-card p-4 text-card-foreground sm:p-6">
      <div className="flex items-center gap-3">
        <ProductArt kind="sneaker" className="size-12 shrink-0 rounded-md" />
        <div className="min-w-0">
          <h2 id="reviews-heading" className="font-semibold tracking-tight">
            {t.heading}
          </h2>
          <p className="truncate text-sm text-muted-foreground">{productNames.sneaker}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-6 sm:grid-cols-[11rem_1fr]">
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">4.4</p>
          <StarRating readOnly value={4.4} size="sm" locale={locale} className="mt-1.5" />
          <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">{t.reviews(total.toLocaleString(locale))}</p>
        </div>
        <ul className="space-y-1.5" aria-label={t.breakdown}>
          {breakdown.map((b) => (
            <li key={b.stars} className="flex items-center gap-3 text-sm tabular-nums">
              <span className="w-12 shrink-0 text-muted-foreground">{t.star(b.stars)}</span>
              <span aria-hidden="true" className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                <span className="absolute inset-y-0 left-0 bg-foreground/80" style={{ width: `${(b.count / total) * 100}%` }} />
              </span>
              <span className="w-9 shrink-0 text-right text-muted-foreground">{b.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-sm font-medium">{t.prompt}</p>
        <StarRating
          value={mine}
          onValueChange={setMine}
          precision={0.5}
          locale={locale}
          aria-label={t.yours}
          reasons={t.reasons}
          distribution={distribution}
          className="mt-2"
        />
      </div>
      {cursor}
    </section>
  );
}
