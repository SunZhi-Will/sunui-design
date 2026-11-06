import { describeBlock, seriesOf } from "@/lib/agent/catalog";
import { seriesRules } from "@/lib/agent/guidelines";
import type { PropsSignature } from "@/lib/agent/props";
import type { RegistryItem } from "@/lib/registry";
import { siteUrl } from "@/lib/site";

// 區塊頁「複製給 agent」按鈕的內容：一次貼上就有安裝指令、何時用、props 與設計規則，
// 讓 Claude Code、Cursor、Codex 不必再查文件。英文，因為是給代理讀的。
// Pro block 不帶 props：任何來自 Pro 原始碼的內容都不能出現在公開頁面。

function importLine(item: RegistryItem, props: PropsSignature | null) {
  const file = item.files[0];
  if (!props || !file || !file.path.endsWith(".tsx")) return null;
  const base = file.path.split("/").pop()!.replace(/\.tsx$/, "");
  const dir = file.type === "registry:ui" ? "@/components/ui" : "@/components";
  return `import { ${props.component} } from "${dir}/${base}";`;
}

export function agentPrompt(item: RegistryItem, props: PropsSignature | null) {
  const isPro = item.meta.tier === "pro";
  const shown = isPro ? null : props;
  const imp = importLine(item, shown);
  return [
    `Add the SunUI block "${item.title}" (\`${item.name}\`) to this project. Use the install command below; do not rewrite the block by hand.`,
    describeBlock(item),
    shown
      ? [
          "## Props",
          imp ? `After install: \`${imp}\`` : null,
          "```tsx",
          shown.code,
          "```",
          "Pass the user's own copy, prices and dates through props. Keep `locale` if the page is not English.",
        ]
          .filter(Boolean)
          .join("\n")
      : "## Props\nRead the props interface at the top of the installed file before using the block.",
    seriesRules(seriesOf(item)).replace(/^## /gm, "### ").replace(/^/, `## Design rules (series: ${seriesOf(item)})\n\n`),
    [
      "## Steps",
      "1. Run the install command" + (isPro ? " after the Pro setup above." : "."),
      "2. Render the block where the user asked, with their content in props.",
      "3. Check light and dark mode, a 375px wide screen and reduced motion.",
      `More blocks and rules: SunUI MCP server at ${siteUrl()}/mcp, or ${siteUrl()}/llms-full.txt.`,
    ].join("\n"),
  ].join("\n\n");
}
