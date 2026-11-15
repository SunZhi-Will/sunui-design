// 哪些收款方式現在可以用。SHOPLINE（新台幣）與 Polar（美金）各自要金鑰齊全，而且整體已開賣（SUNUI_SALES_OPEN）。
// 放在獨立檔案：lib/polar.ts 會用到 lib/site.ts，site.ts 不能反過來引用它。

import { polarConfigured } from "./polar";
import type { Provider } from "./orders";
import { salesOpen, shoplineConfigured } from "./site";

export type Currency = "twd" | "usd";

export function paymentOptions() {
  const open = salesOpen();
  return { twd: open && shoplineConfigured(), usd: open && polarConfigured() };
}

/** 至少一種收款方式可以結帳。 */
export function anyCheckoutReady() {
  const o = paymentOptions();
  return o.twd || o.usd;
}

export const providerFor = (currency: Currency): Provider => (currency === "usd" ? "polar" : "shopline");

/**
 * 結帳預設幣別：繁中介面用新台幣（台灣發卡最順），其他語系用美金；
 * 使用者指定的幣別（結帳頁的切換）優先，但要那一種真的可以用。
 */
export function defaultCurrency(locale: string, requested?: string | null): Currency | null {
  const o = paymentOptions();
  if (requested === "usd" && o.usd) return "usd";
  if (requested === "twd" && o.twd) return "twd";
  const preferred: Currency = locale === "zh-TW" ? "twd" : "usd";
  if (o[preferred]) return preferred;
  if (o.twd) return "twd";
  if (o.usd) return "usd";
  return null;
}
