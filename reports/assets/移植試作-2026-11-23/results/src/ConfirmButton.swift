import SwiftUI

// SunUI "Confirm Button" (confirm-button), SwiftUI port.
// Press twice to confirm, with no modal: the first press arms the button, swaps its label to the
// outcome and shows a short notice. A second press within `armDuration` runs the action and the
// result appears in the status line under the button.

enum ConfirmButtonVariant {
    case `default`, outline, secondary, ghost, destructive, link
}

enum ConfirmButtonSize {
    case `default`, xs, sm, lg
}

/// Same shape as the source's ConfirmResult: ok plus a human-readable message.
/// An action that returns nothing (nil) counts as success.
struct ConfirmButtonResult {
    var ok: Bool
    var message: String?

    init(ok: Bool, message: String? = nil) {
        self.ok = ok
        self.message = message
    }
}

/// Overrides for the built-in strings. They take priority over `locale`.
struct ConfirmButtonLabels {
    /// Hint after the first press; {label} is replaced with confirmLabel
    var armedNotice: String?
    /// On success when the action gave no message
    var done: String?
    /// When the action throws
    var failed: String?

    init(armedNotice: String? = nil, done: String? = nil, failed: String? = nil) {
        self.armedNotice = armedNotice
        self.done = done
        self.failed = failed
    }
}

struct ConfirmButton<Label: View>: View {
    private let confirmLabel: String
    private let armDuration: Duration
    private let noticeDuration: Duration
    private let unavailableMessage: String?
    private let variant: ConfirmButtonVariant
    private let armedVariant: ConfirmButtonVariant
    private let size: ConfirmButtonSize
    private let disabled: Bool
    private let locale: String
    private let labels: ConfirmButtonLabels?
    private let action: @MainActor () async throws -> ConfirmButtonResult?
    private let label: Label

    @Environment(\.sunuiTheme) private var theme
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// 1 at the default text size; scales type and heights with Dynamic Type.
    @ScaledMetric(relativeTo: .body) private var typeScale: CGFloat = 1

    @State private var armed = false
    @State private var pending = false
    @State private var notice: SunUIConfirmNotice?
    @State private var noticeTask: Task<Void, Never>?
    @State private var armTask: Task<Void, Never>?
    @State private var alive = true
    @State private var armTick = 0
    @State private var resultTick = 0
    @State private var resultOK = true

    /// - Parameters:
    ///   - confirmLabel: Button text while awaiting confirmation; name it by the outcome ("Remove signup"), not "OK".
    ///   - armDuration: Time limit for the second press. 2.5 seconds in the original.
    ///   - noticeDuration: How long the hint stays. 1.8 seconds in the original.
    ///   - unavailableMessage: When set, a press shows only this line and never arms.
    ///   - armedVariant: Style swapped in while armed.
    ///   - locale: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK or ja-JP are accepted too.
    ///   - labels: Override the built-in strings; takes priority over locale.
    ///   - action: Called on the second press. Returning `ok: false` or throwing both count as failure.
    ///   - label: Normal button content; name the action itself, e.g. "Remove".
    init(
        confirmLabel: String,
        armDuration: Duration = .milliseconds(2500),
        noticeDuration: Duration = .milliseconds(1800),
        unavailableMessage: String? = nil,
        variant: ConfirmButtonVariant = .outline,
        armedVariant: ConfirmButtonVariant = .destructive,
        size: ConfirmButtonSize = .default,
        disabled: Bool = false,
        locale: String = "en",
        labels: ConfirmButtonLabels? = nil,
        action: @escaping @MainActor () async throws -> ConfirmButtonResult?,
        @ViewBuilder label: () -> Label
    ) {
        self.confirmLabel = confirmLabel
        self.armDuration = armDuration
        self.noticeDuration = noticeDuration
        self.unavailableMessage = unavailableMessage
        self.variant = variant
        self.armedVariant = armedVariant
        self.size = size
        self.disabled = disabled
        self.locale = locale
        self.labels = labels
        self.action = action
        self.label = label()
    }

