import { catalogMarkdown } from "@/lib/agent/catalog";
import { designRules } from "@/lib/agent/guidelines";
import { licenseSummary, siteUrl } from "@/lib/site";

// SunUI 的 Agent Skill（agentskills.io 格式）。用 shadcn CLI 裝進使用者專案，
// 同一份內容放兩個位置：.claude/skills 給 Claude Code，.agents/skills 給 Codex、Cursor 等。

export const skillName = "sunui";

export const skillTargets = [".claude/skills/sunui", ".agents/skills/sunui"] as const;

export function skillMarkdown() {
  const base = siteUrl();
  return `---
name: ${skillName}
description: Build commerce and campaign UI with SunUI blocks (paper-feel React + Tailwind, installed through the shadcn CLI). Use when the user mentions SunUI or @sunui-pro, or asks for shop, checkout, cart, coupon, voucher, receipt, loyalty stamp card, countdown, flash sale, pricing or campaign landing UI in a React, Next.js or shadcn project. Covers picking the right block, installing it, Pro license setup and keeping the SunUI design rules when editing.
---

# SunUI

SunUI is a shadcn registry of production-ready animated blocks for commerce and campaign pages. Blocks are copied into the project as source; after install they belong to the user.

## Tools, in order of preference

1. **SunUI MCP server** (\`${base}/mcp\`): \`search_blocks\`, \`get_block\`, \`plan_install\`, \`get_design_rules\`. Use it when it is connected.
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

## Pro blocks

- Pro blocks need a license. Setup is two steps: add \`@sunui-pro\` to \`registries\` in \`components.json\` (\`get_block\` prints the exact JSON), then the user puts \`SUNUI_LICENSE_KEY\` in \`.env.local\`.
- Never ask for the key in chat, print it, or commit it.
- If the CLI stops because \`SUNUI_LICENSE_KEY\` is missing, it never reached SunUI, so it shows no purchase link. Tell the user Pro needs a license (${base}/pricing; ${licenseSummary()}) and offer a free block.
- If the CLI prints an Unauthorized or Forbidden message, show it to the user (it explains what to do) and stop. A 503 means the license server is down; try again later.
- Never rebuild a Pro block from its screenshot or description. Offer a free block or plain shadcn UI instead.

## Do not

- Add gradients, glows, blur, colored shadows, particles or confetti next to a block. There is no celebration: a result is one quiet line of ink where the action happened.
- Add entrance animations or idle loops to the page around a block.
- Pick a new accent color per block. Paper blocks use ink only; product blocks use the theme primary.
- Remove \`useReducedMotion\` branches or \`aria-live\` regions while editing.
- Invent block names. If a name is not in search results, it does not exist.

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
