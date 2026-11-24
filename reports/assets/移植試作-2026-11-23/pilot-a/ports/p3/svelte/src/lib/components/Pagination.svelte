<script lang="ts" module>
  export type PageRangeItem = number | "start-ellipsis" | "end-ellipsis";

  /**
   * Builds the page number sequence: always includes the first page, the last page, the current page and its siblings, with ellipses for the rest.
   * The output length is fixed (siblings * 2 + 5 when there are enough pages), so the layout does not jump when changing pages.
   * @example getPageRange(6, 12) // [1, "start-ellipsis", 5, 6, 7, "end-ellipsis", 12]
   */
  export function getPageRange(current: number, total: number, siblings = 1): PageRangeItem[] {
    const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
    if (total <= 0) return [];
    const slots = siblings * 2 + 5;
    if (total <= slots) return range(1, total);
    const page = Math.min(Math.max(current, 1), total);
    const left = Math.max(page - siblings, 1);
    const right = Math.min(page + siblings, total);
    const showLeft = left > 3;
    const showRight = right < total - 2;
    const edgeCount = slots - 2;
    if (!showLeft) return [...range(1, edgeCount), "end-ellipsis", total];
    if (!showRight) return [1, "start-ellipsis", ...range(total - edgeCount + 1, total)];
    return [1, "start-ellipsis", ...range(left, right), "end-ellipsis", total];
  }

  export interface PaginationLabels {
    nav?: string;
    previous?: string;
    next?: string;
    /** Accessible name of a page number */
    page?: (n: number) => string;
    /** Text in compact mode, for example "3 / 12" */
    compact?: (page: number, total: number) => string;
  }

  export interface PaginationProps {
    total: number;
    /** Current page (starting at 1). Bindable; leave undefined for uncontrolled use */
    page?: number;
    defaultPage?: number;
    onPageChange?: (page: number) => void;
    /** When provided, each page renders as <a href> so search engines can crawl every page */
    getHref?: (page: number) => string;
    /** How many pages to show on each side of the current page */
    siblings?: number;
    /** Shows only "Previous 3 / 12 Next", suited to narrow columns */
    compact?: boolean;
    /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK and ja-JP are also accepted */
    locale?: string;
    /** Overrides the built-in strings, takes priority over locale */
    labels?: PaginationLabels;
    class?: string;
  }

  type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

  function resolveLocale(tag?: string): SunLocale {
    const t = (tag ?? "en").toLowerCase();
    if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
    if (t.startsWith("ja")) return "ja";
    return "en";
  }

  const compactText = (page: number, total: number) => `${page} / ${total}`;

  const MESSAGES: Record<SunLocale, Required<PaginationLabels>> = {
    en: { nav: "Pagination", previous: "Previous", next: "Next", page: (n) => `Page ${n}`, compact: compactText },
    "zh-TW": { nav: "分頁", previous: "上一頁", next: "下一頁", page: (n) => `第 ${n} 頁`, compact: compactText },
    "zh-CN": { nav: "分页", previous: "上一页", next: "下一页", page: (n) => `第 ${n} 页`, compact: compactText },
    ja: { nav: "ページ送り", previous: "前へ", next: "次へ", page: (n) => `${n} ページ目`, compact: compactText },
  };

  const snappy = { type: "spring", stiffness: 520, damping: 34 } as const;

  const cell =
    "relative inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
</script>

