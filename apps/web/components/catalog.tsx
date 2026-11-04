"use client";

import Link from "next/link";
import { useState } from "react";

import { ScaledPreview } from "@/components/scaled-preview";
import { TierBadge } from "@/components/tier-badge";
import { interactionLabels } from "@/lib/interactions";
import type { Interaction, RegistryItem } from "@/lib/registry";
import { cn } from "@/lib/utils";

type CatalogItem = Pick<RegistryItem, "name" | "title" | "description" | "meta">;

export function Catalog({ items }: { items: CatalogItem[] }) {
  const [filter, setFilter] = useState<Interaction | "all">("all");

  const counts = new Map<Interaction, number>();
  for (const item of items) {
    counts.set(item.meta.interaction, (counts.get(item.meta.interaction) ?? 0) + 1);
  }

  const visible = filter === "all" ? items : items.filter((item) => item.meta.interaction === filter);

  return (
    <section aria-label="Blocks">
      <div role="group" aria-label="Filter by interaction" className="mb-6 flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" count={items.length} />
        {(Object.keys(interactionLabels) as Interaction[]).map((key) => (
          <FilterChip
            key={key}
            active={filter === key}
            onClick={() => setFilter(key)}
            label={interactionLabels[key]}
            count={counts.get(key) ?? 0}
          />
        ))}
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <li key={item.name}>
            <Link
              href={`/blocks/${item.name}`}
              className="group block overflow-hidden rounded-2xl border border-line bg-card transition-colors hover:border-accent/60 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <ScaledPreview name={item.name} />
              <div className="flex items-start justify-between gap-3 border-t border-line p-4">
                <div className="min-w-0">
                  <h3 className="font-medium tracking-tight">{item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{item.description}</p>
                </div>
                <TierBadge tier={item.meta.tier} />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          {filter !== "all" ? `${interactionLabels[filter]} blocks are on the way.` : "No blocks yet."}
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
        active ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg",
      )}
    >
      {label}
      <span className={cn("text-xs tabular-nums", active ? "opacity-70" : "opacity-60")}>{count}</span>
    </button>
  );
}
