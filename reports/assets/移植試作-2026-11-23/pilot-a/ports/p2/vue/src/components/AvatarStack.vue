<script lang="ts">
import { motion } from "motion-v";
import { defineComponent, h, ref, type PropType } from "vue";

export interface AvatarStackPerson {
  id: string;
  /** Display name; give only the first name plus the initial of the surname, for example "Mina P." */
  name: string;
  /** Avatar image; when missing or failed to load, the initials are shown */
  src?: string;
  /** Second line of the tooltip, for example "Taipei, 2 hours ago" */
  note?: string;
}

export interface AvatarStackLabels {
  label: string;
  /** Name for +N; names are the collapsed people, and may be an empty string */
  more: (count: string, names: string) => string;
  /** Name of the clickable +N button */
  showMore: (count: string, names: string) => string;
  /** Separator used to join names */
  separator: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
export function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

export const MESSAGES: Record<SunLocale, AvatarStackLabels> = {
  en: {
    label: "Recent buyers",
    more: (n, names) => (names ? `${n} more, including ${names}` : `${n} more`),
    showMore: (n, names) => (names ? `Show ${n} more, including ${names}` : `Show ${n} more`),
    separator: ", ",
  },
  "zh-TW": {
    label: "最近購買",
    more: (n, names) => (names ? `還有 ${n} 人，包括 ${names}` : `還有 ${n} 人`),
    showMore: (n, names) => (names ? `查看其餘 ${n} 人，包括 ${names}` : `查看其餘 ${n} 人`),
    separator: "、",
  },
  "zh-CN": {
    label: "最近购买",
    more: (n, names) => (names ? `还有 ${n} 人，包括 ${names}` : `还有 ${n} 人`),
    showMore: (n, names) => (names ? `查看其余 ${n} 人，包括 ${names}` : `查看其余 ${n} 人`),
    separator: "、",
  },
  ja: {
    label: "最近の購入者",
    more: (n, names) => (names ? `ほか ${n} 人（${names} など）` : `ほか ${n} 人`),
    showMore: (n, names) => (names ? `ほか ${n} 人を表示（${names} など）` : `ほか ${n} 人を表示`),
    separator: "、",
  },
};

// Design language (DESIGN.md): neutral surfaces and text colors
export const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
export const ink = "text-foreground";
export const inkOutline = "border-foreground/70";

export const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  pop: { type: "spring", stiffness: 460, damping: 26 },
} as const;

/** Content colours: shades of the brand spot, picked by hashing a name */
const CONTENT_SHADES = [12, 20, 28] as const;
export function contentTone(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const mix = CONTENT_SHADES[hash % CONTENT_SHADES.length];
  return {
    backgroundColor: `color-mix(in oklch, var(--sunui-spot, var(--primary)) ${mix}%, transparent)`,
    color: "var(--sunui-spot, var(--primary))",
    borderColor: `color-mix(in oklch, var(--sunui-spot, var(--primary)) 30%, transparent)`,
  };
}

/** Gradient discs for fallback="gradient": the brand spot from a light tint to full or slightly deeper, one hue only */
const GRADIENTS = [
  [40, 0],
  [55, 15],
  [28, 8],
  [65, 22],
  [48, 4],
] as const;

/** Stable index from the id, so a person keeps the same gradient everywhere */
export function gradientOf(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const [tint, deep] = GRADIENTS[hash % GRADIENTS.length];
  return `linear-gradient(135deg, color-mix(in oklch, var(--sunui-spot, var(--primary)) ${tint}%, white), color-mix(in oklch, var(--sunui-spot, var(--primary)), black ${deep}%))`;
}

export const sizes = {
  sm: { box: 28, text: "text-[10px]", overlap: -7 },
  md: { box: 36, text: "text-xs", overlap: -9 },
  lg: { box: 44, text: "text-sm", overlap: -11 },
};