    /// For an action that returns nothing: finishing counts as success, throwing as failure.
    init(
        confirmLabel: String,
        armDuration: Duration = .milliseconds(2500),
        noticeDuration: Duration = .milliseconds(1800),
        unavailableMessage: String? = nil,
        variant: ConfirmButtonVariant = .outline,
        armedVariant: ConfirmButtonVariant = .destructive,
        size: ConfirmButtonSize = .default,
        disabled: Bool = false,
        locale: String = "en",
        labels: ConfirmButtonLabels? = nil,
        action: @escaping @MainActor () async throws -> Void,
        @ViewBuilder label: () -> Label
    ) {
        self.init(
            confirmLabel: confirmLabel, armDuration: armDuration, noticeDuration: noticeDuration,
            unavailableMessage: unavailableMessage, variant: variant, armedVariant: armedVariant,
            size: size, disabled: disabled, locale: locale, labels: labels,
            action: { () async throws -> ConfirmButtonResult? in
                try await action()
                return nil
            },
            label: label
        )
    }

    // MARK: Motion (copied from the source)

    /// Layout spring of the button: stiffness 520, damping 34, mass 1.
    private var layoutAnimation: Animation? {
        reduceMotion ? nil : .interpolatingSpring(mass: 1, stiffness: 520, damping: 34)
    }
    /// Enter tween: 0.18 s, expo-out.
    private var enterAnimation: Animation? {
        reduceMotion ? nil : .timingCurve(0.23, 1, 0.32, 1, duration: 0.18)
    }
    /// Exit tween: 0.12 s, expo-out.
    private var exitAnimation: Animation? {
        reduceMotion ? nil : .timingCurve(0.23, 1, 0.32, 1, duration: 0.12)
    }
    /// Tailwind's default colour transition on the button: 150 ms, cubic-bezier(0.4, 0, 0.2, 1).
    private var colourAnimation: Animation { .timingCurve(0.4, 0, 0.2, 1, duration: 0.15) }

    private var labelTransition: AnyTransition {
        reduceMotion
            ? .identity
            : .asymmetric(
                insertion: .sunuiConfirmSwap(y: 6).animation(enterAnimation),
                removal: .sunuiConfirmSwap(y: -6).animation(exitAnimation)
            )
    }
    private var spinnerTransition: AnyTransition {
        reduceMotion
            ? .identity
            : .asymmetric(
                insertion: .sunuiConfirmSwap(scale: 0.6).animation(enterAnimation),
                removal: .sunuiConfirmSwap(scale: 0.6).animation(exitAnimation)
            )
    }
    private var noticeTransition: AnyTransition {
        reduceMotion
            ? .identity
            : .asymmetric(
                insertion: .sunuiConfirmSwap(y: 4).animation(enterAnimation),
                removal: .sunuiConfirmSwap().animation(exitAnimation)
            )
    }

    // MARK: Body

