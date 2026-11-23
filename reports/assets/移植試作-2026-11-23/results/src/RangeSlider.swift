import SwiftUI

/// Ticks: `.count(n)` means n equal divisions (n + 1 dots), `.values` gives explicit positions.
enum SunUIRangeSliderTicks {
    case count(Int)
    case values([Double])
}

/// SunUI Range Slider. One thumb for a `Binding<Double>`, two for a `Binding<ClosedRange<Double>>`.
/// The binding is written continuously while dragging; `onValueCommit` fires once on release
/// or after a keyboard / accessibility step.
struct RangeSlider: View {
    @Environment(\.sunuiTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.colorScheme) private var colorScheme

    private let isRange: Bool
    private let read: () -> [Double]
    private let write: (_ next: [Double], _ commit: Bool) -> Void
    private let minValue: Double
    private let maxValue: Double
    private let step: Double
    private let minGap: Double
    private let format: (Double) -> String
    private let ticks: SunUIRangeSliderTicks?
    private let showTooltip: Bool
    private let label: String?
    private let name: String?
    private let thumbLabels: [String]?
    private let disabled: Bool

    /// Index of the thumb under the finger, nil when idle.
    @State private var dragging: Int?
    @State private var hapticStep = 0
    @GestureState private var touching = false
    /// Hardware keyboard focus (the source's `focused` state).
    @FocusState private var keyFocus: Int?
    /// VoiceOver / Switch Control focus also counts as focused.
    @AccessibilityFocusState private var axFocus: Int?
    @ScaledMetric(relativeTo: .subheadline) private var textSM: CGFloat = 14
    @ScaledMetric(relativeTo: .caption) private var textXS: CGFloat = 12

    private static let snappy = Animation.interpolatingSpring(mass: 1, stiffness: 520, damping: 34)
    /// Visual track height (h-6) and the taller touch area around it.
    private static let trackHeight: CGFloat = 24
    private static let hitHeight: CGFloat = 44

    // MARK: Initialisers

    /// Single value.
    init(
        value: Binding<Double>,
        onValueChange: ((Double) -> Void)? = nil,
        onValueCommit: ((Double) -> Void)? = nil,
        min: Double = 0,
        max: Double = 100,
        step: Double = 1,
        format: ((Double) -> String)? = nil,
        ticks: SunUIRangeSliderTicks? = nil,
        showTooltip: Bool = true,
        label: String? = nil,
        name: String? = nil,
        thumbLabels: [String]? = nil,
        disabled: Bool = false
    ) {
        self.isRange = false
        self.read = { [value.wrappedValue] }
        self.write = { next, commit in
            if value.wrappedValue != next[0] { value.wrappedValue = next[0] }
            onValueChange?(next[0])
            if commit { onValueCommit?(next[0]) }
        }
        self.minValue = min
        self.maxValue = max
        self.step = step
        self.minGap = 0
        self.format = format ?? RangeSlider.defaultFormat
        self.ticks = ticks
        self.showTooltip = showTooltip
        self.label = label
        self.name = name
        self.thumbLabels = thumbLabels
        self.disabled = disabled
    }

    /// Range: `value.lowerBound` is the low thumb, `value.upperBound` the high thumb.
    init(
        value: Binding<ClosedRange<Double>>,
        onValueChange: ((ClosedRange<Double>) -> Void)? = nil,
        onValueCommit: ((ClosedRange<Double>) -> Void)? = nil,
        min: Double = 0,
        max: Double = 100,
        step: Double = 1,
        minGap: Double = 0,
        format: ((Double) -> String)? = nil,
        ticks: SunUIRangeSliderTicks? = nil,
        showTooltip: Bool = true,
        label: String? = nil,
        name: String? = nil,
        thumbLabels: [String]? = nil,
        disabled: Bool = false
    ) {
        self.isRange = true
        self.read = { [value.wrappedValue.lowerBound, value.wrappedValue.upperBound] }
        self.write = { next, commit in
            let out = Swift.min(next[0], next[1])...Swift.max(next[0], next[1])
            if value.wrappedValue != out { value.wrappedValue = out }
            onValueChange?(out)
            if commit { onValueCommit?(out) }
        }
        self.minValue = min
        self.maxValue = max
        self.step = step
        self.minGap = minGap
        self.format = format ?? RangeSlider.defaultFormat
        self.ticks = ticks
        self.showTooltip = showTooltip
        self.label = label
        self.name = name
        self.thumbLabels = thumbLabels
        self.disabled = disabled
    }

    /// The source default `(n) => n`: whole numbers print without a fraction.
    static func defaultFormat(_ n: Double) -> String {
        n == n.rounded() && abs(n) < 1e15 ? String(Int(n)) : String(n)
    }

    // MARK: Maths (same as the source)

    private var values: [Double] { read() }

    private func clamp(_ n: Double, _ lo: Double, _ hi: Double) -> Double {
        Swift.min(hi, Swift.max(lo, n))
    }

