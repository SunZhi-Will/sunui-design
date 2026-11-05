import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import { blockLine, catalogMarkdown, describeBlock, planInstall, proSetup, searchBlocks, suggestNames } from "@/lib/agent/catalog";
import { designRules } from "@/lib/agent/guidelines";
import { skillMarkdown } from "@/lib/agent/skill";
import { buildRegistryItem, getItem, getItems } from "@/lib/registry";
import { siteUrl } from "@/lib/site";

// SunUI 的遠端 MCP 伺服器（Streamable HTTP，無狀態）。全部唯讀、不需授權；
// Pro 只回傳 metadata 與安裝方式，原始碼一律走帶授權的 /r/pro。

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const series = z.enum(["paper", "product", "story", "showcase", "motion"]);
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] });

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search_blocks",
      {
        title: "Search SunUI blocks",
        description:
          "Find SunUI blocks for a UI need, described in plain words (English, Chinese or Japanese), e.g. 'coupon users can claim', 'cart drawer', 'countdown for a flash sale'. Returns block names with tier, series and a one-line description. Call get_block on the best candidates before installing.",
        inputSchema: z.object({
          query: z.string().optional().describe("What the UI should do or be called. Omit to list blocks."),
          tier: z.enum(["free", "pro"]).optional().describe("Only free (MIT) or only Pro blocks."),
          series: series.optional().describe("Design series: paper (commerce), product (tool UI), story (narrative game UI), showcase (landing visuals)."),
          category: z.string().optional().describe("Registry category, e.g. checkout, coupon, cart, marketing, feedback."),
          limit: z.number().int().min(1).max(30).default(8),
        }),
        annotations: readOnly,
      },
      async (args) => {
        const hits = searchBlocks(args);
        if (hits.length === 0) {
          return text(
            `No SunUI block matches "${args.query ?? ""}". Try other words or a category, or build plain shadcn UI that follows get_design_rules.`,
          );
        }
        return {
          ...text([`${hits.length} result(s):`, ...hits.map((h) => blockLine(h.item))].join("\n")),
          structuredContent: {
            results: hits.map(({ item }) => ({
              name: item.name,
              title: item.title,
              tier: item.meta.tier,
              series: item.meta.series ?? "paper",
              description: item.description,
            })),
          },
        };
      },
    );

    server.registerTool(
      "get_block",
      {
        title: "Get a SunUI block",
        description:
          "Full details for one block: when to use it, what to watch out for, dependencies, preview URL and the exact install command (plus Pro setup when needed). Set include_source to read a free block's code before deciding.",
        inputSchema: z.object({
          name: z.string().describe("Block name from search_blocks, e.g. 'coupon-wallet'."),
          include_source: z.boolean().default(false).describe("Free blocks only. Adds the source files."),
        }),
        annotations: readOnly,
      },
      async ({ name, include_source }) => {
        const item = getItem(name.replace(/^@sunui(-pro)?\//, "").replace(/\.json$/, ""));
        if (!item) {
          const close = suggestNames(name);
          return {
            ...text(`No SunUI block named "${name}".${close.length ? ` Closest: ${close.join(", ")}.` : ""}`),
            isError: true,
          };
        }
        let body = describeBlock(item);
        if (include_source) {
          if (item.meta.tier === "pro") {
            body += "\n\nSource is not available here for Pro blocks. Install it with a license instead.";
          } else {
            const built = await buildRegistryItem(item);
            body += `\n\n## Source\n\n${built.files
              .map((f) => `### ${f.path}\n\n\`\`\`tsx\n${f.content}\n\`\`\``)
              .join("\n\n")}`;
          }
        }
        return text(body);
      },
    );

    server.registerTool(
      "plan_install",
      {
        title: "Plan a SunUI install",
        description:
          "Turn a list of block names into the fewest shadcn commands (one for free, one for Pro), with npm dependencies and Pro setup steps. Run the commands in the user's project root.",
        inputSchema: z.object({
          names: z.array(z.string()).min(1).max(30).describe("Block names, e.g. ['countdown-banner', 'coupon-claim-card']."),
        }),
        annotations: readOnly,
      },
      async ({ names }) => {
        const plan = planInstall(names);
        const lines = [
          plan.found.length ? `Blocks: ${plan.found.map((i) => `${i.name} (${i.meta.tier})`).join(", ")}` : "No known blocks.",
          plan.missing.length
            ? `Unknown: ${plan.missing.map((m) => `${m}${suggestNames(m).length ? ` (did you mean ${suggestNames(m).join(", ")}?)` : ""}`).join("; ")}`
            : null,
          plan.commands.length ? ["Run:", "```bash", ...plan.commands, "```"].join("\n") : null,
          plan.npmDependencies.length ? `The CLI also installs: ${plan.npmDependencies.join(", ")}.` : null,
          plan.needsPro ? proSetup() : null,
        ];
        return {
          ...text(lines.filter(Boolean).join("\n\n")),
          structuredContent: {
            commands: plan.commands,
            npmDependencies: plan.npmDependencies,
            needsPro: plan.needsPro,
            missing: plan.missing,
          },
        };
      },
    );

    server.registerTool(
      "get_design_rules",
      {
        title: "SunUI design rules",
        description:
          "Color, shape, type and motion rules for a series. Read them before editing a block or building UI around blocks, so the page stays consistent (no gradients, one accent, motion only on user action, reduced motion kept).",
        inputSchema: z.object({ series: series.optional().describe("Omit for all series.") }),
        annotations: readOnly,
      },
      async ({ series }) => text(designRules(series)),
    );

    server.registerResource(
      "design-rules",
      "sunui://design-rules",
      { title: "SunUI design rules", mimeType: "text/markdown" },
      async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: designRules() }] }),
    );

    server.registerResource(
      "catalog",
      "sunui://catalog",
      { title: "SunUI block catalog", description: "Every block grouped by series.", mimeType: "text/markdown" },
      async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: catalogMarkdown() }] }),
    );

    server.registerResource(
      "skill",
      "sunui://skill",
      { title: "SunUI agent skill (SKILL.md)", mimeType: "text/markdown" },
      async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: skillMarkdown() }] }),
    );

    server.registerPrompt(
      "build_page",
      {
        title: "Build a page with SunUI",
        description: "Plan and build a commerce or campaign page from SunUI blocks.",
        argsSchema: z.object({ brief: z.string().describe("What the page is for, e.g. 'Double 11 sale landing page'.") }),
      },
      ({ brief }) => ({
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: [
                `Build this with SunUI blocks: ${brief}`,
                "",
                "1. List the sections the page needs, top to bottom.",
                "2. For each section call search_blocks, then get_block on the best one or two, and keep a block only if its 'When to use' fits.",
                "3. Call plan_install with the chosen names and run the commands in the project root.",
                "4. Call get_design_rules for the series you used, then compose the page: real copy, real data hooks, no extra gradients, glows or entrance animations.",
                "5. Check light and dark mode, 375px width, and reduced motion.",
              ].join("\n"),
            },
          },
        ],
      }),
    );
  },
  {
    serverInfo: { name: "sunui", version: "1.0.0" },
    instructions: `SunUI: ${getItems().length} paper-feel React + Tailwind blocks for commerce and campaign pages, installed with the shadcn CLI. Workflow: search_blocks, then get_block, then plan_install, then get_design_rules before editing. Free blocks are MIT; Pro blocks need SUNUI_LICENSE_KEY. Never invent block names. Docs: ${siteUrl()}/docs/ai-agents`,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
