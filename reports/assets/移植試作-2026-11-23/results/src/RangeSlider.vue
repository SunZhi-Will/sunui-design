<script lang="ts">
export type RangeValue = number | [number, number];
</script>

<script setup lang="ts" generic="V extends RangeValue = RangeValue">
import { motion, useReducedMotion } from "motion-v";
import { computed, ref, useId, useSlots, useTemplateRef, watch, type FunctionalComponent, type VNodeChild } from "vue";

import { cn } from "@/lib/utils";

/** Brand accent: follows the theme's --primary by default; set --sunui-spot to use your own brand colour. Used only for selected state, deals and current progress */
const spotBg = "bg-[color:var(--sunui-spot,var(--primary))]";
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

const props = withDefaults(
  defineProps<{
    /** Starting value when used without v-model. A number means a single value; [low, high] means a range */
    defaultValue?: V;
    min?: number;
    max?: number;
    step?: number;
    /** Minimum gap between the two handles in range mode */
    minGap?: number;
    /** Format of the displayed value, e.g. (n) => `$${n}` */
    format?: (n: number) => VNodeChild;
    /** Ticks: a number means that many equal divisions, an array gives explicit positions */
    ticks?: number | number[];
    /** Show the value above the handle while dragging */
    showTooltip?: boolean;
    /** Text label; the `label` slot replaces it */
    label?: string;
    /** Form field name; a range submits name-min and name-max */
    name?: string;
    /** aria-label of the handles; in range mode in the order [low, high] */
    thumbLabels?: [string, string] | string;
    disabled?: boolean;
    class?: string;
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    minGap: 0,
    format: (n: number) => n,
    showTooltip: true,
    disabled: false,
  },
);

/** v-model: a number means a single value; [low, high] means a range. Updated continuously while dragging */
const model = defineModel<V>();

const emit = defineEmits<{
  /** Fired once after release or a keyboard action; good for submitting a filter */
  valueCommit: [value: V];
}>();

defineSlots<{ label?: () => unknown }>();
const slots = useSlots();

/** Renders whatever `format` returns (text or vnodes) */
const FormatNode: FunctionalComponent<{ node: VNodeChild }> = (p) => p.node;
FormatNode.props = ["node"];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const reduce = useReducedMotion();
const labelId = useId();
const trackRef = useTemplateRef<HTMLDivElement>("track");

// Uncontrolled use: defineModel keeps the value locally once it is first written
const initial: RangeValue = props.defaultValue ?? model.value ?? props.min;
const current = computed<RangeValue>(() => model.value ?? initial);
const range = computed(() => Array.isArray(current.value));
const values = computed<number[]>(() => {
  const c = current.value;
  return Array.isArray(c) ? [...c] : [c];
});
const dragging = ref<number | null>(null);
const focused = ref<number | null>(null);
let latest = values.value;
watch(values, (v) => (latest = v), { flush: "sync" });

const pct = (n: number) => ((n - props.min) / (props.max - props.min)) * 100;
const snap = (n: number) => clamp(Math.round((n - props.min) / props.step) * props.step + props.min, props.min, props.max);
const decimals = computed(() => (String(props.step).split(".")[1] ?? "").length);

const emitValue = (next: number[], commit = false) => {
  const out = (range.value ? [next[0], next[1]] : next[0]) as V;
  model.value = out;
  if (commit) emit("valueCommit", out);
};

const setThumb = (index: number, raw: number, commit = false) => {
  const next = [...latest];
  let v = Number(snap(raw).toFixed(decimals.value));
  if (range.value) v = index === 0 ? Math.min(v, next[1] - props.minGap) : Math.max(v, next[0] + props.minGap);
  if (next[index] === v && !commit) return;
  next[index] = v;
  latest = next;
  emitValue(next, commit);
};

const fromPointer = (clientX: number) => {
  const rect = trackRef.value!.getBoundingClientRect();
  return props.min + clamp((clientX - rect.left) / rect.width, 0, 1) * (props.max - props.min);
};

const onTrackDown = (e: PointerEvent) => {
  if (props.disabled || e.button !== 0) return;
  const raw = fromPointer(e.clientX);
  const vs = values.value;
  const index = !range.value ? 0 : raw <= vs[0] ? 0 : raw >= vs[1] ? 1 : raw - vs[0] < vs[1] - raw ? 0 : 1;
  dragging.value = index;
  setThumb(index, raw);
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  trackRef.value?.querySelectorAll<HTMLElement>("[role=slider]")[index]?.focus();
};

const onTrackMove = (e: PointerEvent) => {
  if (dragging.value === null) return;
  setThumb(dragging.value, fromPointer(e.clientX));
};

