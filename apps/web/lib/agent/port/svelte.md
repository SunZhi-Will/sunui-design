## Platform: Svelte 5 + Tailwind v4 + Motion

The target is still the web, so the styling does not change at all.

### What the project needs
- Svelte 5 (runes), Tailwind v4 and the framework-free `motion` package (`npm i motion`). There is no Svelte build of framer-motion to rely on, so animation is driven by Motion's `animate()`.
- The shadcn colour variables. A project without them imports https://sunui.synvize.com/sunui-theme.css after Tailwind.
- `cn` at `@/lib/utils`: `twMerge(clsx(inputs))` from `clsx` and `tailwind-merge`. Create it if it is missing.

### Keep verbatim
- Every Tailwind class string, including arbitrary values, `dark:` variants and CSS variables. `className` becomes a `class` prop merged through `cn` on the root.
- Spring objects, tween objects, easing arrays, durations.
- DOM structure, roles, aria attributes, pointer and keyboard handlers (`onclick`, `onpointerdown`, `onkeydown`: lower-case attributes in Svelte 5).

<!-- only:motion -->
### Motion
`import { animate } from "motion"`. `animate(element, { left: "40%", scale: 1.15 }, { type: "spring", stiffness: 520, damping: 34 })` takes the same spring and tween options as framer-motion's `transition`. Check the installed package's types in `node_modules/motion` and `node_modules/motion-dom` for anything you are unsure of; do not guess from the React API.

| framer-motion | Svelte |
|---|---|
| `animate={{...}}` following state | `$effect(() => { animate(el, target, transition) })`, reading the state inside the effect. Keep the returned controls and `.stop()` them in the effect's cleanup |
| `initial={false}` | on the first run of that effect pass `{ duration: 0 }` |
| `layout` (same element animates to its new size) | measure `getBoundingClientRect()` before the change (`$effect.pre`) and after it (`tick()`), then `animate(el, { width: [from, to] }, spring)` and clear the inline size when it finishes |
| `AnimatePresence` enter and exit | `{#if}` with `in:` and `out:` custom transition functions that return `{ duration, css }` (duration in ms). Use the source's control points: `cubicBezier(x1, y1, x2, y2)` from `motion` is the easing function |
| a child whose `key` changes | `{#key value}` around it, with the same `in:` / `out:` |
| `mode="popLayout"` | the leaving node must not hold layout space: set `position: absolute` on it in `onoutrostart` |
| `useReducedMotion()` | `prefersReducedMotion.current` from `svelte/motion` |
| `whileTap`, `whileHover` | the CSS `active:` / `hover:` classes if the source also has them, otherwise pointer handlers calling `animate` |
<!-- end -->

### React to Svelte
- One component file, `<script lang="ts">`. A generic component uses `<script lang="ts" generics="...">`.
- Props: `let { a = 1, ...rest }: Props = $props()`, same names and defaults.
- `value` + `onValueChange` = a `$bindable()` prop (so `bind:value` works) that still works uncontrolled with `defaultValue`; keep `onValueChange` and other `onX` callbacks as function props, which is the Svelte 5 convention.
- `ReactNode` props and `children` = snippets (`children`, and a named snippet per prop), with a string prop of the same name as a fallback where the source is usually given text. A function prop that returns `ReactNode` returns a string.
- `useState` = `$state`; derived values = `$derived`; `useRef` for mutable values = plain `let`; DOM refs = `bind:this`; `useId` = `$props.id()`; `useEffect` = `$effect` (return the cleanup); unmount cleanup = `onDestroy`.
- Types the caller needs are exported from a `<script lang="ts" module>` block.

### Demo
The demo is a second component next to the first that reproduces the React demo with the English copy.

### Details that came up in testing (Svelte 5.59, motion 14)
- **Measure layout yourself, and take leaving nodes out of flow first.** After `tick()` the outgoing nodes of a transition are still in the DOM and still in flow, and `outrostart` has not fired yet. Capture each leaving node's box before the change (`$effect.pre`), pin it there with `position: absolute` plus its left, top, width and height, and only then measure the "to" size. Otherwise the target is too wide and the element snaps when the inline size is cleared.
- **A size change that happens when an exit ends** (a spinner that holds its space until it has faded) needs the same size animation started from `onoutroend`, with the node hidden first.
- **`layout="position"` on a child:** when the parent's width is animated, centred children jump. FLIP them: animate `x` from the old offset to 0 with the same spring.
- **Elements inside `{#each}`** cannot each have an `$effect`. Drive them with an action (`use:motionTo={...}`) that applies the first target at duration 0, animates later ones, and stops the animation on destroy. Write the first position inline as well, so nothing flashes before the action runs.
- **Transitions are local.** An `{#if}` wrapped around a `{#key}` plays only one of the two triggers; use a keyed `{#each}` over a zero-or-one item array, or `|global`.
- **In an exit, `css(t, u)` runs with `t` going from 1 to 0** and the easing already applied. Intros do not play on mount, so `initial={false}` on `AnimatePresence` needs nothing.
- **An `initial` state with a `delay`** must be written inline (opacity 0, the start scale), or the element shows its final state until the delay ends. To draw a path in, put `pathLength="1"` on the path and animate `stroke-dashoffset` from 1 to 0 with `stroke-dasharray: 1`; two ports that animated `pathLength` through `animate()` never drew the check.
- **`$bindable()` is looser than a controlled React prop:** the component writes the value on every change, so a parent that passes `value` without binding still sees it move. That is accepted.
- **`$state(defaultX)`** warns about a prop read outside a reactive scope: wrap it in `untrack(() => defaultX)`. A track that handles pointer events needs `<!-- svelte-ignore a11y_no_static_element_interactions -->`.

### Known weak spots (ports have failed our checks here)
Svelte has no layout animation, so everything framer-motion's `layout` does is rebuilt by hand, and this is where ports failed:
- **Width that changes with content** (a button whose label swaps): two separate ports sprang to a width about 50px too wide and snapped back. Measure the target with the leaving node out of flow, and check the result frame by frame.
- **A spring restarted on the same property** (hover out after hover in, a second toggle, a press released): six ports started the second animation the wrong way or with a stale velocity. Check what the new `animate()` call starts from before you report it as done.
- **Items after a resized cell** (a step track, a row that re-centres): animating the real width already moves the siblings, so adding a translate as well counts the displacement twice.
- **A shared indicator between items** (`layoutId`): it did not animate when the row re-centred.
Operate these cases in a browser and compare the curve with the live reference; do not report them from reading the code.
