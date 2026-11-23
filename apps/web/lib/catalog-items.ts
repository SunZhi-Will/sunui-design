import { existsSync } from "node:fs";
import path from "node:path";

import { orderCatalog } from "@/lib/catalog-order";
import type { Locale } from "@/lib/i18n";
import { usesSpot, type RegistryItem } from "@/lib/registry";
import { localizeItem } from "@/lib/registry-i18n";
import { variantIds } from "@/registry/__generated__/variants";

/**
 * 型錄卡片的資料（伺服器端）：/blocks 的完整型錄與首頁的精選共用。
 * 免費與 Pro 交叉排（每排中間一張 Pro），動效庫排最後；規則見 lib/catalog-order.ts。
 */
export function buildCatalogItems(all: RegistryItem[], locale: Locale) {
  // meta.catalog = "hidden"：型錄與首頁都不放，區塊頁與安裝網址照常（見 lib/registry.ts）
  return orderCatalog(all.filter((item) => item.meta.catalog !== "hidden")).flatMap((item) => {
    const { name, title, description, meta, categories } = localizeItem(item, locale);
    // 保留英文標題與描述給搜尋用
    const base = {
      name,
      title,
      description,
      meta,
      categories,
      search: `${item.title} ${item.description}`,
      en: { title: item.title, description: item.description },
      spot: usesSpot(item) || undefined,
      // 有分享圖的區塊，卡片在 iframe 載入前先顯示它，捲動時才不會一片空白
      // 深淺兩套截圖都要有才當底圖，不然淺色主題會出現破圖
      poster: (existsSync(path.join(process.cwd(), "public/og/blocks", `${item.name}.jpg`)) && existsSync(path.join(process.cwd(), "public/og/blocks-light", `${item.name}.jpg`))) || undefined,
    };
    // 效果庫一種樣式一張卡，避免好幾種效果擠在同一個預覽裡看不清楚；型錄預設會收合成一張
    const variants = variantIds[name];
    if (!variants) return [base];
    return variants.map((variant) => ({
      ...base,
      variant,
      title: `${title} · ${variant}`,
      libraryTitle: title,
      styleCount: variants.length,
      search: `${base.search} ${variant}`,
    }));
  });
}
