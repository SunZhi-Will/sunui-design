import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { TierBadge } from "@/components/tier-badge";
import { getI18n } from "@/lib/i18n-server";
import { mediaUrl } from "@/lib/media";
import { intlLocale } from "@/lib/messages";
import { getItems } from "@/lib/registry";
import { localizeItem } from "@/lib/registry-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.docsChangelog.title, description: m.docsChangelog.metaDescription };
}

const hasPoster = (name: string) => existsSync(path.join(process.cwd(), "public/og/blocks", `${name}.jpg`));

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
          {/* 每個區塊一張縮圖卡：這一頁要讓人一眼看到每週真的有新東西。60px 的小圖試過，深色預覽圖縮到那麼小只剩一塊黑 */}
          <ul className="!mt-4 !grid-cols-2 !list-none !gap-x-3 !gap-y-5 !pl-0 sm:!grid-cols-3">
            {groups.get(date)!.map((item) => (
              <li key={item.name} className="min-w-0">
                <Link href={`/blocks/${item.name}`} className="group block !no-underline">
                  <span className="relative block aspect-[5/4] overflow-hidden rounded-lg bg-[#0e0e0e] shadow-e1 transition-shadow group-hover:shadow-e2">
                    {hasPoster(item.name) && (
                      <Image src={mediaUrl(`/og/blocks/${item.name}.jpg`)} alt="" fill sizes="(min-width: 640px) 220px, 45vw" className="object-cover" />
                    )}
                  </span>
                  <span className="mt-2 flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-medium text-fg">{item.title}</span>
                    <TierBadge tier={item.meta.tier} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
