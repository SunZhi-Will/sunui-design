# Port the SunUI block "Range Slider" (`range-slider`) to Vue

# SunUI port guide: rules that hold on every platform

You are porting a SunUI block from React + Tailwind + framer-motion to another platform. The React source below is the specification. Port its behaviour exactly; do not redesign it.

## What must survive the port
1. **Every state and every transition in the source.** List the states before you write code (idle, pressed, armed, pending, success, error, disabled, dragging, focused, revealed ...) and make sure each one exists in the port.
2. **The numbers.** Spring parameters, durations, easing curves, delays, offsets, scales, sizes, radii, opacities and timeouts are copied, never approximated or replaced by platform defaults.
3. **The public interface.** Same props with the same defaults and the same callbacks, renamed only to fit the platform's conventions.
4. **Continuity.** When the source morphs one element (same button grows wider, text slides out and in), the port morphs the same element. Do not swap in a different view or cross-fade the whole thing.
5. **Reduced motion.** Where the source checks `useReducedMotion`, the port checks the platform setting and switches instantly, losing no information.
6. **Accessibility.** Every role, label, live announcement and keyboard action in the source has a platform equivalent.
7. **Built-in copy, if the source has it.** Where the source has a four-language message table (en, zh-TW, zh-CN, ja), a `locale` prop and a `labels` override, keep all three. Where it has none, add none.

## The three springs (physical parameters; mass is 1 unless given)
| name | stiffness | damping | mass | used for |
|---|---|---|---|---|
| snappy | 520 | 34 | 1 | press feedback, small moves |
| gentle | 240 | 30 | 1 | state changes, expand and collapse |
| pop | 620 | 20 | 0.8 | a small element settling once (result disc, badge number) |

Tween curves in the source are cubic-bezier control points, e.g. `[0.23, 1, 0.32, 1]` (expo-out). Durations are seconds in framer-motion.

## Colour roles and their default values
Blocks never hard-code colours; they read roles. Map each role to the host app's own colour system if it has one, otherwise use these defaults.

| role (Tailwind token) | light | dark |
|---|---|---|
| background | #ffffff | #0a0a0a |
| foreground | #0a0a0a | #fafafa |
| card | #ffffff | #171717 |
| muted | #f5f5f5 | #262626 |
| muted-foreground | #737373 | #a1a1a1 |
| primary | #171717 | #e5e5e5 |
| primary-foreground | #fafafa | #171717 |
| secondary | #f5f5f5 | #262626 |
| secondary-foreground | #171717 | #fafafa |
| card-foreground | same as foreground | same as foreground |
| border | #e5e5e5 | white at 10% |
| input | #e5e5e5 | white at 15% |
| ring | #a1a1a1 | #737373 |
| destructive | #e7000b | #ff6467 |
| spot (`--sunui-spot`, falls back to primary) | primary | primary |
| success | #1f9d55 | #4cd68a |

`x/NN` in a class (`bg-foreground/10`, `bg-destructive/10`) is that colour at NN% opacity.

## Tailwind numbers
- Spacing and size: 1 unit = 4px (`h-8` = 32, `px-2.5` = 10, `gap-1.5` = 6, `size-5` = 20, `mb-3` = 12).
- Text: `text-xs` 12/16, `text-[0.8rem]` 12.8, `text-sm` 14/20, `text-base` 16/24, `text-xl` 20/28, `text-4xl` 36. `font-medium` 500, `font-semibold` 600. `tracking-tight` = -0.025em, `tracking-[0.12em]` = 0.12em. `tabular-nums` = monospaced digits.
- Radius: `rounded-sm` 6, `rounded-md` 8, `rounded-lg` 10, `rounded-xl` 14, `rounded-full` = capsule.
- CSS box-shadow is `x y blur spread colour`. `inset 0 1px 0 white/6%` is a 1px top-edge highlight inside the shape.

