"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { LivePreview } from "@/components/live-preview";
import { format, type Locale } from "@/lib/i18n";
import type { Tier } from "@/lib/registry";

export type RelatedCard = { name: string; title: string; tier: Tier };

/** 區塊頁底部的相似區塊：跟首頁型錄同一種卡片，元件以原尺寸即時跑、可以直接操作。 */
export function RelatedBlocks({
  items,
  locale,
  heading,
  labels,
}: {
  items: RelatedCard[];
  locale: Locale;
  heading: string;
  labels: { livePreview: string; expand: string; pro: string };
}) {
  const router = useRouter();
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="related-title" className="mt-16">
      <h2 id="related-title" className="mb-4 text-lg font-semibold tracking-tight">
        {heading}
      </h2>
      <ul className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const href = `/blocks/${item.name}`;
          return (
            <li key={item.name} className="group">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[20px] bg-card ring-1 ring-line/70 transition-shadow group-hover:ring-line">
                <LivePreview
                  name={item.name}
                  title={format(labels.livePreview, { title: item.title })}
                  locale={locale}
                  onExpand={() => router.push(href)}
                />
                {item.tier === "pro" && (
                  <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-fg px-2 py-0.5 text-[11px] font-medium text-bg">
                    {labels.pro}
                  </span>
                )}
                <Link
                  href={href}
                  aria-hidden="true"
                  tabIndex={-1}
                  title={labels.expand}
                  className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-fg/90 text-bg opacity-0 shadow-sm transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                    <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
                  </svg>
                </Link>
              </div>
              <h3 className="mt-3 px-1 text-sm font-medium tracking-tight">
                <Link
                  href={href}
                  className="rounded-sm text-subtle transition-colors outline-none group-hover:text-fg hover:text-fg focus-visible:text-fg focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {item.title}
                </Link>
              </h3>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
