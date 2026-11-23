## Platform: Flutter (Dart 3, widgets only)

Use `package:flutter/widgets.dart` plus what you need from `material.dart` for `Theme` and text. No third-party packages.

### Units and type
- CSS px = logical pixels. Keep the sizes from the source; do not swap in Material control sizes or Material components (`ElevatedButton`, `Slider`).
- Text: `TextStyle(fontSize:, height: lineHeight / fontSize, fontWeight: FontWeight.w500 / w600, letterSpacing: em * fontSize)`. `tabular-nums` = `fontFeatures: [FontFeature.tabularFigures()]`. `font-mono` = `fontFamily: 'monospace'` with `fontFamilyFallback: ['Menlo', 'Courier']`. Text scales with the system setting by default; leave that on.
- Corners: `BorderRadius.circular(r)`.

### Motion
- Springs map one to one: `SpringDescription(mass: m, stiffness: k, damping: c)`. Drive an unbounded `AnimationController` with `controller.animateWith(SpringSimulation(spring, from, to, velocity))` and read `controller.value`, which may overshoot. Do not use `Curves.elasticOut` or `SpringDescription.withDampingRatio` as a stand-in.
- Tweens: `Cubic(x1, y1, x2, y2)` with the source's control points and a `Duration` in milliseconds.
- framer-motion `layout` (the same element animating to a new size) = lay out the target size, then interpolate the drawn size with the spring's value (`lerpDouble(from, to, controller.value)`). `AnimatedSize` and `AnimatedContainer` take only curves, so they cannot play a spring.
- `AnimatePresence` enter and exit = `AnimatedSwitcher` with `duration`, `reverseDuration`, `switchInCurve`, `switchOutCurve` and a `transitionBuilder`. Give each child a `ValueKey`. The out curve is applied to a reversing animation, so pass the source curve `.flipped`. One builder serves both directions: when enter and exit differ (y 6 in, y -6 out, or fade only on the way out) branch on `animation.status == AnimationStatus.reverse`. `mode="popLayout"` = a `layoutBuilder` that puts the previous children in `Positioned` inside a `Stack`, re-applying any max width, so the leaving one holds no space.
- A CSS `animate-spin` spinner = a repeating 1 second `RotationTransition`, stopped under reduced motion.
- Reduced motion: `MediaQuery.disableAnimationsOf(context)`; jump to the end value instead of animating.

### Input
- There is no hover on touch. Drop `hover:` styles. Keep pressed styles with `GestureDetector` (`onTapDown`, `onTapUp`, `onTapCancel`): `active:translate-y-px` = `Transform.translate(offset: Offset(0, 1))`, `active:scale-[0.97]` = `Transform.scale`.
- Touch targets are at least 44 x 44 where layout space allows. Flutter does not hit-test outside a parent's bounds, so the hit area can only grow into space the widget already owns (its own gap or margin); do not change the layout to reach 44.
- Pointer down / move / up on a track or a canvas (`touch-none` in the source) = a `Listener` for raw pointer events plus a `RawGestureDetector` with an `EagerGestureRecognizer`, so an enclosing scroll view cannot take the drag and a tap without movement still ends in pointer up. `GestureDetector.onPan*` loses to scrolling and turns a still tap into a cancel. Read the size with `LayoutBuilder`.
- Haptics are the one addition allowed, and only on a user action that changes state: `HapticFeedback.selectionClick()` for a snapped step, `lightImpact()` for arming or pressing, `mediumImpact()` for a result.

### Accessibility
- `aria-live="polite"` = `Semantics(liveRegion: true)` on the line (announces on Android) plus `SemanticsService.announce(text, Directionality.of(context))` on the other platforms when the text changes.
- `role="slider"` = `Semantics(slider: true, label:, value:, onIncrease:, onDecrease:)` stepping by `step`.
- `role="button"` = `Semantics(button: true, enabled:, label:)`. `aria-hidden` = `ExcludeSemantics`.

### Surfaces
- Colours come from `SunUITheme` (below), a `ThemeExtension`. If the project has no equivalent, add it as `sunui_theme.dart`; if the app already has its own colour system, point the roles at that instead. Read it with `SunUITheme.of(context)`. Never use `Theme.of(context).colorScheme` in place of a role.
- A CSS shadow maps to `BoxShadow(offset:, blurRadius: blur, spreadRadius: spread, color:)`; negative spread is supported. A 1px ring or `border` is `Border.all(width: 1)`. An inset top highlight is a 1px `Container` at the top inside a `ClipRRect`.
- HTML canvas = `CustomPainter`. `destination-out` erasing = draw inside `canvas.saveLayer` and paint the strokes with `BlendMode.clear`. There is no cheap pixel read; when the source samples pixels, track the same quantity yourself (a 64 x 64 grid of cells marked as the brush passes) and keep the same threshold semantics.

