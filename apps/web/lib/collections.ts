import { siteUrl } from "@/lib/site";

// 型錄的「從一整頁開始」合輯：依頁型與檔期把現有區塊重組，不新增任何 block。
// 順序就是建議的頁面由上到下的順序，複製給 agent 的 prompt 也照這個順序。
// Pro 名稱在公開 clone 裡可能不存在（registry/pro 是私有 repo），型錄只顯示找得到的。
// 標題與一句說明在 messages.ts 的 collections，四種語言；agentTitle 是寫進 agent prompt 的英文頁面名稱。

export const collections = [
  {
    slug: "flash-sale",
    agentTitle: "a flash sale page",
    blocks: [
      "announcement-strip",
      "flash-sale-hero",
      "countdown-banner",
      "flash-sale-product-card",
      "low-stock-indicator",
      "coupon-claim-card",
      "free-shipping-progress",
      "add-to-cart-button",
    ],
  },
  {
    slug: "product-page",
    agentTitle: "a product page",
    blocks: [
      "product-media",
      "product-gallery",
      "variant-picker",
      "quantity-stepper",
      "add-to-cart-button",
      "favorite-button",
      "star-rating",
      "price-history",
      "hotspots",
      "testimonial-marquee",
    ],
  },
  {
    slug: "checkout",
    agentTitle: "a cart and checkout flow",
    blocks: [
      "cart-drawer",
      "upsell-drawer",
      "addon-checklist",
      "coupon-wallet",
      "checkout-steps",
      "shipping-options",
      "terms-consent",
      "checkout-button",
      "payment-status-banner",
      "order-tracker",
    ],
  },
  {
    slug: "launch",
    agentTitle: "a product launch page",
    blocks: [
      "launch-stage-hero",
      "drop-release-hero",
      "launch-countdown-wall",
      "scroll-story",
      "compare-slider",
      "newsletter-signup",
    ],
  },
  {
    slug: "loyalty",
    agentTitle: "a loyalty and rewards page",
    blocks: ["checkin-streak", "stamp-card", "tier-progress", "coupon-wallet", "redeem-key-input", "prize-wheel", "scratch-card"],
  },
  {
    slug: "seasonal",
    agentTitle: "a seasonal campaign page",
    blocks: [
      "festival-banner",
      "day-night-hero",
      "black-friday-weekend",
      "gift-box-reveal",
      "peel-sticker-coupon",
      "countdown-banner",
      "campaign-landing",
    ],
  },
  // 以下三組不是電商情境（2026-11-13 定位調整）：同樣只重組現有區塊。
  {
    slug: "saas-landing",
    agentTitle: "a SaaS product landing page",
    blocks: [
      "capsule-nav",
      "depth-hero",
      "scripted-demo",
      "step-demo",
      "scroll-story",
      "compare-slider",
      "testimonial-marquee",
      "faq-accordion",
    ],
  },
  {
    slug: "pricing-billing",
    agentTitle: "a pricing page and billing flow",
    blocks: ["pricing-cards", "plan-comparison", "faq-accordion", "upgrade-modal", "quota-meter", "payment-status-banner"],
  },
  {
    slug: "app-ui",
    agentTitle: "the interface of a web app",
    blocks: [
      "app-shell",
      "sliding-tabs",
      "side-panel",
      "dialog-sheet",
      "theme-picker",
      "confirm-button",
      "status-dot",
      "jobs-tray",
      "toast-stack",
      "skeleton-set",
      "empty-state",
      "error-state",
    ],
  },
] as const;

export type CollectionSlug = (typeof collections)[number]["slug"];

export const collectionSlugs = collections.map((c) => c.slug) as CollectionSlug[];

export type SetBlock = { name: string; title: string; description: string; tier: "free" | "pro" };

/** 一整組區塊的安裝指令：免費一行、Pro 一行（shadcn add 可一次帶多個）。 */
export function setInstallCommands(blocks: SetBlock[]) {
  const free = blocks.filter((b) => b.tier === "free").map((b) => `${siteUrl()}/r/${b.name}.json`);
  const pro = blocks.filter((b) => b.tier === "pro").map((b) => `@sunui-pro/${b.name}`);
  return {
    free: free.length ? `npx shadcn@latest add ${free.join(" ")}` : null,
    pro: pro.length ? `npx shadcn@latest add ${pro.join(" ")}` : null,
  };
}

/**
 * 一次把整組區塊交給 agent：安裝指令、清單與步驟。英文，因為是給代理讀的。
 * 不帶 props 與原始碼（Pro 原始碼不能出現在公開頁面），改請 agent 讀安裝後的檔案與 MCP 的設計規則。
 */
export function setAgentPrompt(blocks: SetBlock[], heading?: string) {
  const { free, pro } = setInstallCommands(blocks);
  const site = siteUrl();
  return [
    `Add these SunUI blocks to this project${heading ? ` to build: ${heading}` : ""}. Use the install commands below; do not rewrite the blocks by hand.`,
    [
      "## Install",
      free ? ["```bash", free, "```"].join("\n") : null,
      pro
        ? [
            `Pro blocks need the SunUI Pro registry in \`components.json\` and \`SUNUI_LICENSE_KEY\` in the environment (setup: ${site}/docs/pro).`,
            "```bash",
            pro,
            "```",
          ].join("\n")
        : null,
    ]
      .filter(Boolean)
      .join("\n\n"),
    ["## Blocks, in page order", ...blocks.map((b, i) => `${i + 1}. ${b.title} (\`${b.name}\`${b.tier === "pro" ? ", Pro" : ""}): ${b.description}`)].join("\n"),
    [
      "## Steps",
      "1. Run the install commands.",
      "2. Read the props interface at the top of each installed file. Pass the user's own copy, prices and dates through props.",
      "3. Compose the page in the order above unless the user asked otherwise. Keep one design series per page.",
      `4. Before restyling, read the design rules: \`get_design_rules\` on the SunUI MCP server (${site}/mcp), or ${site}/llms-full.txt.`,
      "5. Check light and dark mode, a 375px wide screen and reduced motion.",
    ].join("\n"),
  ].join("\n\n");
}
