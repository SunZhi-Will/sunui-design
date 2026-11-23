## Platform: React Native (Reanimated + Gesture Handler)

This is still React. Keep the hooks, state logic, timers, props, callbacks and message tables of the source as they are. Only rendering, styling and animation change.

### What the project needs
- `react-native-reanimated` and `react-native-gesture-handler` (both ship with Expo). `react-native-svg` for icons and drawing. Check the installed versions in `node_modules` before using an API you are unsure of; do not add other packages.
- The app root wrapped in `GestureHandlerRootView`.

### Units and type
- CSS px = density-independent points. Turn each Tailwind class into `StyleSheet` values using the numbers in this guide; do not assume NativeWind.
- All text sits inside `<Text>`. `tabular-nums` = `fontVariant: ["tabular-nums"]`. `font-mono` = `fontFamily: Platform.select({ ios: "Menlo", default: "monospace" })`. `tracking` in em = `letterSpacing: em * fontSize`. Leave font scaling on (`allowFontScaling` default).
- `gap`, `flexDirection: "row"`, `alignItems`, `justifyContent` replace the flex classes. The default flex direction is column.

### Motion
- Springs map one to one: `withSpring(value, { stiffness: 520, damping: 34, mass: 1 })`. Do not use the `duration`-based spring config.
- Tweens: `withTiming(value, { duration: ms, easing: Easing.bezier(x1, y1, x2, y2) })` with the source's control points.
- framer-motion `animate` following state = a shared value updated in `useEffect`, read in `useAnimatedStyle`. A percentage target (`left: "40%"`) becomes pixels from the width measured in `onLayout`, moved with `translateX`.
- `layout` (the same element animating to a new size) = `layout={LinearTransition.springify().stiffness(520).damping(34)}` on an `Animated.View`.
- `AnimatePresence` enter and exit = the `entering` and `exiting` props. For `initial y: 6, opacity: 0` use a custom entering worklet that returns `{ initialValues, animations }` with `withTiming`; give each swapped child a `key`. With `mode="popLayout"` nothing more is needed: a view that is exiting is already out of layout in Reanimated.
- A CSS `animate-spin` spinner = `withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1)`, stopped under reduced motion.
- Reduced motion: `useReducedMotion()` from `react-native-reanimated`; set values directly instead of animating.

### Input
- There is no hover. Drop `hover:` styles. Keep pressed styles with `Pressable` (`style={({ pressed }) => ...}`): `active:translate-y-px` = `transform: [{ translateY: 1 }]`, `active:scale-[0.97]` = scale 0.97.
- Touch targets are at least 44 x 44. If the visual is smaller, use `hitSlop` rather than changing how it looks.
- Pointer down / move / up on a track or a canvas = a pan gesture with `minDistance: 0` that runs on the JS thread. In gesture-handler 3 that is the hook `usePanGesture({ minDistance: 0, runOnJS: true, onBegin, onActivate, onUpdate, onFinalize })`; the `Gesture.Pan()` builder of version 2 still type-checks there but is deprecated, and its `onStart` is the hook's `onActivate`. `onFinalize` tells you whether the gesture was cancelled. Read the width with `onLayout`. Handle the activation callback (`onActivate`, or `onStart` in the builder) as a move too: the event that activates the pan carries a position, and skipping it loses the first stretch of a stroke. When the source sets `touch-none` (a scratch surface, a slider track), the pan must win over an enclosing scroll view from the first touch: read the installed gesture-handler's types for the way to block an outer scroll gesture (the scroll view may be React Native's own, not gesture-handler's), and say in your report that this needs a check on a device. Update events are coalesced: when the source reacts to every pointer move (a scratch stroke, a coverage grid), join each point to the previous one and mark everything along that segment, not just the reported point.
- Haptics only if `expo-haptics` is already installed, and only on a user action that changes state.
- Keyboard handlers have no touch equivalent; cover them through accessibility actions.

