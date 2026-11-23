import SwiftUI

/// Reproduces the React demo: one signup row with a ghost, xs "Remove" confirm button.
struct ConfirmButtonDemo: View {
    @Environment(\.sunuiTheme) private var theme
    @ScaledMetric(relativeTo: .body) private var typeScale: CGFloat = 1
    @State private var removed = false

    var body: some View {
        let cardShape = RoundedRectangle(cornerRadius: 14, style: .continuous)

        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(verbatim: "test+qa@example.com")
                    .font(.system(size: 14 * typeScale, weight: .medium))
                    .strikethrough(removed)
                    .foregroundStyle(removed ? theme.mutedForeground : theme.foreground)
                    .lineLimit(1)
                    .truncationMode(.tail)
                    .frame(minHeight: 20 * typeScale)
                Text("Presale signup · yesterday · Looks like test data")
                    .font(.system(size: 12 * typeScale))
                    .foregroundStyle(theme.mutedForeground)
                    .lineLimit(1)
                    .truncationMode(.tail)
                    .frame(minHeight: 16 * typeScale)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            ConfirmButton(
                confirmLabel: "Remove signup",
                variant: .ghost,
                size: .xs,
                disabled: removed,
                locale: "en",
                action: {
                    try await Task.sleep(for: .milliseconds(500))
                    removed = true
                    return ConfirmButtonResult(ok: true, message: "Signup removed")
                }
            ) {
                Text("Remove")
            }
            .layoutPriority(1)
        }
        .padding(16)
        .frame(maxWidth: 448)
        .background(theme.card, in: cardShape)
        .overlay { cardShape.strokeBorder(theme.border, lineWidth: 1) }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(theme.background)
    }
}

#Preview {
    ConfirmButtonDemo()
}
