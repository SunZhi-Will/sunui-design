## Platform: SwiftUI (iOS 17+)

### Units and type
- CSS px = points. Keep the sizes from the source; do not swap in system control sizes.
- Fonts: `.system(size:weight:)` at the source size, wrapped so Dynamic Type still scales (`@ScaledMetric` on the size, or `Font.system(size:).leading(...)` with `relativeTo`). `tabular-nums` = `.monospacedDigit()`. `font-mono` = `.system(design: .monospaced)`. Letter spacing in em = `.tracking(em × fontSize)`.
- Corners: `RoundedRectangle(cornerRadius:, style: .continuous)`.

### Motion
- Springs map one to one: `.interpolatingSpring(mass: m, stiffness: k, damping: c)`. snappy = `(mass: 1, stiffness: 520, damping: 34)`, gentle = `(1, 240, 30)`, pop = `(0.8, 620, 20)`. Do not use `.spring()`, `.bouncy` or `.snappy` presets.
- Tweens: `.timingCurve(x1, y1, x2, y2, duration:)` with the source's control points and seconds.
- framer-motion `layout` (an element animating to its new size or position) = animate the state change with `withAnimation` / `.animation(_, value:)` so the same view resizes. For an element shared between two places use `matchedGeometryEffect`.
- `AnimatePresence` enter and exit = conditional view with `.transition(.asymmetric(insertion:removal:))`; give each swapped child a distinct `.id` so SwiftUI treats it as a new view. `initial y: 6, exit y: -6` = `.offset(y:)` combined with `.opacity`. `mode="popLayout"` means the leaving child must not hold layout space: put the children in a `ZStack`.
- A CSS `animate-spin` spinner = a `Circle().trim` rotating with `.linear(duration: 1).repeatForever(autoreverses: false)`; stop it under Reduce Motion.
- Reduced motion: `@Environment(\.accessibilityReduceMotion)`; pass `nil` animation or zero duration.

### Input
- There is no hover. Drop `hover:` styles. Keep pressed styles: read `configuration.isPressed` in a `ButtonStyle` (`active:translate-y-px` = `.offset(y: 1)`, `active:scale-[0.97]` = `.scaleEffect(0.97)` with snappy).
- Touch targets are at least 44×44 pt. If the visual is smaller, enlarge the hit area with `.contentShape` and padding or a larger frame, without changing how it looks.
- Pointer down / move / up on a track = `DragGesture(minimumDistance: 0)`; read the track width with `GeometryReader` or `onGeometryChange`.
- Haptics are the one addition allowed, and only on a user action that changes state: `.sensoryFeedback(.selection, trigger:)` for a snapped step, `.impact(weight: .light)` for arming or pressing, `.success` / `.error` for a result. Never on a timer.
- Keyboard handlers have no touch equivalent; cover them through accessibility actions instead (below). `Escape` to cancel = `.accessibilityAction(.escape)`.

### Accessibility
- `aria-live="polite"` = `AccessibilityNotification.Announcement(text).post()` when the text changes.
- `role="slider"` = `.accessibilityElement()` + `.accessibilityLabel` + `.accessibilityValue` + `.accessibilityAdjustableAction` stepping by `step`.
- `aria-busy`, `disabled` = `.disabled(_)` and a value or hint describing the busy state. `aria-hidden` = `.accessibilityHidden(true)`.

### Surfaces
- Colours come from `SunUITheme` (below). If the project has no equivalent, add it as `SunUITheme.swift`; if the app already has its own colour system, point the roles at that instead. Read it with `@Environment(\.sunuiTheme)`. Never use `Color.accentColor`, `.primary`, `.secondary` or system fills in place of a role.
- A CSS shadow with blur B is about `.shadow(radius: B / 2)`. A 1px ring (`0 0 0 1px`) or `border` is an `.overlay` of `strokeBorder(lineWidth: 1)`. An inset top highlight is an overlay stroke masked to the top edge.
- HTML canvas = SwiftUI `Canvas`. `destination-out` erasing = draw the strokes with `.blendMode(.destinationOut)` inside a `.compositingGroup()`. There is no `getImageData`; when the source samples pixels, track the same quantity yourself (for example a coarse grid of cells marked as the brush passes) and keep the same threshold semantics.