## When the source and this guide disagree
- **The code wins over its comments.** If a doc comment describes behaviour the code does not have, port the code.
- **Press feedback follows the source.** A CSS `active:` style on a property that is not in the element's `transition-[...]` list is instant. Use the snappy spring only where the source does.
- **Tailwind's default transition** (a bare `transition-[...]` or `transition-colors`) is 150ms on cubic-bezier(0.4, 0, 0.2, 1).
- **`className`** is a web styling hook. On another web framework keep it as a `class` prop merged through `cn`; on a native platform drop it.
- **Dependencies** (a second source file in this document): port only the part this block uses, as a private helper. Old aliases are not needed.
- **Pixel sampling** (`getImageData` to measure how much is erased): where the platform cannot read pixels, track a 64 x 64 grid of cells and mark a cell once the brush has covered its centre.

## Do not add
Gradients, glows, coloured shadows, particles, confetti, decorative entrance animations, idle loops, haptics or sounds that fire without a user action.

## Deliver
The component (one file, plus private helper files only if a dependency needs them), and a small demo screen that reproduces the React demo below with the same sample content, so the two can be compared side by side.


# Platform adapter: Vue 3.5 + Tailwind v4 + motion-v

The target is still the web, so the styling does not change at all.

## Keep verbatim
- Every Tailwind class string, including arbitrary values, `dark:` variants and CSS variables. `className` becomes `class`; `cn` is available from `@/lib/utils`.
- Spring objects, tween objects, easing arrays, durations.
- DOM structure, roles, aria attributes, pointer and keyboard handlers.

## Motion
- Use `motion-v`, the Vue build of Motion: `import { motion, AnimatePresence, useReducedMotion } from "motion-v"`. `<motion.div>` takes `:initial`, `:animate`, `:exit`, `:transition`, `:layout` like framer-motion. Check the installed package's types in `node_modules/motion-v` for anything you are unsure of (export names, whether a hook returns a ref); do not guess from the React API.
- Children of `<AnimatePresence>` need a `:key`, and conditional children use `v-if`.

## React to Vue
- One SFC, `<script setup lang="ts">`. A generic component uses `<script setup lang="ts" generic="...">`.
- Props: `defineProps` with `withDefaults`, same names (camelCase) and defaults.
- `value` + `onValueChange` = `defineModel` (so `v-model` works) and it must still work uncontrolled with `defaultValue`. Other `onX` callbacks = emits (`valueCommit`, `reveal`, `progress`). A prop that is a function the component awaits or calls for a return value (`action`, `format`) stays a function prop.
- `ReactNode` props and `children` = slots (default slot for children, named slots for the others), with a string prop of the same name as a fallback where the source is usually given text.
- `useState` = `ref`; derived values = `computed`; `useRef` for mutable values = plain `let` or `ref`; DOM refs = `useTemplateRef`; `useId` = `useId` from vue; `useEffect` cleanup = `onBeforeUnmount`; effects = `watch` / `watchEffect` / `onMounted`.
- Event names are lower-case in templates: `@pointerdown`, `@keydown`. `e.currentTarget` typing needs a cast.
- Fragments are fine: a template may have several roots, but then `class` no longer falls through automatically; keep one root.

## Demo
The demo is a second SFC next to the component that reproduces the React demo with the English copy.

## Learned in the pilot (2026-11-23, motion-v 2.13)
- **`useReducedMotion()` returns `Ref<boolean>`**, never null. Read `.value` in script (a ref is always truthy) and make anything derived from it a `computed`. Drop the source's `?? false`.
- **`className`** = a declared `class` prop merged through `cn` on the root, so tailwind-merge still resolves conflicts. Do not rely on attribute fallthrough.
- **`children`** = the default slot, with no string fallback prop.
- **A keyed swap inside `AnimatePresence`** (one always-present child whose `:key` changes, with `mode="popLayout"`) works as in framer-motion. Checked against the original: same label swap and the same width spring.
- **A template ref on `motion.*`** gives a component instance; the DOM node is `$el` (guard with `instanceof`).
- **Easing arrays** need a mutable tuple type: `[0.23, 1, 0.32, 1] as [number, number, number, number]`, not `as const`.
- **Initial value order.** Where the source initialises from `defaultValue ?? value ?? min`, do the same once at setup and let `defineModel` hold the value afterwards. Emit only `update:modelValue` for changes; keep a separate emit for commit.
- **A function prop that returns `ReactNode`** (`format`) returns `VNodeChild`; render it through a small functional component.
- **Exported types** go in a second plain `<script lang="ts">` block in the same SFC.
- Not checked: a custom component as the direct child of `AnimatePresence` playing its exit.


