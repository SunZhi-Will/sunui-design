import type { Metadata } from "next";
import Link from "next/link";

import { getI18n } from "@/lib/i18n-server";
import { getItems } from "@/lib/registry";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.docsIntro.title, description: m.docsIntro.metaDescription };
}

export default async function DocsIntroPage() {
  const { m } = await getI18n();
  const t = m.docsIntro;
  const items = getItems();
  const pro = items.filter((item) => item.meta.tier === "pro").length;

  return (
    <>
      <h1>{t.title}</h1>
      <p>{t.p1(items.length, items.length - pro, pro)}</p>
      <p>{t.p2}</p>

      <h2>{t.principlesTitle}</h2>
      <ul>
        {t.principles.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h2>{t.nextTitle}</h2>
      <ul>
        <li>
          <Link href="/docs/installation">{t.nextInstall}</Link>
        </li>
        <li>
          <Link href="/docs/pro">{t.nextPro}</Link>
        </li>
        <li>
          <Link href="/docs/ai-agents">{t.nextAgents}</Link>
        </li>
      </ul>
    </>
  );
}
