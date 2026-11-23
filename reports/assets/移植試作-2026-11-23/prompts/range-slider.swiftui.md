# Port the SunUI block "Range Slider" (`range-slider`) to SwiftUI

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


# Platform adapter: SwiftUI (iOS 17+)

## Units and type
- CSS px = points. Keep the sizes from the source; do not swap in system control sizes.
- Fonts: `.system(size:weight:)` at the source size, wrapped so Dynamic Type still scales (`@ScaledMetric` on the size, or `Font.system(size:).leading(...)` with `relativeTo`). `tabular-nums` = `.monospacedDigit()`. `font-mono` = `.system(design: .monospaced)`. Letter spacing in em = `.tracking(em × fontSize)`.
- Corners: `RoundedRectangle(cornerRadius:, style: .continuous)`.

## Motion
- Springs map one to one: `.interpolatingSpring(mass: m, stiffness: k, damping: c)`. snappy = `(mass: 1, stiffness: 520, damping: 34)`, gentle = `(1, 240, 30)`, pop = `(0.8, 620, 20)`. Do not use `.spring()`, `.bouncy` or `.snappy` presets.
- Tweens: `.timingCurve(x1, y1, x2, y2, duration:)` with the source's control points and seconds.
- framer-motion `layout` (an element animating to its new size or position) = animate the state change with `withAnimation` / `.animation(_, value:)` so the same view resizes. For an element shared between two places use `matchedGeometryEffect`.
- `AnimatePresence` enter and exit = conditional view with `.transition(.asymmetric(insertion:removal:))`; give each swapped child a distinct `.id` so SwiftUI treats it as a new view. `initial y: 6, exit y: -6` = `.offset(y:)` combined with `.opacity`. `mode="popLayout"` means the leaving child must not hold layout space: put the children in a `ZStack`.
- A CSS `animate-spin` spinner = a `Circle().trim` rotating with `.linear(duration: 1).repeatForever(autoreverses: false)`; stop it under Reduce Motion.
- Reduced motion: `@Environment(\.accessibilityReduceMotion)`; pass `nil` animation or zero duration.

## Input
- There is no hover. Drop `hover:` styles. Keep pressed styles: read `configuration.isPressed` in a `ButtonStyle` (`active:translate-y-px` = `.offset(y: 1)`, `active:scale-[0.97]` = `.scaleEffect(0.97)` with snappy).
- Touch targets are at least 44×44 pt. If the visual is smaller, enlarge the hit area with `.contentShape` and padding or a larger frame, without changing how it looks.
- Pointer down / move / up on a track = `DragGesture(minimumDistance: 0)`; read the track width with `GeometryReader` or `onGeometryChange`.
- Haptics are the one addition allowed, and only on a user action that changes state: `.sensoryFeedback(.selection, trigger:)` for a snapped step, `.impact(weight: .light)` for arming or pressing, `.success` / `.error` for a result. Never on a timer.
- Keyboard handlers have no touch equivalent; cover them through accessibility actions instead (below). `Escape` to cancel = `.accessibilityAction(.escape)`.

## Accessibility
- `aria-live="polite"` = `AccessibilityNotification.Announcement(text).post()` when the text changes.
- `role="slider"` = `.accessibilityElement()` + `.accessibilityLabel` + `.accessibilityValue` + `.accessibilityAdjustableAction` stepping by `step`.
- `aria-busy`, `disabled` = `.disabled(_)` and a value or hint describing the busy state. `aria-hidden` = `.accessibilityHidden(true)`.

## Surfaces
- Colours come from `SunUITheme` (already in the project, shown below). Read it with `@Environment(\.sunuiTheme)`. Never use `Color.accentColor`, `.primary`, `.secondary` or system fills in place of a role.
- A CSS shadow with blur B is about `.shadow(radius: B / 2)`. A 1px ring (`0 0 0 1px`) or `border` is an `.overlay` of `strokeBorder(lineWidth: 1)`. An inset top highlight is an overlay stroke masked to the top edge.
- HTML canvas = SwiftUI `Canvas`. `destination-out` erasing = draw the strokes with `.blendMode(.destinationOut)` inside a `.compositingGroup()`. There is no `getImageData`; when the source samples pixels, track the same quantity yourself (for example a coarse grid of cells marked as the brush passes) and keep the same threshold semantics.

