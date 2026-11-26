import type { RegistryItem } from "@/lib/registry";
import { seriesOf } from "@/lib/series";

/**
 * 首頁「全部」型錄的排序。分析見 reports/型錄排序與免費付費價值分析-2026-11-07.md。
 *
 * 規則：
 * 1. 每 3 張放 1 張 Pro，放在每排中間（第 2、5、8 張），桌機每排一個鎖頭，手機每 3 張一個。
 * 2. Pro 依分級排：A 整頁場景、B 獨特招牌在前，C 有免費近親、D 通用元件在後。
 * 3. 免費（含動效庫）依精選順序排，其餘依系列與上架日期，純工具型的小控制項排最後。
 * 4. C 組 Pro 不放在它的免費近親附近（前後各 3 張內），避免兩張卡被拿來直接比較。
 * 5. 不在名單上的新卡排在精選名單後面、一般卡前面（新的在前），不會沉到最底。
 *    2026-11-23：之前新上的 Pro 場景和動效庫的好看卡都被排到兩百名之後，這條規則就是為了不再發生。
 *
 * Pro 名稱在型錄上本來就公開，所以分級放在這裡；公開 repo 沒有 Pro 清單時，這份名單只是被略過。
 */

/** A：整頁與檔期場景，B：免費沒有對應的招牌互動 */
const proLead = [
  // 開頭先放縮成卡片還好看的（有照片、插畫或大塊明暗）：型錄的第一個畫面是首頁主按鈕的目的地，
  // 不能是一排黑底灰字的小控制項。名單來自 reports/首頁從零重做深度分析-2026-11-20.md
  // 2026-11-23 補進較新的大場景（玻璃透鏡、液態玻璃導覽、翻頁型錄等），原本全排在最後
  "day-night-hero",
  "glass-lens-hero",
  "lookbook-expand-hero",
  "liquid-glass-nav",
  "glass-cube-hero",
  "catalog-flipbook",
  "lamp-dimmer-scene",
  "collection-accordion",
  "gift-guide-fan",
  "kelvin-switch",
  "shoppable-story",
  "holiday-calendar",
  "launch-stage-hero",
  "sky-time-switch",
  "pixel-grove",
  "specimen-scan",
  "loop-shader-hero",
  "tear-pack-reveal",
  "product-gallery",
  // 好玩的互動（刮、轉、拆、撕、抽）：縮圖平淡但點下去最有記憶點，2026-11-23 從清單尾端提上來
  "scratch-card",
  "prize-wheel",
  "gift-box-reveal",
  "peel-sticker-coupon",
  "physics-cart-jar",
  "pixel-gacha",
  "receipt-printer",
  "fold-invite-card",
  "pixel-boss-sale",
  "hoop-upload",
  "sticker-board",
  "gift-card-designer",
  "pixel-level-track",
  "stamp-card",
  "recipe-glass",
  "order-island",
  "pixel-preregister",
  "bundle-node-builder",
  "checkout-button",
  "pixel-check-in",
  // A
  "campaign-landing",
  "black-friday-weekend",
  "checkout-flow",
  "lunar-new-year",
  "self-building-page",
  "curve-rail-hero",
  "festival-banner",
  // B
  "vote-terrain",
  "redline-reveal",
  "cutaway-spec",
  "card-dock",
  "workspace-tabs",
  "theme-reveal",
  "glow-dock",
  "live-activity-wall",
  "ask-ai-halo",
  "scrub-stat-card",
  "voice-note",
  "wave-confirm",
  "ink-filter-bar",
  "shoppable-lookbook",
  "product-finder",
  "swipe-shortlist",
  "pickup-ticket",
  "holiday-cutoff",
  "size-finder",
  "subscription-manager",
  "referral-queue",
  "review-request",
  "ask-to-shop",
  "lineup-shelf",
  "count-chart",
  "coupon-claim-card",
  "price-history",
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
  "restock-notify": ["variant-picker", "low-stock-indicator"],
  "volume-tiers": ["tier-progress", "quantity-stepper"],
};

const proTail = [
  "flash-sale-product-card",
  "pricing-cards",
  "plan-comparison",
  "faq-accordion",
  "newsletter-signup",
  "file-dropzone",
];

/** 不在名單上的新 Pro 排在 proLead 之後；近親名單裡已放進 proLead 的卡以 proLead 的位置為準 */
const proMiddle = Object.keys(proSiblings).filter((name) => !proLead.includes(name));

/**
 * 免費精選（含動效庫）：開頭先放縮成卡片還好看的（照片、立體、粒子、大塊明暗），再接商店的招牌元件。
 * 動效庫以前整批排在免費卡最後，depth-hero、orbit-gallery、point-cloud 這些最搶眼的卡因此落到一百五十名之後。
 */
const freeLead = [
  "depth-hero",
  "compare-slider",
  "orbit-gallery",
  "book-3d",
  "point-cloud",
  "cloth-curtain",
  "photo-looks",
  "hero-billboard-carousel",
  "plush-portrait",
  "hotspots",
  "infinite-canvas",
  "spine-shelf",
  "raster-image",
  "ribbon-carousel",
  "image-effects",
  "scene-transitions",
  "gradient-backdrop",
  "add-to-cart-button",
  "variant-picker",
  "product-media",
  "coupon-wallet",
  "live-bento",
  "scroll-tilt-stage",
  "pixel-fx",
  "cjk-heading",
  "brush-reveal",
  "spring-rig",
  "dial-scrubber",
  "morph-menu",
  "copy-code-button",
  "animated-number",
  "toast-stack",
  "chapter-seekbar",
  "command-palette",
  "logo-marquee",
  "floating-social",
  "skill-grid",
  "social-button",
  "addon-checklist",
  "shipping-options",
  "terms-consent",
  "tier-progress",
];

/** 免費尾端：純工具型的小控制項與說明型動效庫，縮成卡片幾乎看不出東西 */
const freeTail = [
  "status-dot",
  "person-chip",
  "notify-badge",
  "pagination",
  "otp-input",
  "skeleton-set",
  "back-to-top",
  "empty-state",
  "error-state",
  "motion-principles",
  "animate-presets",
  "loading-effects",
  "micro-interactions",
];

const seriesRank = { craft: 0, story: 1, anime: 1.5, showcase: 2, product: 3, motion: 4 } as const;

/** lead 依序在前，不在名單上的排中間，tail 在最後。同名只看第一次出現的位置 */
function rankBy(lead: string[], tail: string[] = []) {
  const index = new Map<string, number>();
  [...lead, "", ...tail].forEach((name, i) => {
    if (name && !index.has(name)) index.set(name, i);
  });
  const unknown = lead.length;
  return (a: RegistryItem, b: RegistryItem) =>
    (index.get(a.name) ?? unknown) - (index.get(b.name) ?? unknown) ||
    seriesRank[seriesOf(a)] - seriesRank[seriesOf(b)] ||
    b.meta.addedAt.localeCompare(a.meta.addedAt) ||
    a.title.localeCompare(b.title);
}

const PRO_EVERY = 3;
const PRO_SLOT = 1;
const SIBLING_GAP = 3;

export function orderCatalog<T extends RegistryItem>(items: T[]): T[] {
  const pro = items.filter((item) => item.meta.tier === "pro").sort(rankBy(proLead, [...proMiddle, ...proTail]));
  // 免費與動效庫同一份名單排；Pro 比免費卡多出來的幾張會排在最後
  const free = items.filter((item) => item.meta.tier === "free").sort(rankBy(freeLead, freeTail));

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
