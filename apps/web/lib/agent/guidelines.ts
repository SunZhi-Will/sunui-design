import { motionGroups } from "@/content/motion-dictionary";
import { motionLibName } from "@/lib/motion-lib";
import type { Series } from "@/lib/registry";
import { siteUrl } from "@/lib/site";

// 給 AI 代理看的設計規則（英文精簡版）。來源是 DESIGN.md（質感，craft 系列）、DESIGN-product.md、DESIGN-story.md、DESIGN-anime.md；
// 改了那幾份文件，這裡要一起改。MCP、SKILL.md、llms-full.txt 都從這裡取，保持單一來源。

export const seriesSummary: Record<Series, string> = {
  craft: "Craft: precise objects with material, light and a tactile press. Neutral theme surfaces with real depth (hairline plus near-invisible layered shadow, top highlight in dark mode), concentric radii, and one brand spot colour taken from the theme. Covers stores and campaigns (coupons, carts, checkout, loyalty) and everyday UI.",
  product: "Quiet tool UI: neutral shadcn tokens, one accent color, status shown only as small dots, the reason written on screen.",
  story: "Ink and lamp: near-black panels, warm white serif text, one gold accent, all colors through --story-* CSS variables.",
  showcase: "Landing-page signature visuals in a quiet editorial dark, ported from real launch pages.",
  anime: "Anime cut: ordinary controls that are plain at rest and react like a key animator's hit when used. Ink outline with a hard shadow in a pale tint of the brand spot; squash and overshoot on springs; drawn impact stars, smoke, chips and sound-effect lettering (Japanese, or Chinese on Chinese pages) from the free anime-fx engine.",
  motion: "Motion effect libraries: one block per family (text, entrances, buttons, cards, backgrounds, scroll, cursor, loaders), each switching between many effects with an `effect` or `preset` prop.",
};

const shared = `## Rules for every block

- Blocks are copied into the project by the shadcn CLI. After install they are the user's code: edit props and copy, do not wrap them in extra providers.
- Each block is one file that depends only on \`framer-motion\` and \`cn\` (\`@/lib/utils\`). Icons are inline SVG at stroke width 1.5 using \`currentColor\` (the two-tone set on /icons is for app UI and pages, not for blocks). Take icon shapes from SunUI icons (\`search_icons\`, \`get_icon\`). Icons marked Pro belong to seasonal packs that install with a Pro license; Pro scenes depend on them, free blocks never do.
- Keep coupling to shadcn thin: shadcn is only the delivery format. Do not depend on shadcn/ui components, Radix, Base UI or \`shadcn/tailwind.css\`; import \`cn\` from \`@/lib/utils\`, not the \`cn\` package; \`registryDependencies\` may only be \`utils\` and SunUI's own items. Use only the standard shadcn colour token names. Projects without shadcn get them from \`sunui-theme.css\` (https://sunui.synvize.com/sunui-theme.css).
- Every block supports \`prefers-reduced-motion\` (\`useReducedMotion()\`): motion becomes an instant switch and no information is lost. Keep that when you edit.
- Numbers, prices and timers use \`tabular-nums\`. Codes and order numbers use \`font-mono\`.
- Never add decorative gradients, glows, coloured shadows, particles or confetti around a block. Content layers never get frosted glass.
- Motion only answers a user action or a data change. No decorative fade-up on page load, no idle loops (countdowns and loading states are the exception). Popovers, menus, drawers and panels may settle in from \`scale(0.96)\` with a fade, under 200ms.
  - Exception for full-page templates (registry \`categories\` include \`template\`): the hero's signature element may run one idle loop, such as campaign-landing's discount figure cycling through sale product photos that drift inside the numerals. One per page, plays only while on screen and the tab is visible, holds the first frame under reduced motion, and the loop must show real content (products), never decorative breathing, flicker or glow.
- Continuity: when state changes, reshape the same container instead of swapping it, and keep one anchor (thumbnail, icon, amount) in place across states. Old content leaves fast (about 100ms), new content arrives with the main line first and the secondary line slightly later. Plain crossfades and hard cuts are not enough. For dropdowns, drawers and accordions, also check what the rest of the page does while they move: content below should slide, not jump. When switching views or encodings, keep the same geometry through every state (a dot stays a dot that grows or lies flat; do not swap it for a different shape). Run multi-step transitions in sequence, one property at a time (for example drop the height, then turn the view, then add labels), each step under 400ms, instead of changing everything at once.
- Density by layer: overview surfaces (lists, card grids, dashboards) stay flat, dense and easy to compare. Heavier treatments (3D, large charts, detailed motion) belong only in the drill-down layer the user opens on purpose (drawer, side panel, detail page). Carry the title, numbers and colours from the overview into the drill-down so it reads as the same data in more depth, and keep an exact way to read it there (a flat view toggle, exact values on hover).
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

const craft = `## Series: craft (default when meta.series is missing)

