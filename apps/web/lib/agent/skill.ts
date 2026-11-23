import { catalogMarkdown } from "@/lib/agent/catalog";
import { designRules } from "@/lib/agent/guidelines";
import { portPlatformLabels, portPlatforms } from "@/lib/agent/port";
import { licenseSummary, siteUrl } from "@/lib/site";

// SunUI 的 Agent Skill（agentskills.io 格式）。用 shadcn CLI 裝進使用者專案，
// 同一份內容放兩個位置：.claude/skills 給 Claude Code，.agents/skills 給 Codex、Cursor 等。

export const skillName = "sunui";

export const skillTargets = [".claude/skills/sunui", ".agents/skills/sunui"] as const;

export function skillMarkdown() {
  const base = siteUrl();
  return `---
name: ${skillName}
description: Build animated, refined UI with SunUI blocks (React + Tailwind, installed through the shadcn CLI). Use when the user mentions SunUI or @sunui-pro, or asks for shop, checkout, cart, coupon, voucher, receipt, loyalty stamp card, countdown, flash sale, pricing or campaign landing UI, or for an animated hero, navigation, chart, theme switch or motion effect, in a React, Next.js or shadcn project. Covers picking the right block, installing it, Pro license setup and keeping the SunUI design rules when editing.
---

# SunUI

SunUI is a shadcn registry of production-ready, refined animated blocks. The deepest set is for stores and campaign pages; the rest (heroes, navigation, charts, theme switches, motion effects) fits any product page. Blocks are copied into the project as source; after install they belong to the user.

## Tools, in order of preference

1. **SunUI MCP server** (\`${base}/mcp\`): \`search_blocks\`, \`get_block\`, \`plan_install\`, \`get_design_rules\`, plus \`search_icons\` and \`get_icon\` for icons. Use it when it is connected.
2. **Plain HTTP** when no MCP is connected: \`${base}/llms-full.txt\` (every block with when-to-use notes) and \`${base}/r/<name>.json\` (free block source).
3. **shadcn MCP** (\`npx shadcn@latest mcp\`) can also install SunUI blocks, but it does not see the usage notes or design rules, so pick blocks with 1 or 2 first.

## Workflow

1. **Read the project first.** Confirm \`components.json\` exists. If not, run \`npx shadcn@latest init\` and tell the user.
2. **Find candidates.** Search by what the user wants on the page ("coupon users can claim", "cart drawer", "Double 11 hero"). Queries in Chinese or Japanese work too.
3. **Check fit before installing.** Read each candidate's *When to use* and *Watch out* notes. Prefer one block that fits over stacking several similar ones. If nothing fits, say so and build plain shadcn UI that follows the design rules instead of forcing a block.
4. **Install with one command per tier** (\`plan_install\` gives it). Free blocks install by URL; Pro blocks install as \`@sunui-pro/<name>\`.
5. **Wire it up.** Import from the path the CLI printed, pass real data and copy in the user's language, and connect callbacks to the user's actual state or API. Keep network calls independent from animations.
6. **Keep the rules** in the block's series when you edit (see below, or \`get_design_rules\`).
7. **Verify** in light and dark mode and at 375px. Turn on reduced motion and check nothing is lost.

## Projects that are not React

SunUI blocks are React code, so the shadcn install only works in a React project. For ${portPlatforms.map((p) => portPlatformLabels[p]).join(" or ")}, port the block instead:

1. Get the block's port guide: \`get_port_prompt\` (MCP), or \`${base}/r/port/<platform>/<name>.md\` with platform \`${portPlatforms.join("` or `")}\`. A Pro guide needs \`Authorization: Bearer $SUNUI_LICENSE_KEY\`.
2. Follow it: it carries the adapter rules for that platform and the block's source, which is the specification. Keep every state and every number (springs, durations, sizes).
3. Read the port status at the top of the guide and tell the user what it says: verified, untested, needs manual work or web only.
4. Say plainly that a port is your rewrite and can differ from the original; ask the user to compare it with the block's preview.

Other platforms have no guide yet. Do not improvise one from memory and call it a SunUI port.

## Pro blocks

- Pro blocks need a license. Setup is two steps: add \`@sunui-pro\` to \`registries\` in \`components.json\` (\`get_block\` prints the exact JSON), then the user puts \`SUNUI_LICENSE_KEY\` in \`.env.local\`.
- Never ask for the key in chat, print it, or commit it.
- If the CLI stops because \`SUNUI_LICENSE_KEY\` is missing, it never reached SunUI, so it shows no purchase link. Tell the user Pro needs a license (${base}/pricing; ${licenseSummary()}) and offer a free block.
- If the CLI prints an Unauthorized or Forbidden message, show it to the user (it explains what to do) and stop. A 503 means the license server is down; try again later.
- Never rebuild a Pro block from its screenshot or description. Offer a free block or plain shadcn UI instead.

## Do not

- Add decorative gradients, gradient text, glows, coloured shadows, particles or confetti next to a block. There is no celebration: a result is the shared \`Result\` mark settling once where the action happened.
- Add decorative entrance animations or idle loops to the page around a block.
- Pick a new accent color per block. Craft blocks use the brand spot colour (\`--sunui-spot\`, default theme primary) only on selection, discounts, progress and results; product blocks use the theme primary.
- Reintroduce the old paper look (hard-coded \`#f7f7f7\` / \`#171717\` paper and ink, perforated tear lines, flat shadowless cards). SunUI dropped it on 2026-11-19.
- Remove \`useReducedMotion\` branches or \`aria-live\` regions while editing.
- Invent block names. If a name is not in search results, it does not exist.
- Draw a new SVG icon before checking \`search_icons\`. SunUI icons share one grid and stroke; a hand-drawn one breaks the set.
- Paste or redraw a SunUI Pro icon (marked [Pro] in \`search_icons\`) when the user has no Pro license. Use a free icon, or tell them it needs Pro.

## References

- \`references/design-rules.md\`: full design rules for every series. Read the section for the block's series before editing it.
- \`references/catalog.md\`: every block in one list, grouped by series. Use it to scan when search is unavailable; it may be older than the live registry.
- Docs: ${base}/docs/ai-agents
`;
}

export function skillFiles() {
  return [
    { name: "SKILL.md", content: skillMarkdown() },
    { name: "references/design-rules.md", content: designRules() },
    { name: "references/catalog.md", content: catalogMarkdown() },
  ];
}

/** 把 skill 包成 registry:file item，用 `npx shadcn add <url>/r/sunui-skill.json` 安裝。 */
export function skillRegistryItem() {
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "sunui-skill",
    type: "registry:file",
    title: "SunUI agent skill",
    description:
      "Agent Skill that teaches Claude Code, Codex and Cursor how to pick, install and edit SunUI blocks. Installs into .claude/skills/sunui and .agents/skills/sunui.",
    files: skillTargets.flatMap((dir) =>
      skillFiles().map((file) => ({
        path: `skills/sunui/${file.name}`,
        type: "registry:file",
        target: `${dir}/${file.name}`,
        content: file.content,
      })),
    ),
  };
}
