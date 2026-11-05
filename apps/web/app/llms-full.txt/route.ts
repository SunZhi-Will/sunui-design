import { describeBlock } from "@/lib/agent/catalog";
import { designRules } from "@/lib/agent/guidelines";
import { getItems } from "@/lib/registry";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

// llms.txt 的完整版：每個 block 的使用時機、注意事項與安裝方式，加上設計規則。給沒接 MCP 的代理一次讀完。
export function GET() {
  const base = siteUrl();
  const blocks = getItems()
    .map((item) => describeBlock(item).replace(/^# /, "## ").replace(/\n## /g, "\n### "))
    .join("\n\n---\n\n");

  const body = `# SunUI (full)

> Every SunUI block with when-to-use notes, plus the design rules. Short index: ${base}/llms.txt. MCP server: ${base}/mcp. Agent skill: \`npx shadcn@latest add ${base}/r/sunui-skill.json\`.

${designRules().replace(/^# .*\n/, "")}

# Blocks

${blocks}
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