    /// Position 0...1 along the track.
    private func pct(_ n: Double) -> Double {
        maxValue == minValue ? 0 : (n - minValue) / (maxValue - minValue)
    }

    private func snap(_ n: Double) -> Double {
        // Math.round rounds halves up.
        let steps = ((n - minValue) / step + 0.5).rounded(.down)
        return clamp(steps * step + minValue, minValue, maxValue)
    }

    /// Number of decimals in `step`, used to clean floating point noise (`toFixed`).
    private var decimals: Int {
        if step == step.rounded() { return 0 }
        let text = String(step)
        if text.contains("e") { return 10 }
        return text.split(separator: ".").dropFirst().first?.count ?? 0
    }

    private func setThumb(_ index: Int, _ raw: Double, commit: Bool = false) {
        var next = values
        let scale = pow(10, Double(decimals))
        var v = (snap(raw) * scale).rounded() / scale
        if isRange {
            v = index == 0 ? Swift.min(v, next[1] - minGap) : Swift.max(v, next[0] + minGap)
        }
        if next[index] == v && !commit { return }
        let moved = next[index] != v
        next[index] = v
        write(next, commit)
        if moved && dragging != nil { hapticStep += 1 }
    }

    private func fromPointer(_ x: CGFloat, width: CGFloat) -> Double {
        guard width > 0 else { return minValue }
        return minValue + clamp(Double(x / width), 0, 1) * (maxValue - minValue)
    }

    private func trackDown(_ raw: Double) {
        if disabled { return }
        let v = values
        let index: Int
        if !isRange {
            index = 0
        } else if raw <= v[0] {
            index = 0
        } else if raw >= v[1] {
            index = 1
        } else {
            index = raw - v[0] < v[1] - raw ? 0 : 1
        }
        dragging = index
        setThumb(index, raw)
    }

    private func trackUp() {
        guard dragging != nil else { return }
        write(values, true)
        dragging = nil
    }

    private func handleKey(_ key: KeyEquivalent, index: Int) -> KeyPress.Result {
        let big = Swift.max(step, (maxValue - minValue) / 10)
        let current = values[index]
        let target: Double
        switch key {
        case .rightArrow, .upArrow: target = current + step
        case .leftArrow, .downArrow: target = current - step
        case .pageUp: target = current + big
        case .pageDown: target = current - big
        case .home: target = minValue
        case .end: target = maxValue
        default: return .ignored
        }
        setThumb(index, target, commit: true)
        return .handled
    }

    private var tickList: [Double] {
        switch ticks {
        case .count(let n)?:
            guard n > 0 else { return [] }
            return (0...n).map { minValue + (maxValue - minValue) * Double($0) / Double(n) }
        case .values(let list)?:
            return list
        case nil:
            return []
        }
    }

    /// Instant while dragging or under Reduce Motion, snappy otherwise.
    private var transition: Animation? {
        reduceMotion || dragging != nil ? nil : RangeSlider.snappy
    }

    private func isFocused(_ i: Int) -> Bool { keyFocus == i || axFocus == i }

    private func thumbLabel(_ i: Int) -> String? {
        if isRange {
            guard let given = thumbLabels, !given.isEmpty else { return i == 0 ? "Minimum" : "Maximum" }
            return given.count == 1 ? given[0] : given[i]
        }
        if let given = thumbLabels, given.count == 1 { return given[0] }
        return label
    }

    // MARK: Body

    var body: some View {
        let v = values
        VStack(spacing: 0) {
            if let label {
                HStack(alignment: .firstTextBaseline, spacing: 12) {
                    Text(label)
                        .font(.system(size: textSM, weight: .medium))
                        .foregroundStyle(theme.foreground)
                    Spacer(minLength: 0)
                    Text(isRange ? "\(format(v[0])) – \(format(v[1]))" : format(v[0]))
                        .font(.system(size: textSM))
                        .monospacedDigit()
                        .foregroundStyle(theme.mutedForeground)
                }
                .frame(minHeight: 20)
                .padding(.bottom, 12)
            }
            track(v)
        }
        .frame(maxWidth: .infinity)
        .opacity(disabled ? 0.5 : 1)
        .allowsHitTesting(!disabled)
        .disabled(disabled)
        .sensoryFeedback(.selection, trigger: hapticStep)
        .onChange(of: touching) { _, now in
            if !now { trackUp() }
        }
        .onDisappear { dragging = nil }
    }