### Shape of the code
- One self-contained Swift file for the component. Props become `init` parameters with the same defaults; `ReactNode` children become `@ViewBuilder` closures (or `String` where the source only ever passes text); callbacks become closures; an `async` action stays `async`.
- Controlled values (`value` + `onValueChange`) = `Binding`. Keep a separate commit callback where the source has one.
- Timers = `Task` with `Task.sleep`, cancelled when re-armed and in `onDisappear`.
- Generic `number | [number, number]` values: offer two initialisers (single `Binding<Double>`, range `Binding<ClosedRange<Double>>`) over one shared implementation.

```swift
// SunUITheme.swift
import SwiftUI

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        self.init(.sRGB, red: Double((hex >> 16) & 0xff) / 255, green: Double((hex >> 8) & 0xff) / 255, blue: Double(hex & 0xff) / 255, opacity: opacity)
    }
}

/// SunUI colour roles. Defaults match the shadcn neutral theme; replace them with the app's own colours.
struct SunUITheme {
    var background, foreground, card, cardForeground, muted, mutedForeground: Color
    var primary, primaryForeground, secondary, secondaryForeground: Color
    var border, input, ring, destructive, spot, spotForeground, success: Color

    static func resolve(_ scheme: ColorScheme) -> SunUITheme {
        scheme == .dark
            ? SunUITheme(
                background: Color(hex: 0x0a0a0a), foreground: Color(hex: 0xfafafa), card: Color(hex: 0x171717), cardForeground: Color(hex: 0xfafafa),
                muted: Color(hex: 0x262626), mutedForeground: Color(hex: 0xa1a1a1),
                primary: Color(hex: 0xe5e5e5), primaryForeground: Color(hex: 0x171717), secondary: Color(hex: 0x262626), secondaryForeground: Color(hex: 0xfafafa),
                border: Color.white.opacity(0.10), input: Color.white.opacity(0.15), ring: Color(hex: 0x737373), destructive: Color(hex: 0xff6467),
                spot: Color(hex: 0xe5e5e5), spotForeground: Color(hex: 0x171717), success: Color(hex: 0x4cd68a))
            : SunUITheme(
                background: Color(hex: 0xffffff), foreground: Color(hex: 0x0a0a0a), card: Color(hex: 0xffffff), cardForeground: Color(hex: 0x0a0a0a),
                muted: Color(hex: 0xf5f5f5), mutedForeground: Color(hex: 0x737373),
                primary: Color(hex: 0x171717), primaryForeground: Color(hex: 0xfafafa), secondary: Color(hex: 0xf5f5f5), secondaryForeground: Color(hex: 0x171717),
                border: Color(hex: 0xe5e5e5), input: Color(hex: 0xe5e5e5), ring: Color(hex: 0xa1a1a1), destructive: Color(hex: 0xe7000b),
                spot: Color(hex: 0x171717), spotForeground: Color(hex: 0xfafafa), success: Color(hex: 0x1f9d55))
    }
}

private struct SunUIThemeOverrideKey: EnvironmentKey {
    static let defaultValue: SunUITheme? = nil
}

extension EnvironmentValues {
    var sunuiThemeOverride: SunUITheme? {
        get { self[SunUIThemeOverrideKey.self] }
        set { self[SunUIThemeOverrideKey.self] = newValue }
    }
    /// Follows the colour scheme unless an override is set: `.environment(\.sunuiTheme, myTheme)`.
    var sunuiTheme: SunUITheme {
        get { sunuiThemeOverride ?? SunUITheme.resolve(colorScheme) }
        set { sunuiThemeOverride = newValue }
    }
}
```

### Details that came up in testing
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
