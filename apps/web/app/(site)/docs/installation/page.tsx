import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { Command } from "@/components/command";
import { RichText } from "@/components/rich-text";
import { getI18n } from "@/lib/i18n-server";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.docsInstall.title, description: m.docsInstall.metaDescription };
}

export default async function InstallationPage() {
  const { m } = await getI18n();
  const t = m.docsInstall;
  return (
    <>
      <h1>{t.title}</h1>
      <p>{t.lead}</p>

      <h2>{t.step1Title}</h2>
      <p>
        <RichText text={t.step1Body} />
      </p>
      <div className="block-gap">
        <Command value="npx shadcn@latest init" />
      </div>

      <h2>{t.step2Title}</h2>
      <p>{t.step2Body}</p>
      <div className="block-gap">
        <Command value={`npx shadcn@latest add ${siteUrl()}/r/countdown-banner.json`} />
      </div>
      <p>
        <RichText text={t.step2After} />
      </p>

      <h2>{t.step3Title}</h2>
      <p>{t.step3Body}</p>
      <div className="block-gap">
        <CodeBlock
          lang="json"
          title="components.json"
          code={JSON.stringify({ registries: { "@sunui": `${siteUrl()}/r/{name}.json` } }, null, 2)}
        />
      </div>
      <div className="block-gap">
        <Command value="npx shadcn@latest add @sunui/countdown-banner" />
      </div>

      <h2>{t.manualTitle}</h2>
      <p>
        <RichText text={t.manualBody} />
      </p>
    </>
  );
}
