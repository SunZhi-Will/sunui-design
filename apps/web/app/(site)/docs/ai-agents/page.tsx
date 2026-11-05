import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { Command } from "@/components/command";
import { RichText } from "@/components/rich-text";
import { getI18n } from "@/lib/i18n-server";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.docsAgents.title, description: m.docsAgents.metaDescription };
}

export default async function AiAgentsPage() {
  const { m } = await getI18n();
  const t = m.docsAgents;
  const base = siteUrl();
  const mcpUrl = `${base}/mcp`;
  const mcpJson = JSON.stringify({ mcpServers: { sunui: { type: "http", url: mcpUrl } } }, null, 2);

  return (
    <>
      <h1>{t.title}</h1>
      <p>{t.lead}</p>

      <h2>{t.mcpTitle}</h2>
      <p>
        <RichText text={t.mcpBody} />
      </p>
      <div className="block-gap">
        <Command value={`claude mcp add --transport http sunui ${mcpUrl}`} />
      </div>
      <p>{t.mcpOtherClients}</p>
      <div className="block-gap">
        <CodeBlock code={mcpJson} lang="json" title=".mcp.json" />
      </div>
      <ul>
        {t.mcpTools.map((line) => (
          <li key={line}>
            <RichText text={line} />
          </li>
        ))}
      </ul>

      <h2>{t.skillTitle}</h2>
      <p>
        <RichText text={t.skillBody} />
      </p>
      <div className="block-gap">
        <Command value={`npx shadcn@latest add ${base}/r/sunui-skill.json`} />
      </div>
      <p>
        <RichText text={t.skillManual(`${base}/skills/sunui/SKILL.md`)} />
      </p>

      <h2>{t.setupTitle}</h2>
      <p>{t.setupBody}</p>
      <div className="block-gap">
        <Command value="npx shadcn@latest mcp init" />
      </div>

      <h2>{t.askTitle}</h2>
      <ul>
        {t.asks.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p>
        <RichText text={t.proNote} />
      </p>

      <h2>{t.llmsTitle}</h2>
      <p>
        <RichText text={t.llmsBody(`${base}/llms.txt`, `${base}/llms-full.txt`)} />
      </p>
    </>
  );
}
