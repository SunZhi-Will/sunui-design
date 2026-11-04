import type { Metadata } from "next";
import Link from "next/link";

import { TierBadge } from "@/components/tier-badge";
import { getItems } from "@/lib/registry";

export const metadata: Metadata = { title: "Changelog", description: "New SunUI blocks, week by week." };

const dateFormat = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export default function ChangelogPage() {
  const groups = new Map<string, ReturnType<typeof getItems>>();
  for (const item of getItems()) {
    groups.set(item.meta.addedAt, [...(groups.get(item.meta.addedAt) ?? []), item]);
  }
  const dates = [...groups.keys()].sort().reverse();

  return (
    <>
      <h1>Changelog</h1>
      <p>New blocks ship every week. Pro licenses include all of them.</p>
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
