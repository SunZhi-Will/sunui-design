<script lang="ts">
import { defineComponent, h, type PropType, type VNodeChild } from "vue";

import { cn } from "@/lib/utils";

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
  previous?: VNodeChild;
  next?: VNodeChild;
  /** Accessible name of a page number */
  page?: (n: number) => string;
  /** Text in compact mode, for example "3 / 12" */
  compact?: (page: number, total: number) => VNodeChild;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Maps any language tag to one of the four built-in languages, falling back to English for everything else */
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

const cell =
  "relative inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Renders arbitrary VNodeChild content (labels may be strings or vnodes) */
const Render = (props: { content: VNodeChild }) => props.content as never;

/** getHref decides between a link and a button */
const PageCell = defineComponent({
  name: "PageCell",
  props: {
    to: { type: Number, required: true },
    disabled: { type: Boolean, default: false },
    current: { type: Boolean, default: false },
    label: { type: String, default: undefined },
    extra: { type: String, default: undefined },
    getHref: { type: Function as PropType<(page: number) => string>, default: undefined },
    onGo: { type: Function as PropType<(page: number) => void>, required: true },
  },
  setup(props, { slots }) {
    return () => {
      const cls = cn(
        cell,
        props.extra,
        props.current ? "font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        props.disabled && "pointer-events-none opacity-40",
      );
      const common = {
        "aria-label": props.label,
        "aria-current": props.current ? "page" : undefined,
        class: cls,
      };
      if (props.getHref) {
        return props.disabled
          ? h("span", { ...common, "aria-disabled": "true" }, slots.default?.())
          : h("a", { ...common, href: props.getHref(props.to), onClick: () => props.onGo(props.to) }, slots.default?.());
      }
      return h(
        "button",
        { type: "button", ...common, disabled: props.disabled, onClick: () => props.onGo(props.to) },
        slots.default?.(),
      );
    };
  },
});

const Chevron = defineComponent({
  name: "PaginationChevron",
  props: { dir: { type: String as PropType<"left" | "right">, required: true } },
  setup(props) {
    return () =>
      h(
        "svg",
        {
          viewBox: "0 0 24 24",
          class: "size-4",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "1.5",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "aria-hidden": "true",
        },
        [h("path", { d: props.dir === "left" ? "M14.5 6l-6 6 6 6" : "M9.5 6l6 6-6 6" })],
      );
  },
});
</script>

<script setup lang="ts">
import { motion, useReducedMotion } from "motion-v";
import { computed, ref, useId } from "vue";

const props = withDefaults(
  defineProps<{
    total: number;
    defaultPage?: number;
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
  }>(),
  {
    defaultPage: 1,
    getHref: undefined,
    siblings: 1,
    compact: false,
    locale: "en",
    labels: undefined,
    class: undefined,
  },
);

/** Controlled: the current page (starting at 1). Works uncontrolled with defaultPage */
const model = defineModel<number | undefined>("page", { default: undefined });

const t = computed(() => ({ ...MESSAGES[resolveLocale(props.locale)], ...props.labels }));
const reduce = useReducedMotion();
const layoutId = `${useId()}-indicator`;
const snappy = { type: "spring", stiffness: 520, damping: 34 } as const;
const inner = ref(props.defaultPage);
const page = computed(() => Math.min(Math.max(model.value ?? inner.value, 1), Math.max(props.total, 1)));
const range = computed(() => getPageRange(page.value, props.total, props.siblings));

const go = (n: number) => {
  if (n < 1 || n > props.total || n === page.value) return;
  if (model.value === undefined) inner.value = n;
  model.value = n;
};
</script>

<template>
  <nav v-if="total > 0" :aria-label="t.nav" :class="cn('w-full', props.class)">
    <ul class="flex items-center justify-center gap-1">
      <li>
        <PageCell :to="page - 1" :disabled="page <= 1" extra="gap-1 px-2.5" :get-href="getHref" :on-go="go">
          <Chevron dir="left" />
          <span class="max-sm:sr-only"><Render :content="t.previous" /></span>
        </PageCell>
      </li>
      <li v-if="compact" class="px-3 text-sm font-medium tabular-nums" aria-live="polite">
        <Render :content="t.compact(page, total)" />
      </li>
      <template v-else>
        <template v-for="n in range" :key="n">
          <li v-if="typeof n === 'number'">
            <PageCell :to="n" :current="n === page" :label="t.page(n)" :get-href="getHref" :on-go="go">
              {{ n }}
              <motion.span
                v-if="n === page"
                :layout-id="layoutId"
                aria-hidden="true"
                tabindex="-1"
                class="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-foreground"
                :transition="reduce ? { duration: 0 } : snappy"
              />
            </PageCell>
          </li>
          <li
            v-else
            aria-hidden="true"
            class="inline-flex h-9 min-w-7 items-center justify-center text-sm text-muted-foreground"
          >
            …
          </li>
        </template>
      </template>
      <li>
        <PageCell :to="page + 1" :disabled="page >= total" extra="gap-1 px-2.5" :get-href="getHref" :on-go="go">
          <span class="max-sm:sr-only"><Render :content="t.next" /></span>
          <Chevron dir="right" />
        </PageCell>
      </li>
    </ul>
  </nav>
</template>
