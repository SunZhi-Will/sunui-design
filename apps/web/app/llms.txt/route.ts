import { getItems, installCommand } from "@/lib/registry";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

// 給 LLM 與 agent 讀的純文字索引（llms.txt 慣例）
export function GET() {
  const base = siteUrl();
  const section = (tier: "free" | "pro") =>
    getItems(tier)
      .map((item) => `- [${item.title}](${base}/blocks/${item.name}): ${item.description} Install: \`${installCommand(item)}\``)
      .join("\n");

  const body = `# SunUI

> Paper-feel React + Tailwind blocks for commerce and campaign pages (coupons, receipts, loyalty stamps, countdowns, carts, checkout, pricing). Design language: paper surfaces, ink text, one vermilion accent, stamps for results, motion only on user action. Distributed as a shadcn registry: blocks are copied into the project with the shadcn CLI. Every block respects prefers-reduced-motion and supports keyboard and screen readers. Only dependency: framer-motion.

## Docs

- [Installation](${base}/docs/installation): set up shadcn and add blocks
- [Using Pro blocks](${base}/docs/pro): private @sunui-pro registry with a license key in SUNUI_LICENSE_KEY
- [AI agents and MCP](${base}/docs/ai-agents): install through the shadcn MCP server
- [Registry index](${base}/r/registry.json): free registry in shadcn format

## Free blocks (MIT)

${section("free")}

## Pro blocks (license required)

${section("pro")}
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
