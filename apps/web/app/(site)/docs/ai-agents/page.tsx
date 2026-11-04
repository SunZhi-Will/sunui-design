import type { Metadata } from "next";

import { Command } from "@/components/command";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI agents and MCP",
  description: "Let Claude Code, Cursor or Codex install SunUI blocks through the shadcn MCP server.",
};

export default function AiAgentsPage() {
  return (
    <>
      <h1>AI agents and MCP</h1>
      <p>
        SunUI is a standard shadcn registry, so AI coding agents can search and install blocks through the shadcn MCP
        server. Every block description is written for agents: what it does, when to use it and how it behaves with
        reduced motion.
      </p>

      <h2>Set up the shadcn MCP server</h2>
      <p>Run this in your project, then pick your client (Claude Code, Cursor, VS Code or Codex).</p>
      <div className="block-gap">
        <Command value="npx shadcn@latest mcp init" />
      </div>

      <h2>Ask in plain words</h2>
      <ul>
        <li>&ldquo;Add the SunUI countdown banner to the home page for our Black Friday sale.&rdquo;</li>
        <li>&ldquo;Build a Double 11 landing page with @sunui-pro flash-sale-hero, coupon-claim-card and cart-drawer.&rdquo;</li>
      </ul>
      <p>
        Pro installs work from agents too, as long as <code>SUNUI_LICENSE_KEY</code> is set. Without it, the agent sees
        a clear message explaining how to get a license.
      </p>

      <h2>For LLMs</h2>
      <p>
        A plain text index of every block lives at <a href={`${siteUrl()}/llms.txt`}>/llms.txt</a>.
      </p>
    </>
  );
}