### Shape of the code
- One self-contained Dart file for the component, a `StatefulWidget`. Props become named constructor parameters with the same defaults; `ReactNode` becomes `Widget` (or `String` where the source only ever passes text); callbacks become `VoidCallback` / `ValueChanged<T>`; an awaited action is `Future<T?> Function()`.
- Controlled values (`value` + `onValueChange`) = `value` + `onChanged`, the Flutter convention; the parent rebuilds with the new value. Keep a separate `onChangeEnd` where the source has a commit callback. Uncontrolled mode is dropped.
- Timers = `Timer`, cancelled when re-armed and in `dispose`. Check `mounted` after every `await`.
- `number | [number, number]` values: two named constructors (single `double`, range `RangeValues`) over one implementation.
- Keyboard focus rings and key handlers (`focus-visible:`, `onKeyDown`) = `FocusableActionDetector` with `onShowFocusHighlight` and `Shortcuts` / `Actions`. A focus ring is a stroked rounded rect painted outside the box, not a `BoxShadow` spread.
- A `SpringSimulation` stops within tolerance of its target, not on it: snap the value when it completes, and use a tight `Tolerance` (1e-4) for a 0 to 1 fraction. A delayed spring is started from a `Timer`.
- Dashed strokes: `PathMetric.extractPath` in a loop (there is no `setLineDash`). Store strokes and grid cells in normalised coordinates so they survive a resize.
- Dart traps: `default` is a reserved word, so a `default` variant becomes `standard`. A component named like a Material widget (`RangeSlider`) needs `import 'package:flutter/material.dart' hide RangeSlider;` in files that use it. A number that prints as `5` in JavaScript prints as `5.0` in Dart: format whole numbers without the decimal. JavaScript `Math.round` rounds halves up, Dart's `.round()` rounds them away from zero: use `(x + 0.5).floor()`.

```dart
// sunui_theme.dart
import 'package:flutter/material.dart';

/// SunUI colour roles. Defaults match the shadcn neutral theme; replace them with the app's own colours.
@immutable
class SunUITheme extends ThemeExtension<SunUITheme> {
  const SunUITheme({
    required this.background, required this.foreground, required this.card, required this.cardForeground,
    required this.muted, required this.mutedForeground, required this.primary, required this.primaryForeground,
    required this.secondary, required this.secondaryForeground, required this.border, required this.input,
    required this.ring, required this.destructive, required this.spot, required this.spotForeground, required this.success,
  });

  final Color background, foreground, card, cardForeground, muted, mutedForeground, primary, primaryForeground;
  final Color secondary, secondaryForeground, border, input, ring, destructive, spot, spotForeground, success;

  static const light = SunUITheme(
    background: Color(0xFFFFFFFF), foreground: Color(0xFF0A0A0A), card: Color(0xFFFFFFFF), cardForeground: Color(0xFF0A0A0A),
    muted: Color(0xFFF5F5F5), mutedForeground: Color(0xFF737373), primary: Color(0xFF171717), primaryForeground: Color(0xFFFAFAFA),
    secondary: Color(0xFFF5F5F5), secondaryForeground: Color(0xFF171717), border: Color(0xFFE5E5E5), input: Color(0xFFE5E5E5),
    ring: Color(0xFFA1A1A1), destructive: Color(0xFFE7000B), spot: Color(0xFF171717), spotForeground: Color(0xFFFAFAFA), success: Color(0xFF1F9D55),
  );

  static const dark = SunUITheme(
    background: Color(0xFF0A0A0A), foreground: Color(0xFFFAFAFA), card: Color(0xFF171717), cardForeground: Color(0xFFFAFAFA),
    muted: Color(0xFF262626), mutedForeground: Color(0xFFA1A1A1), primary: Color(0xFFE5E5E5), primaryForeground: Color(0xFF171717),
    secondary: Color(0xFF262626), secondaryForeground: Color(0xFFFAFAFA), border: Color(0x1AFFFFFF), input: Color(0x26FFFFFF),
    ring: Color(0xFF737373), destructive: Color(0xFFFF6467), spot: Color(0xFFE5E5E5), spotForeground: Color(0xFF171717), success: Color(0xFF4CD68A),
  );

  /// The theme's extension if the app registered one, otherwise the default for the current brightness.
  static SunUITheme of(BuildContext context) =>
      Theme.of(context).extension<SunUITheme>() ?? (Theme.of(context).brightness == Brightness.dark ? dark : light);

  @override
  SunUITheme copyWith({Color? spot, Color? spotForeground}) => SunUITheme(
    background: background, foreground: foreground, card: card, cardForeground: cardForeground, muted: muted, mutedForeground: mutedForeground,
    primary: primary, primaryForeground: primaryForeground, secondary: secondary, secondaryForeground: secondaryForeground, border: border,
    input: input, ring: ring, destructive: destructive, spot: spot ?? this.spot, spotForeground: spotForeground ?? this.spotForeground, success: success,
  );

  @override
  SunUITheme lerp(ThemeExtension<SunUITheme>? other, double t) => t < 0.5 || other is! SunUITheme ? this : other;
}
```
