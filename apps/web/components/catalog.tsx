"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { BlockCard } from "@/components/block-card";
import { format, type Locale } from "@/lib/i18n";
import type { Messages } from "@/lib/messages";
import type { Interaction, RegistryItem, Series, Tier } from "@/lib/registry";
import { seriesOf } from "@/lib/series";
import { cn } from "@/lib/utils";

const seriesKeys: Series[] = ["paper", "product", "story", "showcase", "motion"];
const interactionKeys: Interaction[] = ["press", "hover", "drag", "type", "loading", "scroll", "section"];

/** title、description 已換成目前語言；search 保留英文標題與描述，讓英文關鍵字也搜得到。 */
export type CatalogItem = Pick<RegistryItem, "name" | "title" | "description" | "meta" | "categories"> & {
  search: string;
};

export type CatalogMessages = Pick<Messages, "catalog" | "interactions" | "series" | "tier">;

export function Catalog({ items, locale, messages }: { items: CatalogItem[]; locale: Locale; messages: CatalogMessages }) {
  const { catalog: t, interactions: interactionLabels, series: seriesText, tier: tierLabels } = messages;
  const [interaction, setInteraction] = useState<Interaction | "all">("all");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [series, setSeries] = useState<Series | "all">("all");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const cardLabels = { livePreview: t.livePreview, expand: t.expand, pro: tierLabels.pro };

  // 區塊頁的「Also called」連結以 ?q= 帶入搜尋字，系列標籤以 ?series= 帶入
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setQuery(q);
    const s = params.get("series");
    if (s && (seriesKeys as string[]).includes(s)) setSeries(s as Series);
    // 篩選後清單變短，瀏覽器先前的錨點跳轉會落在頁尾，篩完再對準一次
    if (window.location.hash === "#blocks") {
      setTimeout(() => document.getElementById("blocks")?.scrollIntoView(), 0);
    }
  }, []);

  // 按 / 聚焦搜尋框；正在其他輸入框打字時不攔截
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = query.trim() !== "" || interaction !== "all" || tier !== "all" || series !== "all";
  const reset = () => {
    setQuery("");
    setInteraction("all");
    setTier("all");
    setSeries("all");
  };

  // 互動數字跟著目前的系列與方案篩選，避免顯示點下去才發現是 0 的數字
  const scoped = useMemo(
    () =>
      items.filter(
        (item) => (tier === "all" || item.meta.tier === tier) && (series === "all" || seriesOf(item) === series),
      ),
    [items, tier, series],
  );

  const counts = useMemo(() => {
    const map = new Map<Interaction, number>();
    for (const item of scoped) map.set(item.meta.interaction, (map.get(item.meta.interaction) ?? 0) + 1);
    return map;
  }, [scoped]);

  const seriesCounts = useMemo(() => {
    const map = new Map<Series, number>();
    for (const item of items) map.set(seriesOf(item), (map.get(seriesOf(item)) ?? 0) + 1);
    return map;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (interaction !== "all" && item.meta.interaction !== interaction) return false;
      if (tier !== "all" && item.meta.tier !== tier) return false;
      if (series !== "all" && seriesOf(item) !== series) return false;
      if (!q) return true;
      const haystack = [
        item.title,
        item.description,
        item.search,
        item.name,
        ...(item.categories ?? []),
        ...(item.meta.usage?.aliases ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, interaction, tier, series, query]);

  return (
    <section id="blocks" aria-label={t.sectionLabel} className="scroll-mt-24">
      <div className="mb-6 grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 sm:max-w-xs">
            <span className="sr-only">{t.searchLabel}</span>
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
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              aria-keyshortcuts="/"
              className="peer w-full rounded-full border border-line bg-card py-2 pr-10 pl-9 text-sm outline-none placeholder:text-subtle focus-visible:border-accent"
            />
            <kbd
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-line px-1.5 font-mono text-[11px] text-subtle peer-focus:hidden"
            >
              /
            </kbd>
          </label>
          <div role="group" aria-label={t.filterPlan} className="flex rounded-full border border-line p-0.5 text-sm">
            {(["all", "free", "pro"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={tier === value}
                onClick={() => setTier(value)}
                className={cn(
                  "rounded-full px-3 py-1 transition-colors",
                  tier === value ? "bg-fg text-bg" : "text-subtle hover:text-fg",
                )}
              >
                {value === "all" ? t.tierAll : tierLabels[value]}
              </button>
            ))}
          </div>
        </div>

        <div role="group" aria-label={t.filterSeries} className="flex flex-wrap items-center gap-2">
          <FilterChip active={series === "all"} onClick={() => setSeries("all")} label={t.allSeries} count={items.length} />
          {/* 數量為 0 的系列不顯示，避免看起來像沒做完；若網址直接帶入該系列則保留 */}
          {seriesKeys.filter((key) => (seriesCounts.get(key) ?? 0) > 0 || series === key).map((key) => (
            <FilterChip
              key={key}
              active={series === key}
              onClick={() => setSeries(key)}
              label={seriesText.labels[key]}
              count={seriesCounts.get(key) ?? 0}
            />
          ))}
          {series !== "all" && <p className="text-sm text-subtle">{seriesText.descriptions[series]}</p>}
        </div>

        <div role="group" aria-label={t.filterInteraction} className="flex flex-wrap gap-2">
          <FilterChip active={interaction === "all"} onClick={() => setInteraction("all")} label={t.allInteractions} count={scoped.length} />
          {interactionKeys.map((key) => (
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

      <div className="mb-4 flex items-center gap-3 text-sm text-subtle">
        <p aria-live="polite">
          {visible.length === 1 ? t.countOne : format(t.count, { n: visible.length })}
        </p>
        {filtered && (
          <button type="button" onClick={reset} className="underline-offset-4 hover:text-fg hover:underline">
            {t.clearFilters}
          </button>
        )}
      </div>

      <ul className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <BlockCard
            key={item.name}
            name={item.name}
            title={item.title}
            tier={item.meta.tier}
            locale={locale}
            labels={cardLabels}
          />
        ))}
      </ul>

      {visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-subtle">
          <p>{t.empty}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-full border border-line px-4 py-1.5 text-fg transition-colors hover:border-accent/60"
          >
            {t.clearFilters}
          </button>
        </div>
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
