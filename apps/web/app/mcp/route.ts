import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import { blockLine, catalogMarkdown, describeBlock, planInstall, proSetup, searchBlocks, suggestNames } from "@/lib/agent/catalog";
import { designRules } from "@/lib/agent/guidelines";
import { findIcon, iconLibraryUsage, iconSetsSummary, proIconUsage, renderIcon, searchIcons, suggestIcons } from "@/lib/agent/icons";
import { skillMarkdown } from "@/lib/agent/skill";
import { buildRegistryItem, fileLang, getItem, getItems } from "@/lib/registry";
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
              .filter((f, i, all) => all.findIndex((g) => g.path === f.path) === i)
              .map((f) => `### ${f.target ?? f.path}\n\n\`\`\`${fileLang(f.path)}\n${f.content}\n\`\`\``)
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

    server.registerTool(
      "search_icons",
      {
        title: "Search SunUI icons",
        description:
          "Find a SunUI icon by meaning, described in plain words the way you would to a designer: 'claimed coupon', 'free shipping', 'loyalty stamp card', 'dark mode'. English, Chinese or Japanese. Tolerates plurals and one typo, and ranks the base icon above its variants (stamp above stamp-check). Pass a returned name to get_icon. weak: true means nothing matched well: try other words, or call with no query to browse a group. Results marked [Pro] come from SunUI Pro seasonal packs (Lunar New Year and later seasons): they install with a license key, so pass tier: 'free' when the user has none. Use these icons instead of drawing new SVG so blocks keep one look.",
        inputSchema: z.object({
          query: z.string().max(200).optional().describe("What the icon should mean, e.g. 'redeem voucher'. Omit to list a group."),
          style: z.enum(["line", "pixel"]).optional().describe("line: 24px stroke icons (default look). pixel: 16px sprites for retro or game-style screens. One style per screen."),
          group: z.string().optional().describe("Group id from the list returned with no query, e.g. 'paper', 'commerce', 'pixel-gear', 'pro-lunar-new-year'."),
          tier: z.enum(["free", "pro", "any"]).default("any").describe("free: only icons anyone can paste. pro: SunUI Pro seasonal packs (need a license). any: both, free ranked first."),
          limit: z.number().int().min(1).max(50).default(10),
        }),
        annotations: readOnly,
      },
      async (args) => {
        const { weak, results } = searchIcons(args);
        if (!args.query) {
          if (!args.group) return text(iconSetsSummary());
          if (results.length === 0) return { ...text(`No icon group "${args.group}". Call search_icons with no arguments to list groups.`), isError: true };
        }
        if (results.length === 0) {
          return text(`No SunUI icon matches "${args.query}". Try another wording, or browse a group (call with no query). If nothing fits, draw it on the same grid: get_design_rules covers the icon spec.`);
        }
        const lines = results.map(
          (h) => `- ${h.name}${h.tier === "pro" ? " [Pro]" : ""} (${h.styles.join(" + ")}, ${h.groupTitle})${h.keywords.length ? `: ${h.keywords.join(" ")}` : ""}`,
        );
        return {
          ...text([weak ? "Weak match: no icon fits every word. Closest:" : `${results.length} result(s):`, ...lines].join("\n")),
          structuredContent: {
            weak,
            results: results.map(({ name, styles, group, keywords, score, matchedAllWords, tier }) => ({ name, styles, group, keywords, score, matchedAllWords, tier })),
          },
        };
      },
    );

    server.registerTool(
      "get_icon",
      {
        title: "Get a SunUI icon",
        description:
          "One SunUI icon as ready-to-paste code: a standalone SVG string or a typed React (TSX) component, plus how to install the whole icon set when you need several. Use an exact name from search_icons. Colors follow currentColor; the one accent part follows --sunui-icon-accent unless you pass accent. SunUI Pro icons ([Pro] in search_icons) return install steps instead of code.",
        inputSchema: z.object({
          name: z.string().min(1).max(60).describe("Exact icon name, kebab-case, e.g. 'stamp-check'."),
          style: z.enum(["line", "pixel"]).default("line"),
          format: z.enum(["svg", "tsx"]).default("svg").describe("svg: an <svg> string. tsx: an exported React component."),
          size: z.number().int().min(12).max(512).optional().describe("px. Default 24 for line, 16 for pixel (use multiples of 16 for pixel)."),
          stroke: z.number().min(1).max(2.5).default(1.5).describe("Line only. 1.5 is the house stroke; 1.25 above 32px."),
          color: z.string().max(64).optional().describe("CSS color. Omit to inherit currentColor."),
          accent: z.string().max(64).optional().describe("CSS color for the single accent part. Omit to follow --sunui-icon-accent (ink when unset)."),
          tone: z.enum(["ink", "pigment"]).default("ink").describe("Pixel only. pigment gives objects with a real color (potion, coin, gem) a muted hue."),
        }),
        annotations: readOnly,
      },
      async ({ name, style, format, size, stroke, color, accent, tone }) => {
        const entry = findIcon(name, style);
        if (!entry) {
          const other = findIcon(name, style === "line" ? "pixel" : "line");
          const close = suggestIcons(name, style);
          return {
            ...text(
              `No ${style} icon named "${name}".${other ? ` It exists as a ${other.style} icon: pass style "${other.style}".` : ""}${close.length ? ` Closest: ${close.join(", ")}.` : ""}`,
            ),
            isError: true,
          };
        }
        if (entry.tier === "pro") return text(proIconUsage(entry));
        const code = renderIcon(entry, { format, size: size ?? (style === "pixel" ? 16 : 24), stroke, color, accent, tone });
        return text(`\`\`\`${format === "tsx" ? "tsx" : "svg"}\n${code}\n\`\`\`\n\n${iconLibraryUsage(entry)}`);
      },
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
        description: "Plan and build a page from SunUI blocks: store, campaign, launch or product page.",
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
    instructions: `SunUI: ${getItems().length} paper-feel animated React + Tailwind blocks, installed with the shadcn CLI. Deepest for stores and campaign pages; also heroes, navigation, charts, theme switches and motion effects for any product page. Workflow: search_blocks, then get_block, then plan_install, then get_design_rules before editing. For icons use search_icons then get_icon instead of drawing new SVG. Free blocks are MIT; Pro blocks need SUNUI_LICENSE_KEY. Never invent block names. Docs: ${siteUrl()}/docs/ai-agents`,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
