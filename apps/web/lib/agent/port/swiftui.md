## Platform: SwiftUI (iOS 17+)

### Units and type
- CSS px = points. Keep the sizes from the source; do not swap in system control sizes.
- Fonts: `.system(size:weight:)` at the source size, wrapped so Dynamic Type still scales (`@ScaledMetric` on the size, or `Font.system(size:).leading(...)` with `relativeTo`). `tabular-nums` = `.monospacedDigit()`. `font-mono` = `.system(design: .monospaced)`. Letter spacing in em = `.tracking(em × fontSize)`.
- Corners: `RoundedRectangle(cornerRadius:, style: .continuous)`.

<!-- only:motion -->
### Motion
- Springs map one to one: `.interpolatingSpring(mass: m, stiffness: k, damping: c)`. snappy = `(mass: 1, stiffness: 520, damping: 34)`, gentle = `(1, 240, 30)`, pop = `(0.8, 620, 20)`. Do not use `.spring()`, `.bouncy` or `.snappy` presets.
- Tweens: `.timingCurve(x1, y1, x2, y2, duration:)` with the source's control points and seconds.
- framer-motion `layout` (an element animating to its new size or position) = animate the state change with `withAnimation` / `.animation(_, value:)` so the same view resizes. For an element shared between two places use `matchedGeometryEffect`.
- `AnimatePresence` enter and exit = conditional view with `.transition(.asymmetric(insertion:removal:))`; give each swapped child a distinct `.id` so SwiftUI treats it as a new view. `initial y: 6, exit y: -6` = `.offset(y:)` combined with `.opacity`. `mode="popLayout"` means the leaving child must not hold layout space: put the children in a `ZStack`.
- A CSS `animate-spin` spinner = a `Circle().trim` rotating with `.linear(duration: 1).repeatForever(autoreverses: false)`; stop it under Reduce Motion.
- Reduced motion: `@Environment(\.accessibilityReduceMotion)`; pass `nil` animation or zero duration.
<!-- end -->

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
<!-- only:canvas -->
- HTML canvas = SwiftUI `Canvas`. `destination-out` erasing = draw the strokes with `.blendMode(.destinationOut)` inside a `.compositingGroup()`. There is no `getImageData`; when the source samples pixels, track the same quantity yourself (for example a coarse grid of cells marked as the brush passes) and keep the same threshold semantics.
<!-- end -->

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
<!-- only:motion -->
- **Two timings on one view.** When width springs while colour tweens over 150ms and opacity is instant, do not wrap them in one `withAnimation`. Use the scoped `.animation(_:body:)` per property, or stack layers and animate each. Enter and exit with different durations = `AnyTransition.animation(_:)` on each side of `.asymmetric`.
<!-- end -->
- **Touch has no blur.** A visual the source shows on focus (a value bubble that stays after click) shows only while the finger is down; keep it for hardware-keyboard and VoiceOver focus.
- **44pt targets.** Layout size stays as in the source; the hit area may overflow it (`.contentShape` with negative insets, or an invisible larger frame overlaid).
- **Shadows with negative spread** (`0 4px 12px -6px`) have no equivalent: halve the radius again.
- **`<details>` / `<summary>`** = a button row with a triangle that turns 90 degrees, toggling instantly as the browser does; add `.accessibilityValue` for expanded and collapsed.
- **`aria-roledescription`, form `name`, hidden inputs, cursors, `stopPropagation`**: no equivalent, drop them. `name` may become `accessibilityIdentifier`.
- **Uncontrolled mode** (`defaultValue` with no `value`) is dropped: the `Binding` is required.
- **Responsive variants** (`md:grid-cols-2`) = `horizontalSizeClass == .regular`.
- **Swift traps.** Parameters named `min` / `max` shadow the global functions: call `Swift.min`. JavaScript `Math.round` rounds halves up, `.rounded()` rounds them away from zero: use `(x + 0.5).rounded(.down)`.
- **Result haptics** (`.success`, `.error`) may fire when the awaited action finishes; that still counts as the user's action.
- **`aria-pressed`** = `.accessibilityAddTraits(.isToggle)` plus `.isSelected` when on. **`aria-current="step"`** = `.isSelected`. **`role="spinbutton"`** on a text field = label, value and `.accessibilityAdjustableAction` on the field.
- **Typography passed through `className`** (size, weight, tracking, line height on the block itself) becomes explicit parameters with the demo's values as defaults, or the environment font where the block is meant to inherit. CSS line height = `.lineSpacing(lineHeight - fontLineHeight)` plus half of that as vertical padding.
<!-- only:scroll -->
- **Scroll-linked motion** (`useScroll` + `useTransform`): read the element's frame in the nearest scroll view with `onGeometryChange` and `proxy.bounds(of: .scrollView)`. framer's offset `["start 0.85", "end 0.45"]` means progress = `(0.85 * H - top) / (height + 0.4 * H)` with H the scroll view's height, clamped to 0...1. Style per word with one `Text` built from an `AttributedString`, not one view per word.
<!-- end -->
- **Container queries** (`@container`, `@min-[420px]:`) = the component measures its own width with `onGeometryChange`. Viewport units and `IntersectionObserver` = the same measurement against the scroll view or screen bounds; a `requestAnimationFrame` loop = `TimelineView(.animation)`.
- **A drag inside a scroll view** (`touch-pan-y`, press and hold): attach it with `.simultaneousGesture` and lock the axis, so a mostly vertical move hands over to scrolling. React to touch down at once; do not wait for the finger to lift.
<!-- only:input -->
- **Several inputs acting as one field** (a code with one box per digit): one invisible `UITextField` subclass over the row with `deleteBackward` overridden and `textContentType = .oneTimeCode`. SwiftUI's `TextField` cannot see Backspace on an empty field. Do not register a `UIKeyCommand` for `UIKeyCommand.inputDelete`: on iOS that is the backspace key of a hardware keyboard, and a command for it takes the press away from `deleteBackward`. A tap picks the nearest cell; each cell is its own accessibility element.
<!-- end -->
<!-- only:motion -->
- **A keyframe array** (`x: [0, -6, 5, -3, 2, 0]` with one duration and ease) is evenly spaced, with the ease applied to each segment: `keyframeAnimator` with one `LinearKeyframe(_, duration:, timingCurve:)` per step.
<!-- end -->
- **A corner badge that scales in and out** must not lose its size while it leaves, or the corner offset jumps: keep an invisible copy that holds the layout. Use 0.001 instead of a scale of exactly 0.
- **A `key` change that remounts with an `initial` value** (a number that starts at scale 1.35 and settles) = `.id(key)` on a child that keeps its start value in `@State` and animates in `onAppear`.
- **An exit whose direction depends on current state** (a rolling digit): a plain `.transition(.asymmetric(...))` bakes the direction in at the previous render. Read the direction from a reference box in a custom `Transition`.
- **Content that swaps instantly inside an element that animates its layout** (`layout` with `layout="position"`): keep every face in the tree in a small custom `Layout` where only the active one takes space, and switch opacity with a scoped `.animation(nil) { }`, so the same views slide instead of cross-fading.
- **`flex-wrap`** and **a child that hugs its content up to a maximum width** each need a small custom `Layout`. **`backdrop-blur`** on a small label: use a plain translucent fill; a system material changes the tint. **A translate by a fraction of the element's own size** (a badge hung off a corner with `translate-x-1/3 -translate-y-1/3`) = pin the element to that corner with `.overlay(alignment: .topTrailing)` and shift it with `.visualEffect { content, proxy in content.offset(x: proxy.size.width / 3, y: -proxy.size.height / 3) }`. An `alignmentGuide` inside the overlay had no effect when we tested it.
- **SVG paths** are converted to absolute `Path` commands by hand; `transformBox: fill-box` means the scale origin is the path's own bounding box.
- **An `onClick` that may or may not return a Promise** = two initialisers, one taking `() async throws -> Void` and one taking `(() -> Void)?`. **Milliseconds** stay milliseconds in the parameter names, or become `Duration` with the same default.