# The block

Slider for any numeric value or range (price, rating, volume, quota) that takes a number for one thumb or a [low, high] pair for a range: step snapping, minimum gap, ticks, a value bubble while dragging or focused, custom formatting and hidden inputs for forms. Click the track to jump the nearest thumb, use arrows, Page keys, Home and End, and get onValueCommit once when the drag ends.

**When to use**
- Price range filters on a product listing
- Minimum rating, budget or distance filters

**Watch out**
- Run expensive searches from onValueCommit, not onValueChange
- For a handful of exact values, sliding-tabs chips are easier to hit on phones

## Source: range-slider.tsx

```tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useId, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Brand accent: follows the theme's --primary by default; set --sunui-spot to use your own brand colour. Used only for selected state, deals and current progress */
const spotBg = "bg-[color:var(--sunui-spot,var(--primary))]";
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

type RangeValue = number | [number, number];

export interface RangeSliderProps<V extends RangeValue = RangeValue> {
  /** A number means a single value; [low, high] means a range */
  value?: V;
  defaultValue?: V;
  /** Called continuously while dragging */
  onValueChange?: (value: V) => void;
  /** Called once after release or a keyboard action; good for submitting a filter */
  onValueCommit?: (value: V) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Minimum gap between the two handles in range mode */
  minGap?: number;
  /** Format of the displayed value, e.g. (n) => `$${n}` */
  format?: (n: number) => ReactNode;
  /** Ticks: a number means that many equal divisions, an array gives explicit positions */
  ticks?: number | number[];
  /** Show the value above the handle while dragging */
  showTooltip?: boolean;
  label?: ReactNode;
  /** Form field name; a range submits name-min and name-max */
  name?: string;
  /** aria-label of the handles; in range mode in the order [low, high] */
  thumbLabels?: [string, string] | string;
  disabled?: boolean;
  className?: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function RangeSlider<V extends RangeValue>({
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  minGap = 0,
  format = (n) => n,
  ticks,
  showTooltip = true,
  label,
  name,
  thumbLabels,
  disabled = false,
  className,
}: RangeSliderProps<V>) {
  const reduce = useReducedMotion();
  const labelId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState<RangeValue>(defaultValue ?? valueProp ?? min);
  const current = (valueProp ?? inner) as RangeValue;
  const range = Array.isArray(current);
  const values: number[] = range ? [...current] : [current];
  const [dragging, setDragging] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const latest = useRef(values);
  latest.current = values;

  const pct = (n: number) => ((n - min) / (max - min)) * 100;
  const snap = (n: number) => clamp(Math.round((n - min) / step) * step + min, min, max);
  const decimals = (String(step).split(".")[1] ?? "").length;

  const emit = useCallback(
    (next: number[], commit = false) => {
      const out = (range ? [next[0], next[1]] : next[0]) as V;
      if (valueProp === undefined) setInner(out);
      onValueChange?.(out);
      if (commit) onValueCommit?.(out);
    },
    [range, valueProp, onValueChange, onValueCommit],
  );

  const setThumb = (index: number, raw: number, commit = false) => {
    const next = [...latest.current];
    let v = Number(snap(raw).toFixed(decimals));
    if (range) v = index === 0 ? Math.min(v, next[1] - minGap) : Math.max(v, next[0] + minGap);
    if (next[index] === v && !commit) return;
    next[index] = v;
    latest.current = next;
    emit(next, commit);
  };

  const fromPointer = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    return min + clamp((clientX - rect.left) / rect.width, 0, 1) * (max - min);
  };

  const onTrackDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    const raw = fromPointer(e.clientX);
    const index = !range ? 0 : raw <= values[0] ? 0 : raw >= values[1] ? 1 : raw - values[0] < values[1] - raw ? 0 : 1;
    setDragging(index);
    setThumb(index, raw);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    trackRef.current?.querySelectorAll<HTMLElement>("[role=slider]")[index]?.focus();
  };

  const onTrackMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging === null) return;
    setThumb(dragging, fromPointer(e.clientX));
  };

  const onTrackUp = () => {
    if (dragging === null) return;
    emit(latest.current, true);
    setDragging(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: number) => {
    const big = Math.max(step, (max - min) / 10);
    const map: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: big, PageDown: -big };
    let target: number | undefined;
    if (e.key in map) target = values[index] + map[e.key];
    if (e.key === "Home") target = min;
    if (e.key === "End") target = max;
    if (target === undefined) return;
    e.preventDefault();
    setThumb(index, target, true);
  };

  const tickList = typeof ticks === "number" ? Array.from({ length: ticks + 1 }, (_, i) => min + ((max - min) * i) / ticks) : ticks ?? [];
  const lo = range ? pct(values[0]) : 0;
  const hi = pct(range ? values[1] : values[0]);
  const t = reduce || dragging !== null ? { duration: 0 } : springs.snappy;
  const labels = typeof thumbLabels === "string" ? [thumbLabels, thumbLabels] : thumbLabels ?? ["Minimum", "Maximum"];

  return (
    <div className={cn("w-full select-none", disabled && "pointer-events-none opacity-50", className)}>
      {label && (
        <div className="mb-3 flex items-baseline justify-between gap-3 text-sm">
          <span id={labelId} className="font-medium">
            {label}
          </span>
          <span className="tabular-nums text-muted-foreground">
            {format(values[0])}
            {range && <> – {format(values[1])}</>}
          </span>
        </div>
      )}
      <div
        ref={trackRef}
        className="relative h-6 cursor-pointer touch-none"
        onPointerDown={onTrackDown}
        onPointerMove={onTrackMove}
        onPointerUp={onTrackUp}
        onPointerCancel={onTrackUp}
      >
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-foreground/10" />
        <motion.div
          className={cn("absolute top-1/2 h-1 -translate-y-1/2 rounded-full", spotBg)}
          initial={false}
          animate={{ left: `${lo}%`, width: `${hi - lo}%` }}
          transition={t}
        />
        {tickList.map((tick) => (
          <span
            key={tick}
            aria-hidden="true"
            className={cn("absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full", pct(tick) >= lo && pct(tick) <= hi ? "bg-card" : "bg-foreground/30")}
            style={{ left: `${pct(tick)}%` }}
          />
        ))}
        {values.map((v, i) => (
          <motion.div
            key={i}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={range ? labels[i] : typeof thumbLabels === "string" ? thumbLabels : undefined}
            aria-labelledby={!range && !thumbLabels && label ? labelId : undefined}
            aria-valuemin={range && i === 1 ? values[0] + minGap : min}
            aria-valuemax={range && i === 0 ? values[1] - minGap : max}
            aria-valuenow={v}
            aria-valuetext={typeof format(v) === "string" || typeof format(v) === "number" ? String(format(v)) : undefined}
            aria-disabled={disabled || undefined}
            onKeyDown={(e) => onKeyDown(e, i)}
            onFocus={() => setFocused(i)}
            onBlur={() => setFocused(null)}
            className={cn("absolute top-1/2 z-10 -ml-2.5 -mt-2.5 size-5 rounded-full border-[1.5px] bg-card outline-offset-2 focus-visible:outline-2", spotBorder)}
            initial={false}
            animate={{ left: `${pct(v)}%`, scale: dragging === i && !reduce ? 1.15 : 1 }}
            transition={t}
            style={{ zIndex: dragging === i || focused === i ? 20 : 10 }}
          >
            {showTooltip && (dragging === i || focused === i) && (
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-foreground/10 bg-card px-1.5 py-0.5 text-xs tabular-nums text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
                {format(v)}
              </span>
            )}
          </motion.div>
        ))}
      </div>
      {name && (
        <>
          <input type="hidden" name={range ? `${name}-min` : name} value={values[0]} />
          {range && <input type="hidden" name={`${name}-max`} value={values[1]} />}
        </>
      )}
    </div>
  );
}
```