    var body: some View {
        let metrics = SunUIConfirmMetrics(size)
        let messages = resolvedMessages
        let isDisabled = disabled || pending
        let shape = RoundedRectangle(cornerRadius: metrics.radius, style: .continuous)

        VStack(alignment: .trailing, spacing: 4) {
            // The same button widens and changes colour instead of swapping for another.
            Button(action: { press(messages) }) {
                HStack(spacing: metrics.gap) {
                    if pending {
                        SunUIConfirmSpinner(size: metrics.icon * typeScale, spinning: !reduceMotion)
                            .foregroundStyle(foreground(variant))
                            .transition(spinnerTransition)
                    }
                    // popLayout: the leaving label must not hold layout space
                    ZStack {
                        if armed {
                            Text(confirmLabel)
                                .foregroundStyle(foreground(armedVariant))
                                .transition(labelTransition)
                        } else {
                            label
                                .foregroundStyle(foreground(variant))
                                .transition(labelTransition)
                        }
                    }
                }
                .font(.system(size: metrics.fontSize * typeScale, weight: .medium))
                .lineLimit(1)
                .fixedSize()
                // +1 on each side is the source's 1px (transparent) border, which sits inside the height
                .padding(.horizontal, metrics.paddingX + 1)
                .frame(minHeight: metrics.height * typeScale)
                .background {
                    ZStack {
                        SunUIConfirmChrome(variant: variant, shape: shape, theme: theme, dark: colorScheme == .dark)
                            .animation(colourAnimation) { $0.opacity(armed ? 0 : 1) }
                        SunUIConfirmChrome(variant: armedVariant, shape: shape, theme: theme, dark: colorScheme == .dark)
                            .animation(colourAnimation) { $0.opacity(armed ? 1 : 0) }
                    }
                }
                .clipShape(shape)
            }
            .buttonStyle(SunUIConfirmPressStyle())
            .disabled(isDisabled)
            // disabled:opacity-50, not part of the source's colour transition, so it switches at once
            .animation(nil) { $0.opacity(isDisabled ? 0.5 : 1) }
            .onKeyPress(.escape) {
                guard armed else { return .ignored }
                cancelArmed()
                return .handled
            }
            .accessibilityAction(.escape) {
                if armed { cancelArmed() }
            }
            .sensoryFeedback(.impact(weight: .light), trigger: armTick)
            .sensoryFeedback(trigger: resultTick) { _, _ in resultOK ? .success : .error }

            // role="status": the text is announced from flash()
            SunUIConfirmNoticeLayout(maxWidth: 256) {
                if let notice {
                    Text(notice.text)
                        .font(.system(size: 12 * typeScale))
                        .multilineTextAlignment(.trailing)
                        .fixedSize(horizontal: false, vertical: true)
                        .transition(noticeTransition)
                        .id(notice.text)
                }
            }
            .foregroundStyle(noticeColour)
            .frame(minHeight: 16 * typeScale, alignment: .topTrailing)
        }
        .onAppear { alive = true }
        .onDisappear {
            alive = false
            noticeTask?.cancel()
            armTask?.cancel()
        }
    }

    // MARK: Colours

    private var noticeColour: Color {
        switch notice?.tone {
        case .error: return theme.destructive
        case .success: return theme.foreground
        default: return theme.mutedForeground
        }
    }

    private func foreground(_ v: ConfirmButtonVariant) -> Color {
        switch v {
        case .default: return theme.primaryForeground
        case .outline, .ghost, .secondary: return theme.foreground
        case .destructive: return theme.destructive
        case .link: return theme.primary
        }
    }

    // MARK: Copy

    private var resolvedMessages: SunUIConfirmMessages {
        var m = SunUIConfirmMessages.builtIn(for: locale)
        if let v = labels?.armedNotice { m.armedNotice = v }
        if let v = labels?.done { m.done = v }
        if let v = labels?.failed { m.failed = v }
        return m
    }

    // MARK: Behaviour

    private func flash(_ text: String, tone: SunUIConfirmNotice.Tone = .info) {
        withAnimation(enterAnimation) {
            notice = SunUIConfirmNotice(text: text, tone: tone)
        }
        AccessibilityNotification.Announcement(text).post()
        noticeTask?.cancel()
        let wait = noticeDuration
        noticeTask = Task { @MainActor in
            try? await Task.sleep(for: wait)
            guard !Task.isCancelled else { return }
            withAnimation(exitAnimation) { notice = nil }
        }
    }

    /// Escape while armed: disarm and clear the hint.
    private func cancelArmed() {
        armTask?.cancel()
        withAnimation(layoutAnimation) { armed = false }
        noticeTask?.cancel()
        withAnimation(exitAnimation) { notice = nil }
    }

