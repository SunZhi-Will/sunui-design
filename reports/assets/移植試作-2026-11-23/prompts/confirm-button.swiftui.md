# Port the SunUI block "Confirm Button" (`confirm-button`) to SwiftUI

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

Press-twice confirm with no modal. The first press arms the button, swaps its label to the outcome and shows a short notice. A second press within 2.5 s runs the action, and the result appears in a polite status line. It uses usermeld's shadcn button variants and sizes, Escape disarms it, and the spinner respects reduced motion.

**When to use**
- Irreversible row actions in admin tables where a dialog would be too heavy
- Actions that lose progress, such as quick load, where one misclick should not commit

**Watch out**
- Name confirmLabel after the outcome ("Remove signup"), not "Confirm"
- The notice line reserves a little height under the button; account for it in dense tables

## Source: confirm-button.tsx

```tsx
"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ConfirmButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
export type ConfirmButtonSize = "default" | "xs" | "sm" | "lg";

/** Same shape as usermeld's ActionResult: ok plus a human-readable message */
export type ConfirmResult = { ok: boolean; message?: string } | void;

export interface ConfirmButtonLabels {
  /** Hint after the first press; {label} is replaced with confirmLabel */
  armedNotice?: string;
  /** On success when the action gave no message */
  done?: string;
  /** When the action throws */
  failed?: string;
}

export interface ConfirmButtonProps {
  /** Normal button text; name the action itself, e.g. "Remove" */
  children: ReactNode;
  /** Button text while awaiting confirmation; name it by the outcome, e.g. "Remove registration", not "OK" */
  confirmLabel: string;
  /** Time limit for the second press (ms); the original's quick read is 2.5 seconds */
  armMs?: number;
  /** How long the hint stays (ms); the original is 1.8 seconds */
  noticeMs?: number;
  /** Called on the second press; returning { ok: false, message } or throwing both count as failure */
  action: () => Promise<ConfirmResult> | ConfirmResult;
  /** When set, a press shows only this line and never enters the pending state (e.g. there is no readable quick save yet) */
  unavailableMessage?: string;
  variant?: ConfirmButtonVariant;
  /** Style swapped in while pending; defaults to destructive */
  armedVariant?: ConfirmButtonVariant;
  size?: ConfirmButtonSize;
  disabled?: boolean;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK or ja-JP are accepted too */
  locale?: string;
  /** Override the built-in strings; takes priority over locale */
  labels?: ConfirmButtonLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<ConfirmButtonLabels>> = {
  en: { armedNotice: "Press again to {label}", done: "Done", failed: "That didn't work. Please try again." },
  "zh-TW": { armedNotice: "再按一次以{label}", done: "完成", failed: "沒有成功，請再試一次。" },
  "zh-CN": { armedNotice: "再按一次以{label}", done: "完成", failed: "没有成功，请再试一次。" },
  ja: { armedNotice: "もう一度押すと{label}", done: "完了しました", failed: "うまくいきませんでした。もう一度お試しください。" },
};

// buttonVariants from usermeld's components/ui/button.tsx
const base =
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const variants: Record<ConfirmButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  outline:
    "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
  secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
  ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
  destructive:
    "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizes: Record<ConfirmButtonSize, string> = {
  default: "h-8 gap-1.5 px-2.5",
  xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
  sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
  lg: "h-9 gap-1.5 px-2.5",
};

type Notice = { text: string; tone: "info" | "success" | "error" };

// Motion of the product series: expo-out easing, durations on the 120 / 180ms steps
const ease = [0.23, 1, 0.32, 1] as const;
const snappy = { type: "spring", stiffness: 520, damping: 34 } as const;

export function ConfirmButton({
  children,
  confirmLabel,
  armMs = 2500,
  noticeMs = 1800,
  action,
  unavailableMessage,
  variant = "outline",
  armedVariant = "destructive",
  size = "default",
  disabled = false,
  locale = "en",
  labels,
  className,
}: ConfirmButtonProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const swap = reduce ? { duration: 0 } : { duration: 0.18, ease };
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>();
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const armTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(noticeTimer.current);
      clearTimeout(armTimer.current);
    };
  }, []);

  function flash(text: string, tone: Notice["tone"] = "info") {
    setNotice({ text, tone });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(undefined), noticeMs);
  }

  function disarm() {
    clearTimeout(armTimer.current);
    setArmed(false);
  }

  async function run() {
    setPending(true);
    try {
      const res = await action();
      if (!alive.current) return;
      if (!res || res.ok) flash(res?.message ?? t.done, "success");
      else flash(res.message ?? t.failed, "error");
    } catch {
      if (alive.current) flash(t.failed, "error");
    } finally {
      if (alive.current) setPending(false);
    }
  }

  // The first press only earns a hint line; a second press within armMs actually runs the action
  function press() {
    if (pending) return;
    if (unavailableMessage) {
      flash(unavailableMessage);
      return;
    }
    if (!armed) {
      setArmed(true);
      flash(t.armedNotice.replace("{label}", confirmLabel.toLowerCase()));
      clearTimeout(armTimer.current);
      armTimer.current = setTimeout(() => setArmed(false), armMs);
      return;
    }
    disarm();
    void run();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Escape" && armed) {
      e.preventDefault();
      disarm();
      setNotice(undefined);
    }
  }

  return (
    <span className={cn("relative inline-flex flex-col items-end gap-1", className)}>
      {/* The same button widens and changes colour instead of swapping for another: width uses a layout tween, text wraps up and down, and the hint line follows */}
      <motion.button
        type="button"
        data-slot="button"
        data-active={armed || undefined}
        disabled={disabled || pending}
        aria-busy={pending || undefined}
        layout={!reduce}
        transition={reduce ? { duration: 0 } : snappy}
        onClick={(e) => {
          e.stopPropagation();
          press();
        }}
        onKeyDown={onKeyDown}
        className={cn(base, "overflow-hidden", variants[armed ? armedVariant : variant], sizes[size])}
      >
        <AnimatePresence initial={false}>
          {pending && (
            <motion.span
              key="spin"
              layout={!reduce}
              initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduce ? 1 : 0.6, transition: reduce ? { duration: 0 } : { duration: 0.12, ease } }}
              transition={swap}
              className="inline-flex"
            >
              <Spinner />
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={armed ? "armed" : "idle"}
            layout={!reduce ? "position" : false}
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -6, transition: reduce ? { duration: 0 } : { duration: 0.12, ease } }}
            transition={swap}
            className="inline-block"
          >
            {armed ? confirmLabel : children}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <span
        role="status"
        aria-live="polite"
        className={cn(
          "relative min-h-4 max-w-64 text-right text-xs leading-4",
          notice?.tone === "error" ? "text-destructive" : notice?.tone === "success" ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {notice && (
            <motion.span
              key={notice.text}
              initial={{ opacity: 0, y: reduce ? 0 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: reduce ? { duration: 0 } : { duration: 0.12, ease } }}
              transition={swap}
              className="block"
            >
              {notice.text}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin motion-reduce:animate-none" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
    </svg>
  );
}
```

