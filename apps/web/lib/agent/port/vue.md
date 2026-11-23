## Platform: Vue 3.5 + Tailwind v4 + motion-v

The target is still the web, so the styling does not change at all.

### What the project needs
- Tailwind v4 and `motion-v` (`npm i motion-v`).
- The shadcn colour variables. A project without them imports https://sunui.synvize.com/sunui-theme.css after Tailwind.
- `cn` at `@/lib/utils`: `twMerge(clsx(inputs))` from `clsx` and `tailwind-merge`. Create it if it is missing.

### Keep verbatim
- Every Tailwind class string, including arbitrary values, `dark:` variants and CSS variables. `className` becomes `class`; `cn` is available from `@/lib/utils`.
- Spring objects, tween objects, easing arrays, durations.
- DOM structure, roles, aria attributes, pointer and keyboard handlers.

### Motion
- Use `motion-v`, the Vue build of Motion: `import { motion, AnimatePresence, useReducedMotion } from "motion-v"`. `<motion.div>` takes `:initial`, `:animate`, `:exit`, `:transition`, `:layout` like framer-motion. Check the installed package's types in `node_modules/motion-v` for anything you are unsure of (export names, whether a hook returns a ref); do not guess from the React API.
- Children of `<AnimatePresence>` need a `:key`, and conditional children use `v-if`.

### React to Vue
- One SFC, `<script setup lang="ts">`. A generic component uses `<script setup lang="ts" generic="...">`.
- Props: `defineProps` with `withDefaults`, same names (camelCase) and defaults.
- `value` + `onValueChange` = `defineModel` (so `v-model` works) and it must still work uncontrolled with `defaultValue`. Other `onX` callbacks = emits (`valueCommit`, `reveal`, `progress`). A prop that is a function the component awaits or calls for a return value (`action`, `format`) stays a function prop.
- `ReactNode` props and `children` = slots (default slot for children, named slots for the others), with a string prop of the same name as a fallback where the source is usually given text.
- `useState` = `ref`; derived values = `computed`; `useRef` for mutable values = plain `let` or `ref`; DOM refs = `useTemplateRef`; `useId` = `useId` from vue; `useEffect` cleanup = `onBeforeUnmount`; effects = `watch` / `watchEffect` / `onMounted`.
- Event names are lower-case in templates: `@pointerdown`, `@keydown`. `e.currentTarget` typing needs a cast.
- Fragments are fine: a template may have several roots, but then `class` no longer falls through automatically; keep one root.

### Demo
The demo is a second SFC next to the component that reproduces the React demo with the English copy.

### Checked against motion-v 2.13
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
