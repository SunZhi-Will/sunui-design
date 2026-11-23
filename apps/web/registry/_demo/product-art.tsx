// 只給 demo.tsx 用的示意商品圖：同一組灰底棚拍實物照，放在 public/demo/products/。
// 不會被安裝到使用者專案；block 本身一律透過 props 接收圖片。
// kind 的名稱沿用線稿時期（Pro demo 也在用），sneaker 現在是切爾西靴、headphones 是帆布後背包，商品名跟著照片。

import { useDemoLocale, type Locale } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

export type ProductKind = "sneaker" | "headphones" | "bottle" | "lamp" | "mug" | "jacket" | "tote" | "watch";

export const productNames: Record<ProductKind, string> = {
  sneaker: "Chelsea Boot",
  headphones: "Canvas Rucksack",
  bottle: "Steel Bottle 500 ml",
  lamp: "Desk Lamp",
  mug: "Stoneware Mug",
  jacket: "Waxed Field Jacket",
  tote: "Market Tote",
  watch: "Field Watch 38 mm",
};

export const productNamesByLocale: Record<Locale, Record<ProductKind, string>> = {
  en: productNames,
  "zh-TW": {
    sneaker: "切爾西靴",
    headphones: "帆布後背包",
    bottle: "不鏽鋼水壺 500 ml",
    lamp: "桌燈",
    mug: "石陶馬克杯",
    jacket: "蠟布獵裝外套",
    tote: "市場托特包",
    watch: "野戰錶 38 mm",
  },
  "zh-CN": {
    sneaker: "切尔西靴",
    headphones: "帆布双肩包",
    bottle: "不锈钢水壶 500 ml",
    lamp: "台灯",
    mug: "石陶马克杯",
    jacket: "蜡布猎装外套",
    tote: "市集托特包",
    watch: "野战表 38 mm",
  },
  ja: {
    sneaker: "チェルシーブーツ",
    headphones: "キャンバスリュック",
    bottle: "スチールボトル 500 ml",
    lamp: "デスクランプ",
    mug: "ストーンウェアマグ",
    jacket: "オイルドフィールドジャケット",
    tote: "マーケットトート",
    watch: "フィールドウォッチ 38 mm",
  },
};

/** demo 用：依網站目前語言取商品名。 */
export function useProductNames(): Record<ProductKind, string> {
  return productNamesByLocale[useDemoLocale()];
}

/** 照片路徑，demo 想直接用 <img> 時也可以拿 */
export const productPhoto = (kind: ProductKind) => `/demo/products/${kind}.webp`;

/**
 * 方形商品照。kind 決定是哪一件；tone="kraft" 是同一件的近拍（做 hover 第二張圖）。
 * 照片本身是淺灰棚拍底，深淺主題都直接用，外框的圓角與 hairline 由呼叫端決定。
 */
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
    <div className={cn("relative aspect-square w-full overflow-hidden bg-muted", className)}>
      <img
        src={productPhoto(kind)}
        alt={names[kind]}
        draggable={false}
        decoding="async"
        className={cn("absolute inset-0 size-full object-cover", tone === "kraft" && "scale-[1.6]")}
      />
    </div>
  );
}

export type LookKind = "boots-black" | "cardigan-navy" | "coat-camel" | "coat-navy" | "field-jacket" | "scarf-oat" | "trousers-grey" | "turtleneck";

/** 情境照（public/demo/looks/）：示範頁面裡原本用灰色方塊佔位的地方改放這個，比例由 className 決定。 */
export function LookArt({ look, className }: { look: LookKind; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative w-full overflow-hidden bg-muted", className)}>
      <img src={`/demo/looks/${look}.webp`} alt="" draggable={false} decoding="async" className="absolute inset-0 size-full object-cover" />
    </div>
  );
}