const onTrackUp = () => {
  if (dragging.value === null) return;
  emitValue(latest, true);
  dragging.value = null;
};

const onKeyDown = (e: KeyboardEvent, index: number) => {
  const { step, min, max } = props;
  const big = Math.max(step, (max - min) / 10);
  const map: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: big, PageDown: -big };
  let target: number | undefined;
  if (e.key in map) target = values.value[index] + map[e.key];
  if (e.key === "Home") target = min;
  if (e.key === "End") target = max;
  if (target === undefined) return;
  e.preventDefault();
  setThumb(index, target, true);
};

const tickList = computed<number[]>(() => {
  const { ticks, min, max } = props;
  return typeof ticks === "number" ? Array.from({ length: ticks + 1 }, (_, i) => min + ((max - min) * i) / ticks) : ticks ?? [];
});
const lo = computed(() => (range.value ? pct(values.value[0]) : 0));
const hi = computed(() => pct(range.value ? values.value[1] : values.value[0]));
const t = computed(() => (reduce.value || dragging.value !== null ? { duration: 0 } : springs.snappy));
const labels = computed(() => (typeof props.thumbLabels === "string" ? [props.thumbLabels, props.thumbLabels] : props.thumbLabels ?? ["Minimum", "Maximum"]));
const hasLabel = computed(() => !!props.label || !!slots.label);

const valueText = (v: number) => {
  const f = props.format(v);
  return typeof f === "string" || typeof f === "number" ? String(f) : undefined;
};
</script>

<template>
  <div :class="cn('w-full select-none', disabled && 'pointer-events-none opacity-50', props.class)">
    <div v-if="hasLabel" class="mb-3 flex items-baseline justify-between gap-3 text-sm">
      <span :id="labelId" class="font-medium">
        <slot name="label">{{ label }}</slot>
      </span>
      <span class="tabular-nums text-muted-foreground">
        <FormatNode :node="format(values[0])" />
        <template v-if="range"> – <FormatNode :node="format(values[1])" /></template>
      </span>
    </div>
    <div
      ref="track"
      class="relative h-6 cursor-pointer touch-none"
      @pointerdown="onTrackDown"
      @pointermove="onTrackMove"
      @pointerup="onTrackUp"
      @pointercancel="onTrackUp"
    >
      <div class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-foreground/10" />
      <motion.div
        :class="cn('absolute top-1/2 h-1 -translate-y-1/2 rounded-full', spotBg)"
        :initial="false"
        :animate="{ left: `${lo}%`, width: `${hi - lo}%` }"
        :transition="t"
      />
      <span
        v-for="tick in tickList"
        :key="tick"
        aria-hidden="true"
        :class="cn('absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full', pct(tick) >= lo && pct(tick) <= hi ? 'bg-card' : 'bg-foreground/30')"
        :style="{ left: `${pct(tick)}%` }"
      />
      <motion.div
        v-for="(v, i) in values"
        :key="i"
        role="slider"
        :tabindex="disabled ? -1 : 0"
        :aria-label="range ? labels[i] : typeof thumbLabels === 'string' ? thumbLabels : undefined"
        :aria-labelledby="!range && !thumbLabels && hasLabel ? labelId : undefined"
        :aria-valuemin="range && i === 1 ? values[0] + minGap : min"
        :aria-valuemax="range && i === 0 ? values[1] - minGap : max"
        :aria-valuenow="v"
        :aria-valuetext="valueText(v)"
        :aria-disabled="disabled || undefined"
        :class="cn('absolute top-1/2 z-10 -ml-2.5 -mt-2.5 size-5 rounded-full border-[1.5px] bg-card outline-offset-2 focus-visible:outline-2', spotBorder)"
        :initial="false"
        :animate="{ left: `${pct(v)}%`, scale: dragging === i && !reduce ? 1.15 : 1 }"
        :transition="t"
        :style="{ zIndex: dragging === i || focused === i ? 20 : 10 }"
        @keydown="(e: KeyboardEvent) => onKeyDown(e, i)"
        @focus="focused = i"
        @blur="focused = null"
      >
        <span
          v-if="showTooltip && (dragging === i || focused === i)"
          class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-foreground/10 bg-card px-1.5 py-0.5 text-xs tabular-nums text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
        >
          <FormatNode :node="format(v)" />
        </span>
      </motion.div>
    </div>
    <template v-if="name">
      <input type="hidden" :name="range ? `${name}-min` : name" :value="values[0]" />
      <input v-if="range" type="hidden" :name="`${name}-max`" :value="values[1]" />
    </template>
  </div>
</template>
