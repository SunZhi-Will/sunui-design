import type { RegistryItem } from "@/lib/registry";
import { seriesOf } from "@/lib/series";

/**
 * 首頁「全部」型錄的排序。分析見 reports/型錄排序與免費付費價值分析-2026-11-07.md。
 *
 * 規則：
 * 1. 每 3 張放 1 張 Pro，放在每排中間（第 2、5、8 張），桌機每排一個鎖頭，手機每 3 張一個。
 * 2. Pro 依分級排：A 整頁場景、B 獨特招牌在前，C 有免費近親、D 通用元件在後。
 * 3. 免費依精選順序排，其餘依系列與上架日期；動效庫排在免費卡最後。
 * 4. C 組 Pro 不放在它的免費近親附近（前後各 3 張內），避免兩張卡被拿來直接比較。
 *
 * Pro 名稱在型錄上本來就公開，所以分級放在這裡；公開 repo 沒有 Pro 清單時，這份名單只是被略過。
 */

/** A：整頁與檔期場景，B：免費沒有對應的招牌互動 */
const proLead = [
  // A
  "campaign-landing",
  "day-night-hero",
  "black-friday-weekend",
  "checkout-flow",
  "lunar-new-year",
  "self-building-page",
  "curve-rail-hero",
  "glass-cube-hero",
  "festival-banner",
  // B
  "physics-cart-jar",
  "hoop-upload",
  "vote-terrain",
  "redline-reveal",
  "cutaway-spec",
  "card-dock",
  "ask-to-shop",
  "lineup-shelf",
  "sticker-board",
  "count-chart",
  "pixel-check-in",
  "pixel-gacha",
  "pixel-boss-sale",
  "pixel-preregister",
  "pixel-level-track",
  "peel-sticker-coupon",
  "order-island",
  "receipt-printer",
  "bundle-node-builder",
  "gift-box-reveal",
  "scratch-card",
  "checkout-button",
  "fold-invite-card",
  "prize-wheel",
  "gift-card-designer",
  "coupon-claim-card",
  "price-history",
  "stamp-card",
  "recipe-glass",
];

/** C：免費層有近親的 Pro，值是它的免費近親；D：通用元件 */
const proSiblings: Record<string, string[]> = {
  "cart-drawer": ["side-panel", "quantity-stepper", "addon-checklist"],
  "launch-stage-hero": ["depth-hero", "text-effects"],
  "store-help-widget": ["morph-menu"],
  "product-gallery": ["lightbox", "product-media"],
  "upsell-drawer": ["side-panel", "addon-checklist"],
  "flash-sale-hero": ["countdown-banner"],
  "loop-shader-hero": ["gradient-backdrop", "background-effects"],
  "testimonial-wall": ["testimonial-marquee"],
  "order-tracker": ["order-history", "checkout-steps"],
  "launch-countdown-wall": ["countdown-banner"],
  "showcase-mosaic": ["infinite-canvas"],
  "product-filter-grid": ["sliding-tabs", "range-slider"],
  "drop-release-hero": ["depth-hero", "text-effects"],
  "shader-campaign-banner": ["gradient-backdrop", "background-effects"],
  "free-shipping-progress": ["tier-progress"],
  "upgrade-modal": ["dialog-sheet"],
};

const proTail = [
  "flash-sale-product-card",
  "pricing-cards",
  "plan-comparison",
  "faq-accordion",
  "newsletter-signup",
  "file-dropzone",
];

const proOrder = [...proLead, ...Object.keys(proSiblings), ...proTail];

/** 免費精選：紙感電商的招牌在前，穿插最有記憶點的 story 與 showcase */
const freeLead = [
  "coupon-wallet",
  "add-to-cart-button",
  "book-3d",
  "copy-code-button",
  "cloth-curtain",
  "hero-billboard-carousel",
  "addon-checklist",
  "animated-number",
  "shipping-options",
  "spine-shelf",
  "toast-stack",
  "hotspots",
  "morph-menu",
  "terms-consent",
  "tier-progress",
  "pixel-fx",
  "cjk-heading",
  "scroll-tilt-stage",
];

const seriesRank = { paper: 0, story: 1, showcase: 2, product: 3, motion: 4 } as const;

function rankBy(order: string[]) {
  const index = new Map(order.map((name, i) => [name, i]));
  return (a: RegistryItem, b: RegistryItem) =>
    (index.get(a.name) ?? Infinity) - (index.get(b.name) ?? Infinity) ||
    seriesRank[seriesOf(a)] - seriesRank[seriesOf(b)] ||
    b.meta.addedAt.localeCompare(a.meta.addedAt) ||
    a.title.localeCompare(b.title);
}

const PRO_EVERY = 3;
const PRO_SLOT = 1;
const SIBLING_GAP = 3;

export function orderCatalog<T extends RegistryItem>(items: T[]): T[] {
  const pro = items.filter((item) => item.meta.tier === "pro").sort(rankBy(proOrder));
  // 動效庫接在免費卡最後面；Pro 比免費卡多出來的幾張，會照同樣的節奏落進動效庫開頭，不會連排
  const free = [
    ...items.filter((item) => item.meta.tier === "free" && seriesOf(item) !== "motion").sort(rankBy(freeLead)),
    ...items.filter((item) => item.meta.tier === "free" && seriesOf(item) === "motion").sort(rankBy([])),
  ];

  // 先把免費排好，再把 Pro 插進每排中間；有近親衝突的 Pro 往後延，讓下一張沒衝突的先上
  const merged: T[] = [];
  const queue = [...pro];
  let f = 0;
  const nearSibling = (candidate: T, at: number) => {
    const siblings = proSiblings[candidate.name];
    if (!siblings) return false;
    // 已經排好的前幾張，加上接下來會放的免費卡
    const window = [
      ...merged.slice(Math.max(0, at - SIBLING_GAP)),
      ...free.slice(f, f + SIBLING_GAP),
    ];
    return window.some((item) => siblings.includes(item.name));
  };

  while (f < free.length || queue.length > 0) {
    const at = merged.length;
    if (at % PRO_EVERY === PRO_SLOT && queue.length > 0) {
      const pick = queue.findIndex((candidate) => !nearSibling(candidate, at));
      merged.push(...queue.splice(pick === -1 ? 0 : pick, 1));
    } else if (f < free.length) {
      merged.push(free[f++]);
    } else {
      merged.push(queue.shift()!);
    }
  }

  return merged;
}