<script lang="ts">
  import { animate } from "motion";
  import { prefersReducedMotion } from "svelte/motion";
  import { untrack } from "svelte";

  import { cn } from "@/lib/utils";

  let {
    total,
    page: pageProp = $bindable(),
    defaultPage = 1,
    onPageChange,
    getHref,
    siblings = 1,
    compact = false,
    locale = "en",
    labels,
    class: className,
  }: PaginationProps = $props();

  const t = $derived({ ...MESSAGES[resolveLocale(locale)], ...labels });
  let inner = $state(untrack(() => defaultPage));
  const page = $derived(Math.min(Math.max(pageProp ?? inner, 1), Math.max(total, 1)));

  function go(n: number) {
    if (n < 1 || n > total || n === page) return;
    inner = n;
    if (pageProp !== undefined) pageProp = n;
    onPageChange?.(n);
  }

  // Shared underline (layoutId): remember where the old one was before the DOM changes,
  // then the new one springs from that box to its own resting place.
  const holder: { el: HTMLElement | null; from: DOMRect | null } = { el: null, from: null };

  $effect.pre(() => {
    void page;
    holder.from = holder.el?.getBoundingClientRect() ?? null;
  });

  function indicator(node: HTMLElement) {
    holder.el = node;
    const from = holder.from;
    holder.from = null;
    let controls: { stop: () => void } | undefined;
    if (from && !prefersReducedMotion.current) {
      const to = node.getBoundingClientRect();
      const dx = from.left - to.left;
      if (dx !== 0 || from.width !== to.width) {
        controls = animate(node, { x: [dx, 0], width: [from.width, to.width] }, snappy);
        controls && (controls as unknown as Promise<void>).then?.(() => {
          node.style.width = "";
          node.style.transform = "";
        }, () => {});
      }
    }
    return {
      destroy() {
        controls?.stop();
        if (holder.el === node) holder.el = null;
      },
    };
  }
</script>

{#snippet chevron(dir: "left" | "right")}
  <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d={dir === "left" ? "M14.5 6l-6 6 6 6" : "M9.5 6l6 6-6 6"} />
  </svg>
{/snippet}

{#snippet inside(kind: "prev" | "next" | number)}
  {#if kind === "prev"}
    {@render chevron("left")}
    <span class="max-sm:sr-only">{t.previous}</span>
  {:else if kind === "next"}
    <span class="max-sm:sr-only">{t.next}</span>
    {@render chevron("right")}
  {:else}
    {kind}
    {#if kind === page}
      <span aria-hidden="true" use:indicator class="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-foreground"></span>
    {/if}
  {/if}
{/snippet}

{#snippet item(kind: "prev" | "next" | number, to: number, disabled: boolean, current: boolean, label: string | undefined, extra: string | undefined)}
  {@const cls = cn(
    cell,
    extra,
    current ? "font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
    disabled && "pointer-events-none opacity-40",
  )}
  {#if getHref}
    {#if disabled}
      <span aria-label={label} aria-current={current ? "page" : undefined} class={cls} aria-disabled="true">{@render inside(kind)}</span>
    {:else}
      <a aria-label={label} aria-current={current ? "page" : undefined} class={cls} href={getHref(to)} onclick={() => go(to)}>{@render inside(kind)}</a>
    {/if}
  {:else}
    <button type="button" aria-label={label} aria-current={current ? "page" : undefined} class={cls} {disabled} onclick={() => go(to)}>{@render inside(kind)}</button>
  {/if}
{/snippet}

{#if total > 0}
  <nav aria-label={t.nav} class={cn("w-full", className)}>
    <ul class="flex items-center justify-center gap-1">
      <li>{@render item("prev", page - 1, page <= 1, false, undefined, "gap-1 px-2.5")}</li>
      {#if compact}
        <li class="px-3 text-sm font-medium tabular-nums" aria-live="polite">
          {t.compact(page, total)}
        </li>
      {:else}
        {#each getPageRange(page, total, siblings) as n (n)}
          {#if typeof n === "number"}
            <li>{@render item(n, n, false, n === page, t.page(n), undefined)}</li>
          {:else}
            <li aria-hidden="true" class="inline-flex h-9 min-w-7 items-center justify-center text-sm text-muted-foreground">…</li>
          {/if}
        {/each}
      {/if}
      <li>{@render item("next", page + 1, page >= total, false, undefined, "gap-1 px-2.5")}</li>
    </ul>
  </nav>
{/if}