${seriesSummary.craft}

SunUI dropped its old "paper" look on 2026-11-19: no paper or ink hex colours, no perforations, notches or zigzag tears (not even on coupons or pickup tickets; reveal a code with a raised lid that lifts away from an inset well, or a bar that slides away), no flat shadowless cards. If an older block still has \`#f7f7f7\`, \`#e2e2e2\` or \`#171717\` classes, that is legacy; new code uses the tokens below.

| Role | Tailwind | Fallback |
|---|---|---|
| Surface | \`bg-card\` | theme card |
| Inset | \`bg-muted\` | theme muted (inputs, tracks, unselected cells) |
| Hairline | \`border-foreground/10\` | theme foreground at 10% |
| Text | \`text-foreground\`, \`text-muted-foreground\` | theme |
| Primary action | \`bg-primary text-primary-foreground\` | theme |
| Brand spot | \`text-[color:var(--sunui-spot,var(--primary))]\` | theme primary |
| Like (semantic) | \`text-[color:var(--sunui-like,#dc3d43)] dark:text-[color:var(--sunui-like,#ff6b70)]\` | red |
| Rating (semantic) | \`text-[color:var(--sunui-rating,#e8a020)] dark:text-[color:var(--sunui-rating,#f5b84a)]\` | amber |
| Success (semantic) | \`text-[color:var(--sunui-success,#1f9d55)] dark:text-[color:var(--sunui-success,#4cd68a)]\` | green |
| Danger (semantic) | \`text-destructive\` | theme |

- Grays are neutral with no warm or cool cast. Do not use cream, beige, warm gray or the Tailwind stone scale.
- Brand spot colour: SunUI picks no colour of its own. Selection, discount values, current progress and the main button read \`var(--sunui-spot, var(--primary))\` (on a filled spot background use \`--sunui-spot-foreground\`, falling back to \`--primary-foreground\`). Set \`--sunui-spot\` on \`:root\` and \`.dark\` to use the store brand colour. Body text, headings and hairlines never use it. Do not pick an accent colour per block.
- Semantic colours, three only: meanings everyone recognises do not follow the brand spot and ship in the right colour: a saved heart is red (shared with danger, #dc3d43, dark #ff6b70) (\`--sunui-like\`), filled stars are amber (\`--sunui-rating\`, #e8a020, dark #f5b84a), done and verified states are green (\`--sunui-success\`, #1f9d55, dark #4cd68a), errors use the theme \`--destructive\`. Buyers can override each variable. Use them only for these meanings, never as decoration.
- Content colours: blocks may carry colour at rest, but only on content: avatars without a photo, category tags and dots, chart series. Always use shades of the brand spot (\`color-mix(in oklch, var(--sunui-spot, var(--primary)) N%, transparent)\`; avatars hash a name to 12, 20 or 28%, charts use five shades), never a separate palette, so a buyer's brand colour recolours them too. Gradient avatars stay within that one hue. The only exception is person-chip, whose job is telling people apart on a roster, so it keeps eight hues. Never use spot shades to decorate buttons, backgrounds or headings.
- Object colours in illustration scenes (since 2026-11-22): a block that draws a space or a set of objects (for example the pop-up book rooms in popup-store-tour) fills them with object colours, not spot shades. The palette is fixed to the pixel icon pigments (brown wood, green leaves, blue and pink fabric, gold lamps, steel, bone, red accents); do not add hues. Name fills by material role (wood, fabric, plant, glass, metal, lamp, accent, ceramic) and map roles to colours in one table, mixed with \`var(--card)\` (furniture 70 to 90%, glass about 30%, walls about 16%, floors about 36%) so they read in light and dark. Lines stay the brand spot. Only inside illustrations; buttons, headings and backgrounds are unchanged.
- Full-page templates (registry \`categories\` include \`template\`) may have one fixed dark section (\`bg-[#111111] text-[#ededed]\`, dark in both modes), usually the hero. Do not fill sections with the spot colour.
- Light comes from straight above, one source per page. Elevation levels, each already including the hairline (do not add a border on top):
  - e1 (cards, coupons, inputs, secondary buttons): \`shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)]\`
  - e2 (hovered cards, dropdowns, featured plan): \`shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_4px_8px_-4px_rgb(0_0_0/0.06),0_12px_20px_-8px_rgb(0_0_0/0.08)]\`
  - e3 (panels, dialogs, drawers): \`shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_16px_32px_-8px_rgb(0_0_0/0.10),0_32px_64px_-16px_rgb(0_0_0/0.10)]\`
  - Dark mode does not rely on drop shadows: lift the surface one step and use \`dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]\`.
- Raised objects (primary button, selected segment, result disc) get a 1px inner top highlight such as \`shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]\`. Inset controls (inputs, switch and progress tracks) use the inset colour with \`shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)]\`.
- Gradients only to model light: a same-hue surface shading of at most 3% lightness, edge fade masks, or the material signature below (foil, lacquer, metal rim), which may show clear light and shade but stays one hue with light from straight above. Never blue-purple or rainbow gradients or coloured backgrounds. Gradient text is allowed once per screen, on the single most important word of a headline, using two neighbouring hues with a solid-colour fallback; never a whole sentence or paragraph. Frosted glass only on functional layers floating over content (sticky bars, floating toolbars, popovers) with at least 80% opacity.
- Concentric radii: controls 6px (\`rounded-md\`), cards and coupons 12px (\`rounded-xl\`), panels and dialogs 16px (\`rounded-2xl\`); inner radius = outer radius minus padding. Separators are solid hairlines (\`divide-foreground/10\`), not dashed tear lines.
- Discount values, promo emphasis and the current step are set apart by weight, size and contrast; "others" use \`text-muted-foreground\`.
- Every pressable element has hover, focus-visible and pressed states: \`whileTap={{ scale: 0.97 }}\` with the snappy spring, or CSS \`motion-safe:active:scale-[0.97]\` with \`scale\` in the transition list (0.99 for large pressable cards); hover appears instantly and fades out over about 150ms. This shared press weight is a SunUI signature.
- Visible material at rest (since 2026-11-23): every block has at least one signature object you can see without touching it, such as a brand-colour foil coupon face or cover, a lacquered wheel in a metal rim, or a key with real thickness. Press feel alone looks like ordinary UI in a thumbnail. Foil recipe: background \`var(--sunui-spot, var(--primary))\` with three layers, \`linear-gradient(180deg, rgb(255 255 255/0.3), transparent 45%, rgb(0 0 0/0.16))\` for top light, \`linear-gradient(115deg, transparent 34%, rgb(255 255 255/0.3) 47%, transparent 60%)\` for a sheen that may follow the pointer, and \`repeating-linear-gradient(90deg, rgb(255 255 255/0.05) 0 1px, transparent 1px 3px)\` for brushing; shadow \`inset 0 1px 0 rgb(255 255 255/0.4), inset 0 -1px 0 rgb(0 0 0/0.18)\` plus e1 or e2. Unavailable states use the same recipe on steel (\`color-mix(in oklch, var(--foreground) 14%, var(--card))\`). Text on material uses \`--sunui-spot-foreground\`. One or two material spots per block; the light stays fixed when an object rotates. References: pro/prize-wheel, pro/coupon-claim-card, pro/scratch-card, free/coupon-wallet.
- Acceptance test before you finish (since 2026-11-23): shrink the catalog card to 256px wide and cover the text; it must still read as SunUI because of one material object, not because of press feel or a 4px strip. Do not stack two brand-colour objects in one column (a foil plate right above a lacquer key: make the key the ink primary). Semantic colours win over material: amber stars, red hearts and green success stay; put them on a steel plate when brand foil would kill the contrast. Never override \`--sunui-spot\` inside a block to quiet it down; the buyer's brand colour must still apply.
- Results use the shared \`Result\` component (install \`stamp\` from the SunUI registry, \`import { Result } from "@/components/ui/stamp"\`; \`Stamp\` is its old name). Positive results show a small spot-colour disc with a check that draws in and settles once on the pop spring; expired, sold out, ended or no prize use \`tone="muted"\`; \`void\` adds a strikethrough. Place it where the action happened (for example where the button was), never absolutely positioned over other content. \`shape\` only adds detail: \`date\` adds a date, \`seal\` adds a second line. No confetti, no whole-card bounce. Labels that are not results (Recommended, Popular) must not use it.
- Springs: snappy \`{ stiffness: 520, damping: 34 }\`, gentle \`{ stiffness: 240, damping: 30 }\`, pop \`{ stiffness: 620, damping: 20, mass: 0.8 }\` (old name: stamp). Single animations stay under 400ms. Do not animate box-shadow; cross-fade two layers instead.`;

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

