"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { BlockCard } from "@/components/block-card";
import { CopyButton } from "@/components/copy-button";
import { collections, collectionSlugs, setAgentPrompt, setInstallCommands, type CollectionSlug, type SetBlock } from "@/lib/collections";
import { format, type Locale } from "@/lib/i18n";
import type { Messages } from "@/lib/messages";
import type { Interaction, RegistryItem, Series, Tier } from "@/lib/registry";
import { useSaved } from "@/lib/saved";
import { seriesOf } from "@/lib/series";
import { cn } from "@/lib/utils";
import { spotKeys, type SpotKey } from "@/lib/spot";
import { variantFeatured } from "@/registry/__generated__/variants";

const seriesKeys: Series[] = ["paper", "product", "story", "showcase", "motion"];
const interactionKeys: Interaction[] = ["press", "hover", "drag", "type", "loading", "scroll", "section"];

/** title、description 已換成目前語言；search 保留英文標題與描述，讓英文關鍵字也搜得到。 */
export type CatalogItem = Pick<RegistryItem, "name" | "title" | "description" | "meta" | "categories"> & {
  search: string;
  /** 效果庫拆開後的單一樣式；一般 block 沒有 */
  variant?: string;
  /** 效果庫本身的標題與樣式數，收合成一張卡時使用 */
  libraryTitle?: string;
  styleCount?: number;
  /** 收合的效果庫卡片：卡片預覽這一種樣式，連結仍指向整個庫 */
  preview?: string;
  /** 已改用品牌專色 --sunui-spot 的 block */
  spot?: boolean;
  /** public/og/blocks 有這個區塊的分享圖，卡片載入前先當底圖 */
  poster?: boolean;
  /** 英文原文，給「複製給 agent」的整組 prompt 用 */
  en?: { title: string; description: string };
};

export type CatalogMessages = Pick<Messages, "catalog" | "collections" | "interactions" | "series" | "tier">;

/** 型錄上方的「從一整頁開始」：一個合輯，或這個瀏覽器收藏的區塊 */
type BlockSet = CollectionSlug | "saved";

const chipRow =
  // 手機上每一排篩選改成橫向捲動的一列，不再折成好幾行把第一張卡推到第二個畫面；sm 以上照常換行
  "-mx-4 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden";

