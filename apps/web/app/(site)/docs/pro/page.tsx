import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { Command } from "@/components/command";
import { RichText } from "@/components/rich-text";
import { getI18n } from "@/lib/i18n-server";
import { proRegistryConfig } from "@/lib/registry";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.docsPro.title, description: m.docsPro.metaDescription };
}

export default async function ProDocsPage() {
  const { m } = await getI18n();
  const t = m.docsPro;
  return (
    <>
      <h1>{t.title}</h1>
      <p>{t.lead}</p>

      <h2>{t.step1Title}</h2>
      <p>
        <RichText text={t.step1Body} />
      </p>

      <h2>{t.step2Title}</h2>
      <div className="block-gap">
        <CodeBlock code={proRegistryConfig()} lang="json" title="components.json" />
      </div>

      <h2>{t.step3Title}</h2>
      <p>
        <RichText text={t.step3Body} />
      </p>
      <div className="block-gap">
        <Command value="SUNUI_LICENSE_KEY=your-license-key" />
      </div>

      <h2>{t.step4Title}</h2>
      <div className="block-gap">
        <Command value="npx shadcn@latest add @sunui-pro/flash-sale-hero" />
      </div>

      <h2>{t.troubleTitle}</h2>
      <ul>
        {t.trouble.map((line) => (
          <li key={line}>
            <RichText text={line} />
          </li>
        ))}
      </ul>
      <p>
        <RichText text={t.ci} />
      </p>
    </>
  );
}
