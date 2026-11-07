"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Tier } from "@/lib/registry";
import { cn } from "@/lib/utils";

export type SuggestItem = { name: string; title: string; tier: Tier; aliases: string[] };

const words = (s: string) =>
  decodeURIComponent(s)
    .toLowerCase()
    .split(/[^a-z0-9぀-ヿ一-鿿]+/)
    .filter((w) => w.length > 1);

/** 用網址最後一段跟 block 名稱、標題、別名比對，取最像的幾個。 */
function rank(path: string, items: SuggestItem[]) {
  const last = path.split("/").filter(Boolean).pop() ?? "";
  const query = words(last);
  if (query.length === 0) return [];
  return items
    .map((item) => {
      const hay = words([item.name, item.title, ...item.aliases].join(" "));
      const score = query.reduce(
        (sum, q) => sum + (hay.includes(q) ? 3 : hay.some((h) => h.startsWith(q) || q.startsWith(h)) ? 1 : 0),
        0,
      );
      return { item, score };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, 3)
    .map((hit) => hit.item);
}

export function NotFoundSuggestions({
  items,
  labels,
}: {
  items: SuggestItem[];
  labels: { tried: string; suggest: string; tier: Record<Tier, string> };
}) {
  const pathname = usePathname();
  const hits = rank(pathname, items);

  return (
    <>
      <p className="mt-6 text-xs text-subtle">
        {labels.tried} <code className="rounded bg-stage px-1.5 py-0.5 font-mono text-fg">{pathname}</code>
      </p>
      {hits.length > 0 && (
        <div className="mx-auto mt-10 w-full max-w-md text-left">
          <p className="mb-2 text-xs font-medium text-subtle">{labels.suggest}</p>
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-card">
            {hits.map((item) => (
              <li key={item.name}>
                <Link
                  href={`/blocks/${item.name}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-stage"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.title}</span>
                    <span className="block truncate font-mono text-xs text-subtle">{item.name}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                      item.tier === "pro" ? "bg-accent text-accent-fg" : "bg-stage text-subtle",
                    )}
                  >
                    {labels.tier[item.tier]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