export function Catalog({ items, locale, messages }: { items: CatalogItem[]; locale: Locale; messages: CatalogMessages }) {
  const { catalog: t, collections: collectionText, interactions: interactionLabels, series: seriesText, tier: tierLabels } = messages;
  const [interaction, setInteraction] = useState<Interaction | "all">("all");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [series, setSeries] = useState<Series | "all">("all");
  const [query, setQuery] = useState("");
  const [blockSet, setBlockSet] = useState<BlockSet | null>(null);
  const { saved, clear: clearSaved } = useSaved();
  const searchRef = useRef<HTMLInputElement>(null);
  const cardLabels = { livePreview: t.livePreview, expand: t.expand, pro: tierLabels.pro, save: t.save };

  // 效果庫平常收合成一張卡，選了 Motion 系列或搜尋時才展開成一種樣式一張。
  // 收合的卡預覽代表樣式（variants.tsx 的 featured），點開是整個庫的樣式格子，不是單一樣式
  const expandStyles = series === "motion" || query.trim() !== "";
  const collapsed = useMemo(() => {
    const seen = new Set<string>();
    return items.flatMap((item) => {
      if (!item.variant) return [item];
      if (seen.has(item.name)) return [];
      seen.add(item.name);
      return [
        {
          ...item,
          variant: undefined,
          preview: variantFeatured[item.name] ?? item.variant,
          title: item.libraryTitle ?? item.title,
        },
      ];
    });
  }, [items]);

  // 每個合輯只算這份 clone 找得到的區塊（公開 repo 沒有 Pro 清單時，Pro 名稱會被略過）
  const available = useMemo(() => new Set(collapsed.map((item) => item.name)), [collapsed]);
  const setNames = useMemo(() => {
    const map = new Map<BlockSet, string[]>();
    for (const c of collections) map.set(c.slug, c.blocks.filter((name) => available.has(name)));
    map.set("saved", saved.filter((name) => available.has(name)));
    return map;
  }, [available, saved]);
  const activeNames = blockSet ? (setNames.get(blockSet) ?? []) : null;

  // 選了合輯或收藏時，照合輯的頁面順序（收藏則照收藏順序）排，效果庫仍是一個庫一張卡
  const viewItems = useMemo(() => {
    if (!activeNames) return expandStyles ? items : collapsed;
    const order = new Map(activeNames.map((name, i) => [name, i]));
    const source = expandStyles ? items : collapsed;
    return source
      .filter((item) => order.has(item.name))
      .sort((a, b) => order.get(a.name)! - order.get(b.name)!);
  }, [activeNames, expandStyles, items, collapsed]);

  const chooseSet = (next: BlockSet | null) => {
    setBlockSet(next);
    // 合輯可分享：網址帶 ?collection=，收藏只存在這個瀏覽器所以帶 ?saved
    const url = new URL(window.location.href);
    url.searchParams.delete("collection");
    url.searchParams.delete("saved");
    if (next === "saved") url.searchParams.set("saved", "1");
    else if (next) url.searchParams.set("collection", next);
    window.history.replaceState(window.history.state, "", url);
  };

  // 區塊頁的「Also called」連結以 ?q= 帶入搜尋字，系列標籤以 ?series= 帶入，數量條以 ?tier= 帶入
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setQuery(q);
    const s = params.get("series");
    if (s && (seriesKeys as string[]).includes(s)) setSeries(s as Series);
    // 首頁數量條以 ?tier= 帶入方案篩選
    const tierParam = params.get("tier");
    if (tierParam === "free" || tierParam === "pro") setTier(tierParam);
    const collectionParam = params.get("collection");
    if (collectionParam && (collectionSlugs as string[]).includes(collectionParam)) setBlockSet(collectionParam as CollectionSlug);
    else if (params.has("saved")) setBlockSet("saved");
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

  const filtered = query.trim() !== "" || interaction !== "all" || tier !== "all" || series !== "all" || blockSet !== null;
  const reset = () => {
    setQuery("");
    setInteraction("all");
    setTier("all");
    setSeries("all");
    if (blockSet) chooseSet(null);
  };

  // 互動數字跟著目前的系列與方案篩選，避免顯示點下去才發現是 0 的數字
  const scoped = useMemo(
    () =>
      viewItems.filter(
        (item) => (tier === "all" || item.meta.tier === tier) && (series === "all" || seriesOf(item) === series),
      ),
    [viewItems, tier, series],
  );

  const counts = useMemo(() => {
    const map = new Map<Interaction, number>();
    for (const item of scoped) map.set(item.meta.interaction, (map.get(item.meta.interaction) ?? 0) + 1);
    return map;
  }, [scoped]);

  // 系列數字一律算收合後的卡片（一個效果庫算一個），才不會出現「動效」比「全部」還多；
  // 選了 Motion 展開成樣式時，下方的數量列改用「N 種樣式」說明
  const seriesCounts = useMemo(() => {
    const map = new Map<Series, number>();
    for (const item of collapsed) map.set(seriesOf(item), (map.get(seriesOf(item)) ?? 0) + 1);
    return map;
  }, [collapsed]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return viewItems.filter((item) => {
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
  }, [viewItems, interaction, tier, series, query]);

  // 整組複製用英文原文，順序同畫面
  const setBlocks: SetBlock[] = useMemo(() => {
    if (!activeNames) return [];
    const byName = new Map(collapsed.map((item) => [item.name, item]));
    return activeNames.flatMap((name) => {
      const item = byName.get(name);
      if (!item) return [];
      return [{ name, title: item.en?.title ?? item.title, description: item.en?.description ?? item.description, tier: item.meta.tier }];
    });
  }, [activeNames, collapsed]);

  return (
    <section id="blocks" aria-label={t.sectionLabel} className="scroll-mt-24">
      <div role="group" aria-label={t.setsLabel} className={cn(chipRow, "mb-6")}>
        <span className="mr-1 shrink-0 text-sm whitespace-nowrap text-subtle">{t.setsLabel}</span>
        {collections.map((c) => (
          <FilterChip
            key={c.slug}
            active={blockSet === c.slug}
            onClick={() => chooseSet(blockSet === c.slug ? null : c.slug)}
            label={collectionText[c.slug].title}
            count={setNames.get(c.slug)?.length ?? 0}
          />
        ))}
        <FilterChip
          active={blockSet === "saved"}
          onClick={() => chooseSet(blockSet === "saved" ? null : "saved")}
          label={t.saved}
          count={setNames.get("saved")?.length ?? 0}
          icon={
            <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
              <path d="M6 3.5h12v17l-6-4.25-6 4.25z" />
            </svg>
          }
        />
      </div>

      {blockSet && (
        <SetPanel
          title={blockSet === "saved" ? t.savedTitle : collectionText[blockSet].title}
          intro={blockSet === "saved" ? t.savedIntro : collectionText[blockSet].intro}
          blocks={setBlocks}
          heading={collections.find((c) => c.slug === blockSet)?.agentTitle}
          proLabel={tierLabels.pro}
          t={t}
          onClearSaved={blockSet === "saved" && setBlocks.length > 0 ? clearSaved : undefined}
        />
      )}

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
              className="peer w-full rounded-sm border border-line bg-card py-2 pr-10 pl-9 text-sm outline-none placeholder:text-subtle focus-visible:border-fg"
            />
            <kbd
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-line px-1.5 font-mono text-[11px] text-subtle peer-focus:hidden"
            >
              /
            </kbd>
          </label>
          <div role="group" aria-label={t.filterPlan} className="flex rounded-sm border border-line p-0.5 text-sm">
            {(["all", "free", "pro"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={tier === value}
                onClick={() => setTier(value)}
                className={cn(
                  "rounded-sm px-3 py-1 transition-colors",
                  tier === value ? "bg-fg text-bg" : "text-subtle hover:text-fg",
                )}
              >
                {value === "all" ? t.tierAll : tierLabels[value]}
              </button>
            ))}
          </div>
        </div>

        <div role="group" aria-label={t.filterSeries} className={chipRow}>
          <FilterChip active={series === "all"} onClick={() => setSeries("all")} label={t.allSeries} count={collapsed.length} />
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
        </div>
        {series !== "all" && <p className="-mt-1 text-sm text-pretty text-subtle">{seriesText.descriptions[series]}</p>}

        <div role="group" aria-label={t.filterInteraction} className={chipRow}>
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
          {series === "motion"
            ? format(t.styles, { n: visible.length })
            : visible.length === 1
              ? t.countOne
              : format(t.count, { n: visible.length })}
        </p>
        {filtered && (
          <button type="button" onClick={reset} className="underline-offset-4 hover:text-fg hover:underline">
            {t.clearFilters}
          </button>
        )}
      </div>

      <ul className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item, i) => (
          <BlockCard
            spot={spotFor(visible, i)}
            key={item.variant ? `${item.name}~${item.variant}` : item.name}
            name={item.name}
            variant={item.variant}
            preview={item.preview}
            poster={item.poster && !item.variant}
            title={item.title}
            note={!expandStyles && item.styleCount ? format(t.styles, { n: item.styleCount }) : undefined}
            tier={item.meta.tier}
            locale={locale}
            labels={cardLabels}
          />
        ))}
      </ul>

      {visible.length === 0 && (
        <div className="rounded-lg border border-dashed border-line p-10 text-center text-sm text-subtle">
          <p>{blockSet === "saved" && setBlocks.length === 0 ? t.savedEmpty : t.empty}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-sm border border-line px-4 py-1.5 text-fg transition-colors hover:border-fg"
          >
            {t.clearFilters}
          </button>
        </div>
      )}
    </section>
  );
}