- Every color goes through CSS variables set on the block root: \`--story-bg\`, \`--story-panel\`, \`--story-line\`, \`--story-text\`, \`--story-muted\`, \`--story-accent\`, \`--story-danger\`, and optionally \`--story-rare\` (a cool blue used only to mark rarity in reward reveals, never for selection, hints or the main action). Themes: \`ink\` (default, dark), \`rice\` (light), \`moon\` (blue accent). Re-skin by passing \`theme\`, not by editing classes.
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

- The craft restraint rules do not apply: decorative gradients, glows, entrance animations and loops are allowed here. Colors still come from theme tokens, \`currentColor\` or a \`colors\` prop, never hard-coded purple or pink.
- Pick the effect with the \`effect\` (or \`preset\`) prop and the timing with \`trigger\`: mount, inView, hover, click or loop.
- Reduced motion shows the final state, stops loops and keeps every word readable. Loops pause off screen and on hidden tabs.
- Do not put motion blocks inside craft or product blocks; use them on landing pages, heroes and marketing sections.`;

const anime = `## Series: anime

${seriesSummary.anime}

- Build on \`anime-fx\` (\`@sunui/anime-fx\`): \`paletteOf(el)\`, the effects (\`burst\`, \`puff\`, \`shards\`, \`ticks\`, \`lines\`, \`wob\`, \`kira\`, \`splash\`), \`sfx(P, slot, x, y)\`, \`useSquash\` and \`useBackLayer\`. Never copy the twelve anime blocks' effect code into another block; compose the blocks instead.
- Resting look: \`border-[3px] border-foreground bg-card\` with \`shadow-[4px_5px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))]\`. That hard tinted shadow is the only coloured shadow allowed; labels on the control are italic 800.
- Colours: effect lit faces are white in both themes, shadow faces are the brand spot mixed into white, outlines are the brand spot, accent wedges are the semantic red. Rating effects use the rating amber (\`paletteOf(el, "var(--sunui-rating)")\`). No new hues, no purple or pink.
- Write each reaction as beats: anticipation (the press), the hit (the moment state changes), follow-through, settle. One or two effects per beat, at most one sound-effect word per reaction, on the hit.
- State changes at once; effects only decorate it. Nothing a person must read may depend on an effect, and no state may wait on the effect clock (it pauses in hidden tabs).
- Effects leave by shrinking or thinning, never by fading. Squash keeps volume. Anything the hand moves follows a spring, and stretch comes from its speed, so a slow drag stays quiet.
- Effects never cover a label: launch chips from a control's edge, put words above the control or past the end of its label, and turn lettering off where there is no room (anime-slider does by default).
- The control is plain at rest: no idle animation. With reduced motion no effect is drawn and every state still changes.
- Native semantics underneath: a real button, checkbox, radio or range input, role="switch" for toggles, the tabs and radiogroup keyboard patterns; value controls work in forms.`;

const bySeries: Record<Series, string> = { craft, product, story, showcase, motion, anime };

/** 共用規則加上一個系列的規則，不含動效名稱對照表。給區塊頁的「複製給 agent」prompt 用，保持短。 */
export function seriesRules(series: Series) {
  return [shared, bySeries[series]].join("\n\n");
}

/** 單一系列或全部系列的設計規則（Markdown）。 */
export function designRules(series?: Series) {
  const sections = series ? [bySeries[series]] : [craft, product, story, showcase, motion, anime];
  return [`# SunUI design rules`, shared, motionRequests(), ...sections].join("\n\n");
}