    /// The first press only earns a hint line; a second press within armDuration runs the action.
    private func press(_ t: SunUIConfirmMessages) {
        if pending { return }
        if let unavailableMessage, !unavailableMessage.isEmpty {
            flash(unavailableMessage)
            return
        }
        if !armed {
            withAnimation(layoutAnimation) { armed = true }
            armTick += 1
            flash(t.armedNotice.replacingOccurrences(of: "{label}", with: confirmLabel.lowercased()))
            armTask?.cancel()
            let wait = armDuration
            armTask = Task { @MainActor in
                try? await Task.sleep(for: wait)
                guard !Task.isCancelled else { return }
                withAnimation(layoutAnimation) { armed = false }
            }
            return
        }
        armTask?.cancel()
        withAnimation(layoutAnimation) {
            armed = false
            pending = true
        }
        // Like the source, the action itself is not cancelled when the view goes away; only its result is dropped.
        Task { @MainActor in
            var text = t.failed
            var tone = SunUIConfirmNotice.Tone.error
            do {
                let res = try await action()
                if res == nil || res?.ok == true {
                    text = res?.message ?? t.done
                    tone = .success
                } else {
                    text = res?.message ?? t.failed
                }
            } catch {}
            guard alive else { return }
            resultOK = tone == .success
            resultTick += 1
            flash(text, tone: tone)
            withAnimation(layoutAnimation) { pending = false }
        }
    }
}

extension ConfirmButton where Label == Text {
    /// Plain-text label.
    init(
        _ title: String,
        confirmLabel: String,
        armDuration: Duration = .milliseconds(2500),
        noticeDuration: Duration = .milliseconds(1800),
        unavailableMessage: String? = nil,
        variant: ConfirmButtonVariant = .outline,
        armedVariant: ConfirmButtonVariant = .destructive,
        size: ConfirmButtonSize = .default,
        disabled: Bool = false,
        locale: String = "en",
        labels: ConfirmButtonLabels? = nil,
        action: @escaping @MainActor () async throws -> ConfirmButtonResult?
    ) {
        self.init(
            confirmLabel: confirmLabel, armDuration: armDuration, noticeDuration: noticeDuration,
            unavailableMessage: unavailableMessage, variant: variant, armedVariant: armedVariant,
            size: size, disabled: disabled, locale: locale, labels: labels,
            action: action,
            label: { Text(title) }
        )
    }
}

// MARK: - Helpers

private struct SunUIConfirmNotice: Equatable {
    enum Tone { case info, success, error }
    var text: String
    var tone: Tone
}

private struct SunUIConfirmMessages {
    var armedNotice: String
    var done: String
    var failed: String

    /// Map any language tag to one of the four built-in languages; everything else falls back to English.
    static func builtIn(for tag: String) -> SunUIConfirmMessages {
        let t = tag.lowercased()
        if t.hasPrefix("zh") {
            let traditional = ["hant", "tw", "hk", "mo"].contains { t.contains($0) }
            return traditional
                ? SunUIConfirmMessages(armedNotice: "再按一次以{label}", done: "完成", failed: "沒有成功，請再試一次。")
                : SunUIConfirmMessages(armedNotice: "再按一次以{label}", done: "完成", failed: "没有成功，请再试一次。")
        }
        if t.hasPrefix("ja") {
            return SunUIConfirmMessages(armedNotice: "もう一度押すと{label}", done: "完了しました", failed: "うまくいきませんでした。もう一度お試しください。")
        }
        return SunUIConfirmMessages(armedNotice: "Press again to {label}", done: "Done", failed: "That didn't work. Please try again.")
    }
}

/// Sizes from the source's `sizes` table (1 Tailwind unit = 4 pt).
private struct SunUIConfirmMetrics {
    var height: CGFloat
    var gap: CGFloat
    var paddingX: CGFloat
    var fontSize: CGFloat
    var radius: CGFloat
    var icon: CGFloat

    init(_ size: ConfirmButtonSize) {
        switch size {
        case .default: self.init(height: 32, gap: 6, paddingX: 10, fontSize: 14, radius: 10, icon: 16)
        case .xs: self.init(height: 24, gap: 4, paddingX: 8, fontSize: 12, radius: 8, icon: 12)
        case .sm: self.init(height: 28, gap: 4, paddingX: 10, fontSize: 12.8, radius: 8, icon: 14)
        case .lg: self.init(height: 36, gap: 6, paddingX: 10, fontSize: 14, radius: 10, icon: 16)
        }
    }