function SetPanel({
  title,
  intro,
  blocks,
  heading,
  proLabel,
  t,
  onClearSaved,
}: {
  title: string;
  intro: string;
  blocks: SetBlock[];
  /** 英文的頁面名稱，寫進 prompt 第一句；收藏沒有 */
  heading?: string;
  proLabel: string;
  t: Messages["catalog"];
  onClearSaved?: () => void;
}) {
  const { free, pro } = setInstallCommands(blocks);
  const install = [free, pro].filter(Boolean).join("\n");
  const proCount = blocks.filter((b) => b.tier === "pro").length;
  const copyLabels = { copy: t.copyInstall, copied: t.copied };
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-lg border border-line bg-card p-5">
      <div className="min-w-0 max-w-xl">
        <h3 className="font-medium tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-pretty text-subtle">{intro}</p>
        {proCount > 0 && (
          <p className="mt-2 text-xs text-subtle">
            {format(t.setProNote, { n: proCount, pro: proLabel })}
          </p>
        )}
      </div>
      {blocks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {onClearSaved && (
            <button type="button" onClick={onClearSaved} className="px-2 py-1.5 text-sm text-subtle underline-offset-4 hover:text-fg hover:underline">
              {t.clearSaved}
            </button>
          )}
          <CopyButton value={install} labels={copyLabels} className="px-3 py-1.5 text-sm" />
          <CopyButton
            value={setAgentPrompt(blocks, heading)}
            labels={{ copy: t.copyPrompt, copied: t.copied }}
            className="border-fg bg-fg px-3 py-1.5 text-sm text-bg hover:text-bg hover:opacity-90"
          />
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-sm border px-3 py-1 text-sm whitespace-nowrap transition-colors",
        active ? "border-fg bg-fg text-bg" : "border-line text-subtle hover:text-fg",
      )}
    >
      {icon}
      {label}
      <span className={cn("text-xs tabular-nums", active ? "opacity-70" : "opacity-60")}>{count}</span>
    </button>
  );
}

/**
 * 型錄牆的品牌色示範：支援專色的卡片每三張有一張換成示範品牌色，依序輪流，其餘維持墨色。
 * 固定分配不隨機，篩選後也照可見順序重排。說明見 reports/網站灰階單調診斷-2026-11-08.md。
 */
function spotFor(items: CatalogItem[], index: number): SpotKey | undefined {
  if (!items[index].spot) return undefined;
  const k = items.slice(0, index).filter((item) => item.spot).length;
  if (k % 3 !== 1) return undefined;
  const colors = spotKeys.filter((key) => key !== "ink");
  return colors[Math.floor(k / 3) % colors.length];
}
