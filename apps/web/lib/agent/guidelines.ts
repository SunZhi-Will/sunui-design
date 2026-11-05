import { motionGroups } from "@/content/motion-dictionary";
import { motionLibName } from "@/lib/motion-lib";
import type { Series } from "@/lib/registry";
import { siteUrl } from "@/lib/site";

// 給 AI 代理看的設計規則（英文精簡版）。來源是 DESIGN.md、DESIGN-product.md、DESIGN-story.md；
// 改了那幾份文件，這裡要一起改。MCP、SKILL.md、llms-full.txt 都從這裡取，保持單一來源。

export const seriesSummary: Record<Series, string> = {
  paper: "Paper commerce: coupons, receipts, stamp cards and tickets on neutral gray paper with ink text; vermilion appears only on stamps.",
  product: "Quiet tool UI: neutral shadcn tokens, one accent color, status shown only as small dots, the reason written on screen.",
  story: "Ink and lamp: near-black panels, warm white serif text, one gold accent, all colors through --story-* CSS variables.",
  showcase: "Landing-page signature visuals in a quiet editorial dark, ported from real launch pages.",
  motion: "Motion effect libraries: one block per family (text, entrances, buttons, cards, backgrounds, scroll, cursor, loaders), each switching between many effects with an `effect` or `preset` prop.",
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

// 使用者用動效名稱提需求時的對照，來源是 /docs/motion 的資料，保持單一來源
function motionRequests() {
  const entries = motionGroups.flatMap((g) => g.entries).filter((e) => e.verdict !== "allow");
  const line = (e: (typeof entries)[number]) =>
    `- **${e.name}**${e.aliases?.length ? ` (${e.aliases.join(", ")})` : ""}: ${e.how.en}`;
  return `## When the user asks for a motion by name

Full list with allowed motions: ${siteUrl()}/docs/motion. Shared springs and allowed motions are installable as \`${motionLibName}\` (\`npx shadcn@latest add ${siteUrl()}/r/${motionLibName}.json\`).

Avoid (offer the alternative instead):
${entries.filter((e) => e.verdict === "avoid").map(line).join("\n")}

Limited (only in this situation):
${entries.filter((e) => e.verdict === "limit").map(line).join("\n")}`;
}

const paper = `## Series: paper (default when meta.series is missing)

${seriesSummary.paper}

| Role | Light | Dark | Tailwind |
|---|---|---|---|
| UI neutrals | shadcn tokens | shadcn tokens | \`bg-card\` \`text-muted-foreground\` \`border-border\` |
| Primary action | theme primary | theme primary | \`bg-primary text-primary-foreground\` |
| Paper | #f7f7f7 | #1c1c1c | \`bg-[#f7f7f7] dark:bg-[#1c1c1c]\` |
| Paper edge | #e2e2e2 | #333333 | \`border-[#e2e2e2] dark:border-[#333333]\` |
| Ink | #171717 | #ededed | \`text-[#171717] dark:text-[#ededed]\` |
| Muted ink | #a3a3a3 | #737373 | \`text-[#a3a3a3] dark:text-[#737373]\` |
| Vermilion (stamps only) | #c8361d | #ec6a4f | inside \`Stamp\` only |

- Paper and ink are neutral grays with no warm or cool cast. Do not use cream, beige, warm gray or the Tailwind stone scale.
- Vermilion appears only on stamps (\`Stamp\` with \`tone="vermilion"\`). Discount values, promo emphasis and the current step use ink, set apart by weight, size and contrast; when "current" must differ from "others", draw the others in muted ink. Do not pick an accent color per block; tell coupons apart with copy and layout.
- Paper is flat: 1px paper edge, no shadow or at most \`shadow-[0_1px_0_rgb(0_0_0/0.04)]\`, radius \`rounded-md\` or less.
- Results are shown with the shared \`Stamp\` component (install \`stamp\` from the SunUI registry, import from \`@/components/ui/stamp\`). Never hand-write a stamp. The stamp is the only celebration in the whole library, and its shape follows what the result means: \`tick\` for small confirmations (copied, saved, verified, added), \`box\` for transaction status (claimed, applied, sold out, ended), \`seal\` for wins and achievements, \`date\` for dated records such as paid or a postmark (pass \`date\`), \`chop\` for personal marks such as an invitation.
- Use \`tone="vermilion"\` for positive results and \`tone="ink"\` for expired, sold out, ended or no prize. Always pass a \`seed\` (order, coupon or step id) so each stamp gets its own stable angle and ink texture. Labels that are not results (Recommended, Popular) must not be stamps.
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

const motion = `## Series: motion

${seriesSummary.motion}

- The paper rules do not apply: gradients, glows, entrance animations and loops are allowed here. Colors still come from theme tokens, \`currentColor\` or a \`colors\` prop, never hard-coded purple or pink.
- Pick the effect with the \`effect\` (or \`preset\`) prop and the timing with \`trigger\`: mount, inView, hover, click or loop.
- Reduced motion shows the final state, stops loops and keeps every word readable. Loops pause off screen and on hidden tabs.
- Do not put motion blocks inside paper or product blocks; use them on landing pages, heroes and marketing sections.`;

const bySeries: Record<Series, string> = { paper, product, story, showcase, motion };

/** 單一系列或全部系列的設計規則（Markdown）。 */
export function designRules(series?: Series) {
  const sections = series ? [bySeries[series]] : [paper, product, story, showcase, motion];
  return [`# SunUI design rules`, shared, motionRequests(), ...sections].join("\n\n");
}