    private init(height: CGFloat, gap: CGFloat, paddingX: CGFloat, fontSize: CGFloat, radius: CGFloat, icon: CGFloat) {
        self.height = height
        self.gap = gap
        self.paddingX = paddingX
        self.fontSize = fontSize
        self.radius = radius
        self.icon = icon
    }
}

/// Fill and 1px border of one variant.
private struct SunUIConfirmChrome: View {
    var variant: ConfirmButtonVariant
    var shape: RoundedRectangle
    var theme: SunUITheme
    var dark: Bool

    var body: some View {
        shape
            .fill(fill)
            .overlay { shape.strokeBorder(border, lineWidth: 1) }
    }

    private var fill: Color {
        switch variant {
        case .default: return theme.primary
        case .outline: return dark ? theme.input.opacity(0.3) : theme.background
        case .secondary: return theme.secondary
        case .ghost, .link: return .clear
        case .destructive: return theme.destructive.opacity(dark ? 0.2 : 0.1)
        }
    }

    private var border: Color {
        variant == .outline ? (dark ? theme.input : theme.border) : .clear
    }
}

/// active:translate-y-px, plus a hit area of at least 44 x 44 pt that does not change the layout.
private struct SunUIConfirmPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .offset(y: configuration.isPressed ? 1 : 0)
            .contentShape(SunUIConfirmHitShape())
    }
}

private struct SunUIConfirmHitShape: Shape {
    func path(in rect: CGRect) -> Path {
        let dx = max(0, (44 - rect.width) / 2)
        let dy = max(0, (44 - rect.height) / 2)
        return Path(rect.insetBy(dx: -dx, dy: -dy))
    }
}

/// The source's SVG arc: radius 9 in a 24 box, stroke 2, round caps, 288 degrees, one turn per second.
private struct SunUIConfirmSpinner: View {
    var size: CGFloat
    var spinning: Bool
    @State private var turned = false

    var body: some View {
        Circle()
            .trim(from: 0, to: 0.8)
            .stroke(style: StrokeStyle(lineWidth: size * 2 / 24, lineCap: .round))
            .frame(width: size * 18 / 24, height: size * 18 / 24)
            .frame(width: size, height: size)
            .rotationEffect(.degrees(turned ? 360 : 0))
            .onAppear {
                guard spinning else { return }
                withAnimation(.linear(duration: 1).repeatForever(autoreverses: false)) { turned = true }
            }
            .accessibilityHidden(true)
    }
}

private struct SunUIConfirmSwapModifier: ViewModifier {
    var y: CGFloat
    var scale: CGFloat
    var opacity: Double

    func body(content: Content) -> some View {
        content.scaleEffect(scale).offset(y: y).opacity(opacity)
    }
}

private extension AnyTransition {
    /// Fades from or to transparent, optionally offset or scaled.
    static func sunuiConfirmSwap(y: CGFloat = 0, scale: CGFloat = 1) -> AnyTransition {
        .modifier(
            active: SunUIConfirmSwapModifier(y: y, scale: scale, opacity: 0),
            identity: SunUIConfirmSwapModifier(y: 0, scale: 1, opacity: 1)
        )
    }
}

/// The status line: shrinks to its text, wraps at `maxWidth`, pins children to the top trailing
/// corner, and lets an entering and a leaving line overlap instead of stacking.
private struct SunUIConfirmNoticeLayout: Layout {
    var maxWidth: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = min(proposal.width ?? maxWidth, maxWidth)
        var size = CGSize.zero
        for subview in subviews {
            let s = subview.sizeThatFits(ProposedViewSize(width: width, height: nil))
            size.width = max(size.width, s.width)
            size.height = max(size.height, s.height)
        }
        return size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for subview in subviews {
            subview.place(
                at: CGPoint(x: bounds.maxX, y: bounds.minY),
                anchor: .topTrailing,
                proposal: ProposedViewSize(width: bounds.width, height: nil)
            )
        }
    }
}
