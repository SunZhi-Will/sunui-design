"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ScaledPreview } from "@/components/scaled-preview";
import { TierBadge } from "@/components/tier-badge";
import { interactionLabels } from "@/lib/interactions";
import type { Interaction, RegistryItem, Tier } from "@/lib/registry";
import { cn } from "@/lib/utils";

export type CatalogItem = Pick<RegistryItem, "name" | "title" | "description" | "meta" | "categories">;

export function Catalog({ items }: { items: CatalogItem[] }) {
  const [interaction, setInteraction] = useState<Interaction | "all">("all");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const map = new Map<Interaction, number>();
    for (const item of items) map.set(item.meta.interaction, (map.get(item.meta.interaction) ?? 0) + 1);
    return map;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (interaction !== "all" && item.meta.interaction !== interaction) return false;
      if (tier !== "all" && item.meta.tier !== tier) return false;
      if (!q) return true;
      const haystack = [item.title, item.description, item.name, ...(item.categories ?? [])].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [items, interaction, tier, query]);

  return (
    <section aria-label="Blocks">
      <div className="mb-6 grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 sm:max-w-xs">
            <span className="sr-only">Search blocks</span>
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search blocks, e.g. coupon, cart, countdown"
              className="w-full rounded-full border border-line bg-card py-2 pr-4 pl-9 text-sm outline-none placeholder:text-subtle focus-visible:border-accent"
            />
          </label>
          <div role="group" aria-label="Filter by plan" className="flex rounded-full border border-line p-0.5 text-sm">
            {(["all", "free", "pro"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={tier === value}
                onClick={() => setTier(value)}
                className={cn(
                  "rounded-full px-3 py-1 capitalize transition-colors",
                  tier === value ? "bg-fg text-bg" : "text-subtle hover:text-fg",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div role="group" aria-label="Filter by interaction" className="flex flex-wrap gap-2">
          <FilterChip active={interaction === "all"} onClick={() => setInteraction("all")} label="All" count={items.length} />
          {(Object.keys(interactionLabels) as Interaction[]).map((key) => (
            <FilterChip
              key={key}
              active={interaction === key}
              onClick={() => setInteraction(key)}
              label={interactionLabels[key]}
              count={counts.get(key) ?? 0}
            />
          ))}
        </div>
      </div>

      <p className="mb-4 text-sm text-subtle" aria-live="polite">
        {visible.length} {visible.length === 1 ? "block" : "blocks"}
      </p>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <li
            key={item.name}
            className="group relative overflow-hidden rounded-2xl border border-line bg-card transition-colors focus-within:border-accent hover:border-accent/60"
          >
            {/* 預覽不包在連結裡：block 自己也可能有連結，巢狀 <a> 不合法 */}
            <ScaledPreview name={item.name} />
            <div className="flex items-start justify-between gap-3 border-t border-line p-4">
              <div className="min-w-0">
                <h3 className="font-medium tracking-tight">
                  <Link href={`/blocks/${item.name}`} className="outline-none after:absolute after:inset-0">
                    {item.title}
                  </Link>
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-subtle">{item.description}</p>
              </div>
              <TierBadge tier={item.meta.tier} />
            </div>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-subtle">
          No blocks match. Try another word or clear the filters.
        </p>
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
        active ? "border-fg bg-fg text-bg" : "border-line text-subtle hover:text-fg",
      )}
    >
      {label}
      <span className={cn("text-xs tabular-nums", active ? "opacity-70" : "opacity-60")}>{count}</span>
    </button>
  );
}
