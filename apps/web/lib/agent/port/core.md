## Rules that hold on every platform

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

Some sources call the pop spring `stamp`: it is the same spring.

Tweens in framer-motion (checked against version 12):
- Durations are in seconds. An easing array such as `[0.23, 1, 0.32, 1]` is a cubic-bezier.
- Named easings: `easeOut` = (0, 0, 0.58, 1), `easeIn` = (0.42, 0, 1, 1), `easeInOut` = (0.42, 0, 0.58, 1), `linear`.
- A tween with a duration and no `ease` uses `easeInOut`.
- A value with no transition at all: transforms use a spring (stiffness 500, damping 25; scale uses 550 and 30), everything else a 0.3s tween on (0.25, 0.1, 0.35, 1).
- `whileTap` and `whileHover` animate with the element's own `transition` prop, not with a default.
- `layout` also animates `borderRadius` and `boxShadow` set in `style`.

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
- 1rem = 16px. Text (size/line height): `text-xs` 12/16, `text-sm` 14/20, `text-base` 16/24, `text-lg` 18/28, `text-xl` 20/28, `text-2xl` 24/32, `text-3xl` 30/36, `text-4xl` 36/40. An arbitrary size (`text-[13px]`) inherits line height 1.5. `leading-none` 1, `leading-tight` 1.25, `leading-relaxed` 1.625. `font-medium` 500, `font-semibold` 600. `tracking-tight` = -0.025em, `tracking-[0.12em]` = 0.12em. `tabular-nums` = monospaced digits.
- Radius: `rounded-sm` 6, `rounded-md` 8, `rounded-lg` 10, `rounded-xl` 14, `rounded-full` = capsule.
- Width caps: `max-w-xs` 320, `max-w-sm` 384, `max-w-md` 448, `max-w-lg` 512, `max-w-xl` 576, `max-w-2xl` 672. Breakpoints: `sm:` 640, `md:` 768, `lg:` 1024. `@container` and `@min-[420px]:` variants depend on the component's own width, not the screen.
- Named shadows: `shadow-sm` = `0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`; `shadow-md` = `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`.
- `motion-safe:` applies only when reduced motion is off. `text-current` is the inherited text colour. `sr-only` is content for screen readers only.
- CSS box-shadow is `x y blur spread colour`. `inset 0 1px 0 white/6%` is a 1px top-edge highlight inside the shape.

## When the source and this guide disagree
- **The code wins over its comments.** If a doc comment describes behaviour the code does not have, port the code.
- **Press feedback follows the source.** A CSS `active:` style on a property that is in the element's `transition-[...]` list takes Tailwind's 150ms tween; on a property that is not listed it is instant. A framer-motion `whileTap` uses that element's `transition`. Use the snappy spring only where the source does.
- **Tailwind's default transition** (a bare `transition-[...]` or `transition-colors`) is 150ms on cubic-bezier(0.4, 0, 0.2, 1).
- **`className`** is a web styling hook. On another web framework keep it as a `class` prop merged through `cn`; on a native platform drop it.
- **Dependencies** (a second source file in this document): port only the part this block uses, as a private helper. Old aliases are not needed.
- **Pixel sampling** (`getImageData` to measure how much is erased): where the platform cannot read pixels, track a 64 x 64 grid of cells and mark a cell once the brush has covered its centre.

- **Reduced motion is about movement.** A CSS colour transition with no `motion-safe:` in front of it stays under reduced motion; only what the source switches off is switched off.
- **Private subcomponents** defined in the source file stay in the component's file.
- **An optional callback whose presence changes what is rendered** (a `<button>` when `onStepClick` is given, a `<span>` otherwise) must stay detectable: keep it as an optional value, not as an event that is always there.
- **`sr-only` text next to an `aria-hidden` visual** is one accessible element: its text is the label of the visual.
- **Hooks the source exports** (`useToasts`) are part of the interface: port them as the platform's equivalent.

## Demo helpers that are not in this document
The demo may import site-only helpers. `ProductArt` draws a neutral product photo: use a muted block of the same size and radius. `useProductNames()` returns display names for those products: use short plain English names. `useDemoAutoplay` and its cursor only replay the demo for recordings: drop them. Local image paths (`/blocks/...`) become muted placeholders unless the block's behaviour depends on the picture, in which case say so.

## Do not add
Gradients, glows, coloured shadows, particles, confetti, decorative entrance animations, idle loops, haptics or sounds that fire without a user action.

## Before you write code
Read the host project first: its framework and language version, how it names colours and spacing, whether it already has the theme file this guide mentions. Fit in; do not restructure it.

## Deliver
The component (one file, plus private helper files only if a dependency needs them), and a small demo screen that reproduces the React demo below with the same sample content, so the two can be compared side by side. Compile or type-check what you wrote. Then tell the user: the states you ported, anything in the source you could not carry over and what you did instead, and what they should check by hand (dark mode, reduced motion, a screen reader, the feel of the springs on a real device).
