"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { PointCloud, type PointCloudShape } from "./point-cloud";

const copy = {
  en: {
    eyebrow: "Why shop with us",
    title: "Built around the parcel",
    features: [
      { shape: "sphere", name: "Ships to 64 countries", note: "Duties shown at checkout, no surprise fees." },
      { shape: "torus", name: "30-day loop returns", note: "Free pickup, refund the day it lands." },
      { shape: "cube", name: "Packed to order", note: "Every box cut to size from recycled board." },
      { shape: "helix", name: "Made in small runs", note: "Restocked weekly from three workshops." },
    ],
    label: "Dot cloud that changes shape with the highlighted feature",
    sale: "SALE",
    saleNote: "Weekend sale banner",
    wave: "Gift card landing",
  },
  "zh-TW": {
    eyebrow: "為什麼在這裡買",
    title: "一切圍繞著包裹",
    features: [
      { shape: "sphere", name: "寄送 64 個國家", note: "關稅在結帳時就列出，沒有額外費用。" },
      { shape: "torus", name: "30 天循環退貨", note: "免費到府取件，退件到倉當天退款。" },
      { shape: "cube", name: "接單才包裝", note: "每個紙箱都用回收紙板依尺寸裁切。" },
      { shape: "helix", name: "小批生產", note: "三間工坊每週補貨。" },
    ],
    label: "會隨著目前功能改變形狀的點雲",
    sale: "特賣",
    saleNote: "週末特賣橫幅",
    wave: "禮物卡頁面",
  },
  "zh-CN": {
    eyebrow: "为什么在这里买",
    title: "一切围绕着包裹",
    features: [
      { shape: "sphere", name: "寄送 64 个国家", note: "关税在结账时就列出，没有额外费用。" },
      { shape: "torus", name: "30 天循环退货", note: "免费上门取件，退件到仓当天退款。" },
      { shape: "cube", name: "接单才包装", note: "每个纸箱都用回收纸板按尺寸裁切。" },
      { shape: "helix", name: "小批量生产", note: "三家工坊每周补货。" },
    ],
    label: "会随着当前功能改变形状的点云",
    sale: "特卖",
    saleNote: "周末特卖横幅",
    wave: "礼品卡页面",
  },
  ja: {
    eyebrow: "選ばれる理由",
    title: "すべては小包のために",
    features: [
      { shape: "sphere", name: "64 か国へ発送", note: "関税はチェックアウト時に表示、追加料金なし。" },
      { shape: "torus", name: "30 日間の返品", note: "無料集荷、倉庫到着の当日に返金。" },
      { shape: "cube", name: "注文ごとに梱包", note: "箱は再生ボードからサイズに合わせて裁断。" },
      { shape: "helix", name: "少量生産", note: "3 つの工房から毎週入荷。" },
    ],
    label: "選んだ項目に合わせて形が変わる点群",
    sale: "セール",
    saleNote: "週末セールのバナー",
    wave: "ギフトカードのページ",
  },
};

/** 單一點雲形狀的示範格：首頁型錄（variants.tsx）用，形狀名稱沿用 demo 的文案 */
export function PointCloudTile({ shape }: { shape: PointCloudShape }) {
  const t = useDemoText(copy);
  const feature = t.features.find((f) => f.shape === shape);
  const caption = shape === "text" ? t.saleNote : shape === "wave" ? t.wave : feature?.name;
  const dark = shape === "text";
  return (
    <figure className={cn("overflow-hidden rounded-xl border border-border", dark && "bg-[#171717]")}>
      <PointCloud
        shape={shape}
        text={dark ? t.sale : undefined}
        count={1400}
        color={dark ? "#f5f5f5" : undefined}
        label={caption ?? t.label}
        className={cn("aspect-[4/3]", !dark && "text-foreground")}
      />
      <figcaption
        className={cn(
          "flex items-baseline justify-between gap-3 border-t px-4 py-2 text-sm",
          dark ? "border-white/10 text-neutral-300" : "border-border text-muted-foreground",
        )}
      >
        <span className="truncate">{caption}</span>
        <code className="font-mono text-xs opacity-70">{shape}</code>
      </figcaption>
    </figure>
  );
}

export default function PointCloudDemo() {
  const t = useDemoText(copy);
  const [active, setActive] = useState(0);
  const shape = t.features[active].shape as PointCloudShape;

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5 p-4">
      <section className="grid items-center gap-6 rounded-xl border border-border bg-card p-5 md:grid-cols-2 md:p-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{t.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{t.title}</h2>
          <ul className="mt-5 flex flex-col gap-1">
            {t.features.map((f, i) => (
              <li key={f.shape}>
                <button
                  type="button"
                  aria-pressed={i === active}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    i === active ? "border-border bg-background" : "border-transparent",
                  )}
                >
                  <span className="block text-sm font-medium">{f.name}</span>
                  <span className="block text-sm text-muted-foreground">{f.note}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <PointCloud shape={shape} label={t.label} count={1400} className="mx-auto max-w-[420px] text-foreground" />
      </section>
      <div className="grid gap-5 sm:grid-cols-2">
        <figure className="overflow-hidden rounded-xl border border-border bg-[#171717]">
          <PointCloud shape="text" text={t.sale} count={1800} pointSize={1.3} color="#f5f5f5" label={t.saleNote} className="aspect-[2/1]" />
          <figcaption className="border-t border-white/10 px-4 py-2 text-sm text-neutral-300">{t.saleNote}</figcaption>
        </figure>
        <figure className="overflow-hidden rounded-xl border border-border">
          <PointCloud shape="wave" count={1600} pointSize={1.4} label={t.wave} className="aspect-[2/1] text-foreground" />
          <figcaption className="border-t border-border px-4 py-2 text-sm text-muted-foreground">{t.wave}</figcaption>
        </figure>
      </div>
    </div>
  );
}