    private func track(_ v: [Double]) -> some View {
        let lo = isRange ? pct(v[0]) : 0
        let hi = pct(isRange ? v[1] : v[0])
        let midY = RangeSlider.hitHeight / 2
        let t = transition
        return GeometryReader { geo in
            let w = geo.size.width
            ZStack {
                Capsule()
                    .fill(theme.foreground.opacity(0.10))
                    .frame(width: w, height: 4)
                    .position(x: w / 2, y: midY)
                Capsule()
                    .fill(theme.spot)
                    .frame(width: Swift.max(0, CGFloat(hi - lo) * w), height: 4)
                    .position(x: CGFloat(lo + hi) / 2 * w, y: midY)
                    .animation(t, value: lo)
                    .animation(t, value: hi)
                ForEach(Array(tickList.enumerated()), id: \.offset) { _, tick in
                    let p = pct(tick)
                    Circle()
                        .fill(p >= lo && p <= hi ? theme.card : theme.foreground.opacity(0.30))
                        .frame(width: 4, height: 4)
                        .position(x: CGFloat(p) * w, y: midY)
                        .accessibilityHidden(true)
                }
                ForEach(Array(v.enumerated()), id: \.offset) { i, value in
                    thumb(i, value, all: v, width: w, animation: t)
                }
            }
            .frame(width: w, height: RangeSlider.hitHeight)
            // The thumbs overhang the track by 10pt at each end; keep them grabbable.
            .contentShape(Rectangle().size(width: w + 20, height: RangeSlider.hitHeight).offset(x: -10))
            .gesture(
                DragGesture(minimumDistance: 0)
                    .updating($touching) { _, state, _ in state = true }
                    .onChanged { g in
                        let raw = fromPointer(g.location.x, width: w)
                        if let index = dragging {
                            setThumb(index, raw)
                        } else {
                            trackDown(raw)
                        }
                    }
            )
        }
        .frame(height: RangeSlider.hitHeight)
        // 44pt touch area, 24pt layout height as in the source.
        .padding(.vertical, -(RangeSlider.hitHeight - RangeSlider.trackHeight) / 2)
    }

    private func thumb(_ i: Int, _ value: Double, all v: [Double], width w: CGFloat, animation t: Animation?) -> some View {
        let active = dragging == i || isFocused(i)
        return Circle()
            .fill(theme.card)
            .overlay(Circle().strokeBorder(theme.spot, lineWidth: 1.5))
            .overlay {
                // focus-visible: 2px outline, 2px offset. Keyboard focus only.
                if keyFocus == i {
                    Circle()
                        .strokeBorder(theme.foreground, lineWidth: 2)
                        .frame(width: 28, height: 28)
                }
            }
            .frame(width: 20, height: 20)
            .overlay(alignment: .top) {
                if showTooltip && active {
                    bubble(value)
                        .fixedSize()
                        .alignmentGuide(.top) { $0[.bottom] + 8 }
                        .transition(.identity)
                        .allowsHitTesting(false)
                        .accessibilityHidden(true)
                }
            }
            .scaleEffect(dragging == i && !reduceMotion ? 1.15 : 1)
            .frame(width: 44, height: 44)
            .contentShape(Circle())
            .focusable(!disabled)
            .focused($keyFocus, equals: i)
            .focusEffectDisabled()
            .onKeyPress(phases: [.down, .repeat]) { press in
                handleKey(press.key, index: i)
            }
            .accessibilityElement()
            .accessibilityLabel(Text(thumbLabel(i) ?? ""))
            .accessibilityValue(Text(format(value)))
            .accessibilityAdjustableAction { direction in
                guard !disabled else { return }
                switch direction {
                case .increment: setThumb(i, values[i] + step, commit: true)
                case .decrement: setThumb(i, values[i] - step, commit: true)
                @unknown default: break
                }
            }
            .accessibilityFocused($axFocus, equals: i)
            .accessibilityIdentifier(fieldName(i) ?? "")
            .position(x: CGFloat(pct(value)) * w, y: RangeSlider.hitHeight / 2)
            .zIndex(active ? 20 : 10)
            .animation(t, value: value)
            .animation(t, value: dragging)
    }

    /// Form field names of the source's hidden inputs: `name`, or `name-min` / `name-max` for a range.
    private func fieldName(_ i: Int) -> String? {
        guard let name else { return nil }
        return isRange ? "\(name)-\(i == 0 ? "min" : "max")" : name
    }

    private func bubble(_ value: Double) -> some View {
        let shape = RoundedRectangle(cornerRadius: 6, style: .continuous)
        return Text(format(value))
            .font(.system(size: textXS))
            .monospacedDigit()
            .foregroundStyle(theme.foreground)
            .lineLimit(1)
            .frame(minHeight: 16)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(
                shape
                    .fill(theme.card)
                    .shadow(color: colorScheme == .dark ? .clear : Color.black.opacity(0.05), radius: 1, x: 0, y: 1)
            )
            .overlay {
                if colorScheme == .dark {
                    // inset 0 1px 0 white/6%: a 1px highlight just inside the top border.
                    RoundedRectangle(cornerRadius: 5, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
                        .padding(1)
                        .mask(alignment: .top) { Rectangle().frame(height: 2) }
                }
            }
            .overlay(shape.strokeBorder(theme.foreground.opacity(0.10), lineWidth: 1))
    }
}
