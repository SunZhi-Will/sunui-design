import type { Metadata } from "next";

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
  return (
    <>
      <h1>{t.title}</h1>
      <p>{t.lead}</p>

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
        <RichText text={t.llmsBody(`${siteUrl()}/llms.txt`)} />
      </p>
    </>
  );
}