### Accessibility
- `aria-live="polite"` = `accessibilityLiveRegion="polite"` on Android, and `AccessibilityInfo.announceForAccessibility(text)` on iOS only when the text changes. Doing both on Android speaks twice.
- `role="slider"` = `accessibilityRole="adjustable"`, `accessibilityValue={{ min, max, now, text }}`, `accessibilityActions` increment and decrement handled in `onAccessibilityAction`.
- `aria-busy`, `disabled` = `accessibilityState={{ busy, disabled }}`. `aria-hidden` = `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`.

### Surfaces
- Colours come from `useSunUITheme()` (below). If the project has no equivalent, add it as `sunui-theme.ts`; if the app already has its own colour system, point the roles at that instead.
- A CSS shadow: use the `boxShadow` style string where the installed React Native supports it (0.76 and later with the new architecture); otherwise `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius: blur / 2` on iOS and nothing on Android. A 1px ring or `border` is `borderWidth: StyleSheet.hairlineWidth` or 1.
- HTML canvas = `react-native-svg`. `destination-out` erasing = the cover inside a `<Mask>` whose strokes are black paths. There is no pixel read; when the source samples pixels, track the same quantity yourself (a 64 x 64 grid of cells marked as the brush passes) and keep the same threshold semantics.

### Shape of the code
- One self-contained `.tsx` file for the component, same props and defaults. `ReactNode` props stay `ReactNode`. `className` is replaced by a `style` prop.
- Uncontrolled and controlled modes both stay, as in the source.
- Hidden form inputs, `name`, cursors and `stopPropagation` have no equivalent: drop them.
- Text does not inherit colour: every `Text` sets its own, and string children passed as `ReactNode` must be wrapped in `<Text>`. An absolutely placed label inside a small parent wraps at the parent's width, so give it its own wide, centred anchor (`whitespace-nowrap`). `StyleSheet.absoluteFillObject` is gone in current React Native; use `StyleSheet.absoluteFill`.
- An SVG `pathLength` draw-in = `strokeDasharray` and `strokeDashoffset` through `useAnimatedProps`, with the path length worked out by hand. `<details>` = a `Pressable` with `accessibilityState={{ expanded }}`.

```ts
// sunui-theme.ts
import { useColorScheme } from "react-native";

const light = {
  background: "#ffffff", foreground: "#0a0a0a", card: "#ffffff", cardForeground: "#0a0a0a", muted: "#f5f5f5", mutedForeground: "#737373",
  primary: "#171717", primaryForeground: "#fafafa", secondary: "#f5f5f5", secondaryForeground: "#171717", border: "#e5e5e5", input: "#e5e5e5",
  ring: "#a1a1a1", destructive: "#e7000b", spot: "#171717", spotForeground: "#fafafa", success: "#1f9d55",
};

const dark: typeof light = {
  background: "#0a0a0a", foreground: "#fafafa", card: "#171717", cardForeground: "#fafafa", muted: "#262626", mutedForeground: "#a1a1a1",
  primary: "#e5e5e5", primaryForeground: "#171717", secondary: "#262626", secondaryForeground: "#fafafa", border: "rgba(255,255,255,0.10)",
  input: "rgba(255,255,255,0.15)", ring: "#737373", destructive: "#ff6467", spot: "#e5e5e5", spotForeground: "#171717", success: "#4cd68a",
};

export type SunUITheme = typeof light & { isDark: boolean };

/** SunUI colour roles. Defaults match the shadcn neutral theme; replace them with the app's own colours. */
export function useSunUITheme(): SunUITheme {
  const isDark = useColorScheme() === "dark";
  return { ...(isDark ? dark : light), isDark };
}

/** `bg-foreground/10` and friends: a role at NN% opacity. Takes a hex role or one that is already rgba. */
export function alpha(color: string, opacity: number) {
  const rgba = color.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const [r, g, b, a = "1"] = rgba[1].split(",").map((part) => part.trim());
    return `rgba(${r},${g},${b},${Number(a) * opacity})`;
  }
  const n = parseInt(color.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacity})`;
}
```