export function initialsOf(name: string) {
  const parts = name.replace(/\./g, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** From 1,000 up it is shortened to 1.3K, keeping the disc width */
export function compact(n: number, locale: string) {
  return new Intl.NumberFormat(locale, n >= 1_000 ? { notation: "compact", maximumFractionDigits: 1 } : {}).format(n);
}

/** Lifts and shows the name on hover or focus; the tooltip is only a visual aid, the name is already in aria-label */
const Lift = defineComponent({
  name: "AvatarStackLift",
  props: {
    title: { type: String, required: true },
    note: { type: String, default: undefined },
    reduce: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    const active = ref(false);
    return () =>
      h(
        motion.div,
        {
          class: "relative",
          style: { zIndex: active.value ? 50 : undefined },
          animate: { y: active.value && !props.reduce ? -3 : 0 },
          transition: props.reduce ? { duration: 0 } : springs.snappy,
          onPointerenter: () => (active.value = true),
          onPointerleave: () => (active.value = false),
          onFocusin: () => (active.value = true),
          onFocusout: () => (active.value = false),
        },
        () => [
          slots.default?.(),
          active.value
            ? h(
                "span",
                {
                  "aria-hidden": "true",
                  class:
                    "pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-52 -translate-x-1/2 rounded-[3px] bg-foreground px-2 py-1 text-xs text-background",
                },
                [
                  h("span", { class: "block truncate font-medium" }, props.title),
                  props.note ? h("span", { class: "block truncate opacity-70" }, props.note) : null,
                ],
              )
            : null,
        ],
      );
  },
});

const Face = defineComponent({
  name: "AvatarStackFace",
  props: {
    person: { type: Object as PropType<AvatarStackPerson>, required: true },
    gradient: { type: Boolean, default: false },
  },
  setup(props) {
    const failed = ref(false);
    return () => {
      const person = props.person;
      if (person.src && !failed.value) {
        return h("img", { src: person.src, alt: "", class: "size-full object-cover", onError: () => (failed.value = true) });
      }
      // The gradient disc carries no letters; the name is already in aria-label and the tooltip
      if (props.gradient && !person.src) return null;
      return h("span", { "aria-hidden": "true" }, initialsOf(person.name));
    };
  },
});

export { Lift, Face };
</script>

<script setup lang="ts">
import { AnimatePresence, motion as m, useReducedMotion } from "motion-v";
import { computed } from "vue";

import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    people: AvatarStackPerson[];
    /** Actual total count; when larger than the number of people, the difference is added to +N */
    total?: number;
    /** Maximum number of avatars shown, the rest go into +N */
    max?: number;
    size?: "sm" | "md" | "lg";
    /** Accessible name for the whole group of avatars, same as labels.label */
    label?: string;
    /** Fired when +N is clicked; when not provided, +N is plain text */
    onOverflowClick?: () => void;
    /** UI language and number format: en, zh-TW, zh-CN, ja */
    locale?: string;
    /** Override the built-in strings, takes priority over locale */
    labels?: Partial<AvatarStackLabels>;
    /** What people without a photo show: initials (default), or a stable soft gradient picked from their id */
    fallback?: "initials" | "gradient";
    class?: string;
  }>(),
  { total: undefined, max: 4, size: "md", label: undefined, onOverflowClick: undefined, locale: "en-US", labels: undefined, fallback: "initials", class: undefined },
);

const t = computed<AvatarStackLabels>(() => ({
  ...MESSAGES[resolveLocale(props.locale)],
  ...(props.label !== undefined ? { label: props.label } : null),
  ...props.labels,
}));
const reduce = useReducedMotion();
const s = computed(() => sizes[props.size]);
const visible = computed(() => props.people.slice(0, Math.max(0, props.max)));
const hidden = computed(() => props.people.slice(visible.value.length));
const count = computed(() => Math.max(props.total ?? props.people.length, props.people.length));
const extra = computed(() => count.value - visible.value.length);
const extraText = computed(() => `+${compact(extra.value, props.locale)}`);
const hiddenNames = computed(() => hidden.value.map((h) => h.name).join(t.value.separator));
const extraLabel = computed(() => t.value.more(String(extra.value), hiddenNames.value));
const disc = computed(() =>
  cn("flex items-center justify-center rounded-full border font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", surface, ink, inkOutline, s.value.text),
);

function personStyle(p: AvatarStackPerson) {
  return {
    width: `${s.value.box}px`,
    height: `${s.value.box}px`,
    ...(p.src ? null : props.fallback === "gradient" ? { backgroundImage: gradientOf(p.id) } : contentTone(p.id)),
  };
}
</script>

<template>
  <ul :aria-label="`${t.label} (${count})`" :class="cn('flex items-center', props.class)">
    <AnimatePresence :initial="false">
      <m.li
        v-for="(p, i) in visible"
        :key="p.id"
        class="relative"
        :style="{ marginLeft: i === 0 ? '0px' : `${s.overlap}px`, zIndex: visible.length - i + 1 }"
        :initial="reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, x: -8 }"
        :animate="{ opacity: 1, scale: 1, x: 0 }"
        :exit="{ opacity: 0, transition: { duration: 0.15 } }"
        :transition="reduce ? { duration: 0 } : springs.pop"
      >
        <Lift :title="p.name" :note="p.note" :reduce="reduce">
          <span
            role="img"
            tabindex="0"
            :aria-label="p.note ? `${p.name}, ${p.note}` : p.name"
            :class="cn(disc, 'overflow-hidden', fallback === 'gradient' && !p.src && 'border-2 border-card')"
            :style="personStyle(p)"
          >
            <Face :person="p" :gradient="fallback === 'gradient'" />
          </span>
        </Lift>
      </m.li>
      <m.li v-if="extra > 0" key="overflow" class="relative" :style="{ marginLeft: `${s.overlap}px`, zIndex: 1 }">
        <Lift :title="hiddenNames || t.more(compact(extra, locale), '')" :reduce="reduce">
          <button
            v-if="onOverflowClick"
            type="button"
            :aria-label="t.showMore(String(extra), hiddenNames)"
            :class="cn(disc, 'px-1.5 hover:bg-muted dark:hover:bg-foreground/10 motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]')"
            :style="{ minWidth: `${s.box}px`, height: `${s.box}px` }"
            @click="onOverflowClick()"
          >
            {{ extraText }}
          </button>
          <span v-else role="img" tabindex="0" :aria-label="extraLabel" :class="cn(disc, 'px-1.5')" :style="{ minWidth: `${s.box}px`, height: `${s.box}px` }">
            {{ extraText }}
          </span>
        </Lift>
      </m.li>
    </AnimatePresence>
  </ul>
</template>