## Demo source: demo.tsx

`useDemoText(copy)` returns the entry of `copy` for the site's current language; use the English entry and pass `locale="en"`.

```tsx
"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { RangeSlider } from "./range-slider";

const copy = {
  en: { filter: "Filter", price: "Price", rating: "Minimum rating", results: (n: number) => `${n} products`, low: "Lowest price", high: "Highest price", currency: (n: number) => `$${n}`, stars: (n: number) => `${n.toFixed(1)} ★` },
  "zh-TW": { filter: "篩選", price: "價格", rating: "最低評分", results: (n: number) => `共 ${n} 件商品`, low: "最低價", high: "最高價", currency: (n: number) => `NT$${(n * 30).toLocaleString()}`, stars: (n: number) => `${n.toFixed(1)} ★` },
  "zh-CN": { filter: "筛选", price: "价格", rating: "最低评分", results: (n: number) => `共 ${n} 件商品`, low: "最低价", high: "最高价", currency: (n: number) => `¥${(n * 7).toLocaleString()}`, stars: (n: number) => `${n.toFixed(1)} ★` },
  ja: { filter: "絞り込み", price: "価格", rating: "評価の下限", results: (n: number) => `${n} 件の商品`, low: "最低価格", high: "最高価格", currency: (n: number) => `¥${(n * 150).toLocaleString()}`, stars: (n: number) => `${n.toFixed(1)} ★` },
};

export default function RangeSliderDemo() {
  const t = useDemoText(copy);
  const [price, setPrice] = useState<[number, number]>([20, 120]);
  const [rating, setRating] = useState(4);
  const count = Math.max(0, Math.round((price[1] - price[0]) * 1.4 - (rating - 3) * 30));

  return (
    <div className="w-full max-w-sm rounded-lg border bg-background p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <span className="text-base font-semibold tracking-tight">{t.filter}</span>
        <span className="text-sm tabular-nums text-muted-foreground">{t.results(count)}</span>
      </div>
      <div className="space-y-8">
        <RangeSlider label={t.price} value={price} onValueChange={setPrice} min={0} max={200} step={5} minGap={10} format={t.currency} thumbLabels={[t.low, t.high]} name="price" />
        <RangeSlider label={t.rating} value={rating} onValueChange={setRating} min={1} max={5} step={0.5} ticks={8} format={t.stars} thumbLabels={t.rating} />
      </div>
    </div>
  );
}
```

# Where to write

Write exactly two files and nothing else:
- `vue/src/components/RangeSlider.vue`: the component. If it needs a helper component (for example the result mark), put it in `vue/src/components/RangeSliderParts/`.
- `vue/src/demos/RangeSliderDemo.vue`: the demo.
The project is Vite + Vue 3.5 + Tailwind v4 + motion-v with the SunUI theme variables loaded and `cn` at `@/lib/utils`. Do not edit any other file and do not start a dev server. You may type-check with `npx vue-tsc --noEmit` from `vue/`.

Work only from this document. Do not read other files in the pilot folder and do not look for the original repository. When you finish, reply with: the list of states you ported, anything in the source you could not carry over and what you did instead, and anything in this guide that was missing, wrong or unclear.