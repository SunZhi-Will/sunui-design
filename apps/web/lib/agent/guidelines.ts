import type { Series } from "@/lib/registry";

// 給 AI 代理看的設計規則（英文精簡版）。來源是 DESIGN.md、DESIGN-product.md、DESIGN-story.md；
// 改了那幾份文件，這裡要一起改。MCP、SKILL.md、llms-full.txt 都從這裡取，保持單一來源。

export const seriesSummary: Record<Series, string> = {
  paper: "Paper commerce: coupons, receipts, stamp cards and tickets on warm paper with ink text and one vermilion accent.",
  product: "Quiet tool UI: neutral shadcn tokens, one accent color, status shown only as small dots, the reason written on screen.",
  story: "Ink and lamp: near-black panels, warm white serif text, one gold accent, all colors through --story-* CSS variables.",
  showcase: "Landing-page signature visuals in a quiet editorial dark, ported from real launch pages.",
};

const shared = `## Rules for every block

- Blocks are copied into the project by the shadcn CLI. After install they are the user's code: edit props and copy, do not wrap them in extra providers.
- Each block is one file that depends only on \`framer-motion\` and \`cn\` (\`@/lib/utils\`). Icons are inline SVG at stroke width 1.5 using \`currentColor\`.
- Every block supports \`prefers-reduced-motion\` (\`useReducedMotion()\`): motion becomes an instant switch and no information is lost. Keep that when you edit.
- Numbers, prices and timers use \`tabular-nums\`. Codes and order numbers use \`font-mono\`.
- Never add gradients, glows, blur, colored shadows, particles or confetti around a block.
- Motion only answers a user action or a data change. No fade-up on page load, no idle loops (countdowns and loading states are the exception).
- One primary action per block. Name buttons after the result ("Claim coupon", not "OK").
- Be honest: no fake scarcity, no fake timers, no showing 0 as social proof.
- Check light and dark mode and a 375px wide screen. Chinese and Japanese copy must fit without layout changes.`;

const paper = `## Series: paper (default when meta.series is missing)

${seriesSummary.paper}

| Role | Light | Dark | Tailwind |
|---|---|---|---|
| UI neutrals | shadcn tokens | shadcn tokens | \`bg-card\` \`text-muted-foreground\` \`border-border\` |
| Primary action | theme primary | theme primary | \`bg-primary text-primary-foreground\` |
| Paper | #faf7f0 | #1f1c18 | \`bg-[#faf7f0] dark:bg-[#1f1c18]\` |
| Paper edge | #e7e0d0 | #38332b | \`border-[#e7e0d0] dark:border-[#38332b]\` |
| Ink | #1c1917 | #ece7dc | \`text-[#1c1917] dark:text-[#ece7dc]\` |
| Vermilion (signature) | #c8361d | #ec6a4f | \`text-[#c8361d] dark:text-[#ec6a4f]\` |

- Vermilion has at most one main use per block (discount value, stamp, promo emphasis). Do not pick a new accent color per block; tell coupons apart with copy and layout.
- Paper is flat: 1px paper edge, no shadow or at most \`shadow-[0_1px_0_rgb(0_0_0/0.04)]\`, radius \`rounded-md\` or less.
- Results (claimed, redeemed, expired, sold out) are shown as a vermilion outlined stamp rotated -8 to -12 degrees. The stamp is the only celebration in the whole library.
- Springs: snappy \`{ stiffness: 520, damping: 34 }\`, gentle \`{ stiffness: 240, damping: 30 }\`, stamp \`{ stiffness: 620, damping: 20, mass: 0.8 }\`. Single animations stay under 400ms.`;

const product = `## Series: product

${seriesSummary.product}

- Colors come only from shadcn tokens. One accent (\`bg-primary\`, \`text-primary\`) for today, focus, current state, the main action or the data highlight. Selection uses \`bg-primary/10\`.
- Status colors (emerald, amber, destructive, sky) go only on dots 6px or smaller; text stays foreground or muted.
- Controls \`rounded-md\`, cards \`rounded-xl\`, menus \`rounded-lg\`. Floating layers use at most \`shadow-sm\`.
- Easing \`[0.23, 1, 0.32, 1]\`; durations 120 / 180 / 240 / 360ms. Animate only transform and opacity.
- Autoplaying demos play only while visible, pause when the tab is hidden, and offer pause and replay.
- Write the reason on screen: why a suggestion, why a slowdown, check results next to the main button. Background failures stay visible.`;

const story = `## Series: story

${seriesSummary.story}

- Every color goes through CSS variables set on the block root: \`--story-bg\`, \`--story-panel\`, \`--story-line\`, \`--story-text\`, \`--story-muted\`, \`--story-accent\`, \`--story-danger\`. Themes: \`ink\` (default, dark), \`rice\` (light), \`moon\` (blue accent). Re-skin by passing \`theme\`, not by editing classes.
- Radius 0 to 4px. Story text uses a serif stack ("Noto Serif TC", "Songti TC", serif); UI text stays sans. Body line length up to 34em, line height 1.8.
- Easing \`[0.22, 0.72, 0.2, 1]\`; hover 120ms, panels 220 to 240ms. The "next line" hint may breathe slowly; it is the only idle loop and it stops under reduced motion.
- Keyboard and gamepad parity: number keys pick choices, Enter or Space advances, Esc toggles menus. Timers pause on hover, focus, open menus and hidden tabs.
- Destructive actions say what will be lost and offer a third path (save, then leave).`;

const showcase = `## Series: showcase

${seriesSummary.showcase}

- Use on landing pages for one signature moment, not repeated down the page.
- Follow the product rules for motion: play only while visible, pause on hidden tabs, keep reduced motion complete.`;

const bySeries: Record<Series, string> = { paper, product, story, showcase };

/** 單一系列或全部系列的設計規則（Markdown）。 */
export function designRules(series?: Series) {
  const sections = series ? [bySeries[series]] : [paper, product, story, showcase];
  return [`# SunUI design rules`, shared, ...sections].join("\n\n");
}
