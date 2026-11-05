import type { Metadata } from "next";
import Link from "next/link";

import { TierBadge } from "@/components/tier-badge";
import { getI18n } from "@/lib/i18n-server";
import { intlLocale } from "@/lib/messages";
import { getItems } from "@/lib/registry";
import { localizeItem } from "@/lib/registry-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.docsChangelog.title, description: m.docsChangelog.metaDescription };
}

export default async function ChangelogPage() {
  const { locale, m } = await getI18n();
  const dateFormat = new Intl.DateTimeFormat(intlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const groups = new Map<string, ReturnType<typeof getItems>>();
  for (const item of getItems()) {
    groups.set(item.meta.addedAt, [...(groups.get(item.meta.addedAt) ?? []), localizeItem(item, locale)]);
  }
  const dates = [...groups.keys()].sort().reverse();

  return (
    <>
      <h1>{m.docsChangelog.title}</h1>
      <p>{m.docsChangelog.lead}</p>
      {dates.map((date) => (
        <section key={date}>
          <h2>{dateFormat.format(new Date(`${date}T00:00:00Z`))}</h2>
          <ul className="!list-none !pl-0">
            {groups.get(date)!.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-3">
                <Link href={`/blocks/${item.name}`}>{item.title}</Link>
                <TierBadge tier={item.meta.tier} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