## Demo source: demo.tsx

`useDemoText(copy)` returns the entry of `copy` for the site's current language; use the English entry and pass `locale="en"`.

```tsx
"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ConfirmButton } from "./confirm-button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const copy = {
  en: { meta: "Presale signup · yesterday · Looks like test data", confirm: "Remove signup", removed: "Signup removed", remove: "Remove" },
  "zh-TW": { meta: "預購登記 · 昨天 · 看起來是測試資料", confirm: "移除登記", removed: "已移除登記", remove: "移除" },
  "zh-CN": { meta: "预购登记 · 昨天 · 看起来是测试数据", confirm: "移除登记", removed: "已移除登记", remove: "移除" },
  ja: { meta: "予約登録 · 昨日 · テストデータのようです", confirm: "登録を削除", removed: "登録を削除しました", remove: "削除" },
};

export default function ConfirmButtonDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [removed, setRemoved] = useState(false);

  return (
    <div className="flex w-full max-w-md min-w-0 items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${removed ? "text-muted-foreground line-through" : ""}`}>test+qa@example.com</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.meta}</p>
      </div>
      <ConfirmButton
        variant="ghost"
        size="xs"
        locale={locale}
        confirmLabel={t.confirm}
        disabled={removed}
        action={async () => {
          await wait(500);
          setRemoved(true);
          return { ok: true, message: t.removed };
        }}
      >
        {t.remove}
      </ConfirmButton>
    </div>
  );
}
```

# Where to write

Write exactly two files and nothing else:
- `ios/SunUIPilot/ConfirmButton.swift`: the component (and any helper it needs, all in this file, with names prefixed so they cannot collide with other files).
- `ios/SunUIPilot/ConfirmButtonDemo.swift`: `struct ConfirmButtonDemo: View`, the demo screen.
The app target is iOS 18, Swift 5 language mode. `SunUITheme.swift` is already there; do not edit it or any other file. Do not run xcodebuild (other jobs share the project). You may type-check your two files with:
`xcrun -sdk iphonesimulator swiftc -typecheck -target arm64-apple-ios18.0-simulator ios/SunUIPilot/SunUITheme.swift ios/SunUIPilot/ConfirmButton.swift ios/SunUIPilot/ConfirmButtonDemo.swift`

Work only from this document. Do not read other files in the pilot folder and do not look for the original repository. When you finish, reply with: the list of states you ported, anything in the source you could not carry over and what you did instead, and anything in this guide that was missing, wrong or unclear.