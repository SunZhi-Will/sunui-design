<script lang="ts">
import { defineComponent, h, type PropType } from "vue";

import { cn } from "@/lib/utils";

export type LoadingButtonState = "idle" | "loading" | "success" | "error";

export interface LoadingButtonProps {
  /** When it returns a Promise, switches loading → success (resolve) or error (reject) automatically */
  onClick?: () => unknown;
  /** Controlled state; when given, the component stops managing it itself */
  state?: LoadingButtonState;
  successLabel?: string;
  errorLabel?: string;
  /** Text screen readers read while loading */
  loadingLabel?: string;
  /** shrink: shrinks to a circle while loading; inline: keeps its width and the spinner appears before the text */
  loadingStyle?: "shrink" | "inline";
  /** Milliseconds before returning to idle after success or failure; 0 stays on the result */
  resetAfter?: number;
  variant?: "primary" | "paper";
  class?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const Spinner = defineComponent({
  name: "LoadingButtonSpinner",
  props: { class: { type: String as PropType<string | undefined>, default: undefined } },
  setup(props) {
    return () =>
      h("svg", { viewBox: "0 0 24 24", fill: "none", class: cn("size-4 animate-spin", props.class), "aria-hidden": "true" }, [
        h("circle", { cx: "12", cy: "12", r: "9", stroke: "currentColor", "stroke-opacity": "0.25", "stroke-width": "2" }),
        h("path", { d: "M21 12a9 9 0 0 0-9-9", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round" }),
      ]);
  },
});
</script>

<script setup lang="ts">
import { AnimatePresence, motion, useReducedMotion } from "motion-v";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<LoadingButtonProps>(), {
  onClick: undefined,
  state: undefined,
  successLabel: "Done",
  errorLabel: "Try again",
  loadingLabel: "Loading",
  loadingStyle: "shrink",
  resetAfter: 2000,
  variant: "primary",
  class: undefined,
  disabled: undefined,
  type: "button",
});

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand colour. Used only for selection, offers and current progress */
const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";

const reduce = useReducedMotion();
const inner = ref<LoadingButtonState>("idle");
const state = computed<LoadingButtonState>(() => props.state ?? inner.value);
let alive = true;
let timer: number | undefined;

onMounted(() => {
  alive = true;
});
onBeforeUnmount(() => {
  alive = false;
  window.clearTimeout(timer);
});

watch(
  [state, () => props.state, () => props.resetAfter],
  ([s, sp, ra], _old, onCleanup) => {
    if (sp !== undefined || ra <= 0 || (s !== "success" && s !== "error")) return;
    timer = window.setTimeout(() => {
      if (alive) inner.value = "idle";
    }, ra);
    onCleanup(() => window.clearTimeout(timer));
  },
  { immediate: true },
);

const handle = async () => {
  if (state.value === "loading") return;
  const result = props.onClick?.();
  if (props.state !== undefined || !(result instanceof Promise)) return;
  inner.value = "loading";
  try {
    await result;
    if (alive) inner.value = "success";
  } catch {
    if (alive) inner.value = "error";
  }
};

const shrunk = computed(() => props.loadingStyle === "shrink" && state.value === "loading");
const t = computed(() => (reduce.value ? { duration: 0 } : springs.gentle));
const fade = computed(() => (reduce.value ? { duration: 0 } : { duration: 0.14 }));
const checkTransition = computed(() => ({ duration: reduce.value ? 0 : 0.28, ease: "easeOut" as const }));
const buttonStyle = computed(() => ({ borderRadius: shrunk.value ? 999 : 6 }));
const classes = computed(() =>
  cn(
    "relative inline-flex h-10 items-center justify-center overflow-hidden whitespace-nowrap text-sm font-medium outline-offset-2 focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50",
    shrunk.value ? "w-10 px-0" : "px-4",
    props.variant === "primary" && state.value !== "error" && spotFill,
    props.variant === "paper" && "border border-foreground/10 bg-card text-foreground",
    state.value === "error" && "bg-destructive text-white",
    props.class,
  ),
);
</script>

<template>
  <motion.button
    v-bind="$attrs"
    :type="type"
    :layout="!reduce"
    :transition="t"
    :disabled="disabled"
    :aria-busy="state === 'loading' || undefined"
    :aria-disabled="state === 'loading' || undefined"
    :while-press="reduce || state === 'loading' ? undefined : { scale: 0.97 }"
    :style="buttonStyle"
    :class="classes"
    @click="handle"
  >
    <AnimatePresence mode="popLayout" :initial="false">
      <motion.span
        :key="shrunk ? 'spin' : state"
        :initial="{ opacity: 0, y: reduce ? 0 : 6 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: reduce ? 0 : -6 }"
        :transition="fade"
        tabindex="-1"
        class="inline-flex items-center gap-2"
      >
        <template v-if="shrunk">
          <Spinner />
        </template>
        <template v-else-if="state === 'loading'">
          <Spinner />
          <slot />
        </template>
        <template v-else-if="state === 'success'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4" aria-hidden="true">
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              :initial="{ pathLength: reduce ? 1 : 0 }"
              :animate="{ pathLength: 1 }"
              :transition="checkTransition"
              tabindex="-1"
            />
          </svg>
          <slot name="successLabel">{{ successLabel }}</slot>
        </template>
        <template v-else-if="state === 'error'">
          <slot name="errorLabel">{{ errorLabel }}</slot>
        </template>
        <template v-else>
          <slot />
        </template>
      </motion.span>
    </AnimatePresence>
    <span class="sr-only" aria-live="polite">
      <template v-if="state === 'loading'">{{ loadingLabel }}</template>
      <slot v-else-if="state === 'success'" name="successLabel">{{ successLabel }}</slot>
      <slot v-else-if="state === 'error'" name="errorLabel">{{ errorLabel }}</slot>
    </span>
  </motion.button>
</template>
