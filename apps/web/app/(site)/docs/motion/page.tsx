import type { Metadata } from "next";

import { Command } from "@/components/command";
import { MotionDictionary, type DictionaryGroup } from "@/components/motion-dictionary";
import { RichText } from "@/components/rich-text";
import { motionGroups, motionPageCopy, motionSources } from "@/content/motion-dictionary";
import { getI18n } from "@/lib/i18n-server";
import { motionLibName } from "@/lib/motion-lib";
import { getItem } from "@/lib/registry";
import { localizeItem } from "@/lib/registry-i18n";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const t = motionPageCopy[locale];
  return { title: t.title, description: t.metaDescription };
}

export default async function MotionPage() {
  const { locale } = await getI18n();
  const t = motionPageCopy[locale];

  // 只連到真的存在的 block：公開 repo 沒有 Pro、block 被合併或改名時自動略過
  const groups: DictionaryGroup[] = motionGroups.map((group) => ({
    id: group.id,
    title: group.title[locale],
    entries: group.entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      localName: locale === "en" ? null : entry.names[locale],
      aliases: entry.aliases ?? [],
      verdict: entry.verdict,
      how: entry.how[locale],
      blocks: (entry.blocks ?? []).flatMap((name) => {
        const item = getItem(name);
        return item ? [{ name, title: localizeItem(item, locale).title }] : [];
      }),
      planned: entry.planned && !getItem(entry.planned) ? entry.planned : null,
      demo: entry.demo ?? null,
    })),
  }));

  return (
    <>
      <h1>{t.title}</h1>
      <p>{t.lead}</p>

      <h2>{t.rulesTitle}</h2>
      <ol>
        {t.rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ol>
      <ul>
        {(["allow", "limit", "avoid"] as const).map((v) => (
          <li key={v}>
            <strong className="text-fg">{t.legend[v].label}</strong>: {t.legend[v].body}
          </li>
        ))}
      </ul>

      <MotionDictionary groups={groups} copy={t} />

      <h2>{t.libTitle}</h2>
      <p>
        <RichText text={t.libBody} />
      </p>
      <div className="block-gap">
        <Command value={`npx shadcn@latest add ${siteUrl()}/r/${motionLibName}.json`} />
      </div>
      <p>
        <RichText text={t.libUsage} />
      </p>

      <h2>{t.sourcesTitle}</h2>
      <p>{t.sourcesBody}</p>
      <ul>
        {motionSources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.name}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