## Shape of the code
- One self-contained Swift file for the component. Props become `init` parameters with the same defaults; `ReactNode` children become `@ViewBuilder` closures (or `String` where the source only ever passes text); callbacks become closures; an `async` action stays `async`.
- Controlled values (`value` + `onValueChange`) = `Binding`. Keep a separate commit callback where the source has one.
- Timers = `Task` with `Task.sleep`, cancelled when re-armed and in `onDisappear`.
- Generic `number | [number, number]` values: offer two initialisers (single `Binding<Double>`, range `Binding<ClosedRange<Double>>`) over one shared implementation.

```swift
// SunUITheme.swift (already in the project)
import SwiftUI

struct SunUITheme {
    var background, foreground, card, muted, mutedForeground, primary, primaryForeground: Color
    var secondary, border, input, ring, destructive, spot, spotForeground, success: Color
    static func resolve(_ scheme: ColorScheme) -> SunUITheme  // light and dark defaults
}
extension EnvironmentValues { var sunuiTheme: SunUITheme { get set } }  // follows colorScheme
extension Color { init(hex: UInt32, opacity: Double = 1) }
```

## Learned in the pilot (2026-11-23)
- **Fixed heights and Dynamic Type.** A fixed control height (`h-6`, `h-8`) scales with the text: put the height in `@ScaledMetric` too. At the default text size it must equal the source.
- **Two timings on one view.** When width springs while colour tweens over 150ms and opacity is instant, do not wrap them in one `withAnimation`. Use the scoped `.animation(_:body:)` per property, or stack layers and animate each. Enter and exit with different durations = `AnyTransition.animation(_:)` on each side of `.asymmetric`.
- **Touch has no blur.** A visual the source shows on focus (a value bubble that stays after click) shows only while the finger is down; keep it for hardware-keyboard and VoiceOver focus.
- **44pt targets.** Layout size stays as in the source; the hit area may overflow it (`.contentShape` with negative insets, or an invisible larger frame overlaid).
- **Shadows with negative spread** (`0 4px 12px -6px`) have no equivalent: halve the radius again.
- **`<details>` / `<summary>`** = a button row with a triangle that turns 90 degrees, toggling instantly as the browser does; add `.accessibilityValue` for expanded and collapsed.
- **`aria-roledescription`, form `name`, hidden inputs, cursors, `stopPropagation`**: no equivalent, drop them. `name` may become `accessibilityIdentifier`.
- **Uncontrolled mode** (`defaultValue` with no `value`) is dropped: the `Binding` is required.
- **Responsive variants** (`md:grid-cols-2`) = `horizontalSizeClass == .regular`.
- **Swift traps.** Parameters named `min` / `max` shadow the global functions: call `Swift.min`. JavaScript `Math.round` rounds halves up, `.rounded()` rounds them away from zero: use `(x + 0.5).rounded(.down)`.
- **Result haptics** (`.success`, `.error`) may fire when the awaited action finishes; that still counts as the user's action.


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
- `ios/SunUIPilot/RangeSlider.swift`: the component (and any helper it needs, all in this file, with names prefixed so they cannot collide with other files).
- `ios/SunUIPilot/RangeSliderDemo.swift`: `struct RangeSliderDemo: View`, the demo screen.
The app target is iOS 18, Swift 5 language mode. `SunUITheme.swift` is already there; do not edit it or any other file. Do not run xcodebuild (other jobs share the project). You may type-check your two files with:
`xcrun -sdk iphonesimulator swiftc -typecheck -target arm64-apple-ios18.0-simulator ios/SunUIPilot/SunUITheme.swift ios/SunUIPilot/RangeSlider.swift ios/SunUIPilot/RangeSliderDemo.swift`

Work only from this document. Do not read other files in the pilot folder and do not look for the original repository. When you finish, reply with: the list of states you ported, anything in the source you could not carry over and what you did instead, and anything in this guide that was missing, wrong or unclear.