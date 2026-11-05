// 只給 demo.tsx 用的示意商品圖：紙面上的單色墨線插畫（DESIGN.md「紙感電商」）。
// 不會被安裝到使用者專案；block 本身一律透過 props 接收圖片。
import type { ReactNode } from "react";

import { useDemoLocale, type Locale } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

export type ProductKind = "sneaker" | "headphones" | "bottle" | "lamp" | "mug" | "jacket" | "tote" | "watch";

export const productNames: Record<ProductKind, string> = {
  sneaker: "Canvas Runner",
  headphones: "Studio Headphones",
  bottle: "Steel Bottle 750 ml",
  lamp: "Desk Lamp",
  mug: "Stoneware Mug",
  jacket: "Chore Jacket",
  tote: "Market Tote",
  watch: "Field Watch 38 mm",
};

export const productNamesByLocale: Record<Locale, Record<ProductKind, string>> = {
  en: productNames,
  "zh-TW": {
    sneaker: "帆布跑鞋",
    headphones: "錄音室耳機",
    bottle: "不鏽鋼水壺 750 ml",
    lamp: "桌燈",
    mug: "石陶馬克杯",
    jacket: "工作外套",
    tote: "市場托特包",
    watch: "野戰錶 38 mm",
  },
  "zh-CN": {
    sneaker: "帆布跑鞋",
    headphones: "录音室耳机",
    bottle: "不锈钢水壶 750 ml",
    lamp: "台灯",
    mug: "石陶马克杯",
    jacket: "工装外套",
    tote: "市集托特包",
    watch: "野战表 38 mm",
  },
  ja: {
    sneaker: "キャンバスランナー",
    headphones: "スタジオヘッドホン",
    bottle: "スチールボトル 750 ml",
    lamp: "デスクランプ",
    mug: "ストーンウェアマグ",
    jacket: "チョアジャケット",
    tote: "マーケットトート",
    watch: "フィールドウォッチ 38 mm",
  },
};

/** demo 用：依網站目前語言取商品名。 */
export function useProductNames(): Record<ProductKind, string> {
  return productNamesByLocale[useDemoLocale()];
}

const drawings: Record<ProductKind, ReactNode> = {
  sneaker: (
    <>
      <path d="M14 78c0-8 4-14 10-16l18-6 10-14c3-4 8-5 12-2l6 5c4 3 9 5 14 6l14 3c6 1 10 6 10 12v8c0 3-2 4-5 4H19c-3 0-5-1-5-4Z" />
      <path d="M14 76h92M46 56l6 6M54 50l6 6M62 44l6 6" />
      <path d="M22 84v4M98 84v4" />
    </>
  ),
  headphones: (
    <>
      <path d="M30 66V56a30 30 0 0 1 60 0v10" />
      <rect x="22" y="62" width="16" height="28" rx="6" />
      <rect x="82" y="62" width="16" height="28" rx="6" />
      <path d="M38 70h4M78 70h4" />
    </>
  ),
  bottle: (
    <>
      <rect x="50" y="18" width="20" height="10" rx="3" />
      <path d="M52 28v6c-6 3-10 8-10 14v46c0 5 4 8 8 8h20c4 0 8-3 8-8V48c0-6-4-11-10-14v-6" />
      <path d="M42 58h36M42 80h36" />
    </>
  ),
  lamp: (
    <>
      <path d="M40 98h40M60 98V70l-16-22" />
      <path d="M36 52 30 30l26-6 8 22Z" />
      <path d="M44 48c2 6 8 10 14 8" />
    </>
  ),
  mug: (
    <>
      <path d="M30 40h46v38c0 8-6 14-14 14H44c-8 0-14-6-14-14Z" />
      <path d="M76 50h6c6 0 10 4 10 10s-4 10-10 10h-6" />
      <path d="M44 24c-2 4 2 6 0 10M56 22c-2 4 2 6 0 10" />
    </>
  ),
  jacket: (
    <>
      <path d="M46 22h28l18 10 8 52H86V54l-4 44H38l-4-44v30H20l8-52Z" />
      <path d="M46 22l14 18 14-18M60 40v58M48 66h6M66 66h6" />
    </>
  ),
  tote: (
    <>
      <path d="M26 46h68l-6 52H32Z" />
      <path d="M44 46c0-14 6-22 16-22s16 8 16 22" />
      <path d="M40 64h40" />
    </>
  ),
  watch: (
    <>
      <path d="M48 20h24l2 18M48 20l-2 18M46 82l2 18h24l2-18" />
      <circle cx="60" cy="60" r="24" />
      <path d="M60 46v14l9 6M86 56v8" />
    </>
  ),
};

/** 紙面方形商品圖；kind 決定畫什麼，tone 換紙色深淺做 hover 第二張圖 */
export function ProductArt({
  kind,
  tone = "paper",
  className,
}: {
  kind: ProductKind;
  tone?: "paper" | "kraft";
  className?: string;
}) {
  const names = useProductNames();
  return (
    <div
      className={cn(
        "flex aspect-square w-full items-center justify-center text-[#171717] dark:text-[#ededed]",
        tone === "paper" ? "bg-[#f1f1f1] dark:bg-[#232323]" : "bg-[#e0e0e0] dark:bg-[#2b2b2b]",
        className,
      )}
    >
      <svg
        viewBox="0 0 120 120"
        className="h-3/5 w-3/5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label={names[kind]}
      >
        {drawings[kind]}
      </svg>
    </div>
  );
}
